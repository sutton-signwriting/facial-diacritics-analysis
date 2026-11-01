"""Regex-only extraction and the explicitly provisional mapping profile v0.1."""

from __future__ import annotations

import bisect
from dataclasses import dataclass
from html import unescape
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
PROFILE = "direct-symbol-order-v0.1"
KEY = r"S[123][0-9a-f]{2}[0-5][0-9a-f]"
COORD = r"[0-9]{3}x[0-9]{3}"
SIGN_RE = re.compile(rf"(?:A(?:{KEY})+)?[BLMR]{COORD}(?:{KEY}{COORD})+")
SPATIAL_RE = re.compile(rf"({KEY})([0-9]{{3}})x([0-9]{{3}})")
ENTRY_RE = re.compile(r"<entry\b[^>]*\bid\s*=\s*['\"]([^'\"]+)['\"][^>]*>")
ENTRY_END_RE = re.compile(r"</entry\s*>")
TITLE_RE = re.compile(r"<term\b[^>]*>(.*?)</term\s*>", re.S)


@dataclass(frozen=True)
class Symbol:
    key: str
    x: int
    y: int

    @property
    def base(self) -> int:
        return int(self.key[1:4], 16)


def load_sizes(path: Path = ROOT / "assets/symbol-sizes.json") -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def query_range(query: str) -> tuple[int, int]:
    match = re.fullmatch(r"QR([123][0-9a-f]{2})t([123][0-9a-f]{2})", query)
    if not match:
        raise ValueError("This processor supports range queries such as QR2fft36c.")
    low, high = (int(part, 16) for part in match.groups())
    if low > high:
        raise ValueError("Query range is reversed.")
    return low, high


def signbox(fsw: str) -> str:
    return re.sub(rf"^A(?:{KEY})+", "", fsw)


def symbols(fsw: str) -> list[Symbol]:
    return [Symbol(key, int(x), int(y)) for key, x, y in SPATIAL_RE.findall(signbox(fsw))]


def normalize_face(items: list[Symbol], box: str, sizes: dict) -> str:
    """Match font-ttf.signNormalize on this all-head/face subset.

    Bounds include glyph width/height, not just stored anchors. Apply one
    integer translation to all anchors, preserving order and relative geometry.
    """
    if not items:
        raise ValueError("Cannot normalize an empty face.")
    missing = sorted({s.key for s in items if s.key not in sizes})
    if missing:
        raise ValueError("Unknown ISWA symbol size: " + ", ".join(missing))
    left = min(s.x for s in items)
    top = min(s.y for s in items)
    right = max(s.x + sizes[s.key][0] for s in items)
    bottom = max(s.y + sizes[s.key][1] for s in items)
    # All symbols in QR2fft36c lie in both font-ttf centering ranges.
    dx = int((left + right) / 2) - 500
    dy = int((top + bottom) / 2) - 500
    coords = [(s.x - dx, s.y - dy) for s in items]
    extent = (right - dx, bottom - dy)
    if any(not 250 <= n <= 749 for pair in [extent, *coords] for n in pair):
        raise ValueError("Normalized coordinates exceed the FSW 250..749 domain.")
    return box + f"{extent[0]:03}x{extent[1]:03}" + "".join(
        s.key + f"{x:03}x{y:03}" for s, (x, y) in zip(items, coords)
    )


def unicode_symbol(key: str) -> str:
    """Official base + non-inherent fill/rotation; not SWU code points."""
    base, fill, rotation = int(key[1:4], 16), int(key[4], 16), int(key[5], 16)
    result = chr(0x1D700 + base)
    if fill:
        result += chr(0x1DA9A + fill)
    if rotation:
        result += chr(0x1DAA0 + rotation)
    return result


def unicode_face(items: list[Symbol]) -> tuple[str, bool]:
    """Move the first complete HEAD block to front, or prepend default HEAD.

    Keep all remaining symbols in source order, including additional heads.
    Do not infer associations, decompose resources, or invent geometry.
    """
    head = next((i for i, s in enumerate(items) if s.base == 0x2FF), None)
    if head is None:
        return chr(0x1D9FF) + "".join(unicode_symbol(s.key) for s in items), True
    ordered = [items[head], *items[:head], *items[head + 1 :]]
    return "".join(unicode_symbol(s.key) for s in ordered), False


def title_of(text: str) -> str | None:
    # Only inspect the collection header, never use entry prose as a title.
    header = re.split(r"<entry\b", text, maxsplit=1)[0]
    match = TITLE_RE.search(header)
    if not match:
        return None
    title = match[1].replace("<![CDATA[", "").replace("]]>", "")
    return re.sub(r"<[^>]+>", "", unescape(title)).strip()[:200]


def extract(text: str, sizes: dict, query: str = "QR2fft36c") -> tuple[list, dict]:
    low, high = query_range(query)
    # The normalizer's centering rule is specified only for the requested face range.
    if (low, high) != (0x2FF, 0x36C):
        raise ValueError("Face normalization currently requires QR2fft36c.")
    starts = [(m.start(), m[1]) for m in ENTRY_RE.finditer(text)]
    start_positions = [position for position, _ in starts]
    end_positions = [m.start() for m in ENTRY_END_RE.finditer(text)]
    rows, errors = [], []
    stats = dict(signs_scanned=0, matching_signs=0, excluded_head_only=0)
    for match in SIGN_RE.finditer(text):
        stats["signs_scanned"] += 1
        original = match[0]
        fsw = signbox(original)
        selected = [s for s in symbols(fsw) if low <= s.base <= high]
        if not selected:
            continue
        stats["matching_signs"] += 1
        if len(selected) == 1 and selected[0].base == 0x2FF:
            stats["excluded_head_only"] += 1
            continue
        index = bisect.bisect_right(start_positions, match.start()) - 1
        entry_id = None
        if index >= 0:
            previous_end = bisect.bisect_right(end_positions, match.start()) - 1
            if previous_end < 0 or end_positions[previous_end] < starts[index][0]:
                entry_id = starts[index][1]
        witness = dict(source_offset=match.start(), entry_id=entry_id, source_fsw=original)
        try:
            face = normalize_face(selected, fsw[0], sizes)
        except ValueError as error:
            errors.append({**witness, "error": str(error)})
            continue
        uni, inserted = unicode_face(selected)
        head_count = sum(s.base == 0x2FF for s in selected)
        noncombining = sorted({s.key for s in selected if s.base != 0x2FF
                              and unicodedata.category(chr(0x1D700 + s.base)) != "Mn"})
        flags = []
        if head_count > 1:
            flags.append("multiple-heads")
        if noncombining:
            flags.append("noncombining-resource")
        rows.append(dict(
            fsw=fsw, **{"fsw-face": face, "uni-face": uni}, **witness,
            diacritics=sum(s.base != 0x2FF for s in selected),
            head_count=head_count, head_inserted=inserted, flags=flags,
        ))
    return rows, {**stats, "errors": errors}
