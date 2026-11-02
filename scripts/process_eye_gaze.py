#!/usr/bin/env python3
"""List source signboxes with S321..S329 at nonzero fill, without a count cutoff."""

import argparse
import bisect
from collections import Counter
import csv
from hashlib import sha256
import json
from pathlib import Path

from facial_pipeline import (
    ROOT, PROFILE, SIGN_RE, ENTRY_RE, ENTRY_END_RE, EXCLUDED_COLLECTION_IDS,
    EXCLUDED_FACE_BASES, load_sizes, normalize_face, signbox, symbols, title_of,
    unicode_face,
)

ANALYSIS_ID = 'eye-gaze-nonzero-fill-v0.1'
SELECTION = {'gaze_bases': [f'S{base:03x}' for base in range(0x321, 0x32a)],
             'gaze_fills': [1, 2, 3, 4, 5], 'match': 'at-least-one-positioned-symbol',
             'min_diacritics': None, 'exclude_private_collections': True,
             'excluded_face_bases': [f'S{base:03x}' for base in sorted(EXCLUDED_FACE_BASES)]}
FIELDS = ['fsw', 'fsw-face', 'uni-face', 'source_file', 'entry_id', 'source_offset',
          'gaze-keys', 'gaze-positions']


def extract_eye_gaze(text, sizes):
    starts = [(m.start(), m[1]) for m in ENTRY_RE.finditer(text)]
    positions = [p for p, _ in starts]
    ends = [m.start() for m in ENTRY_END_RE.finditer(text)]
    rows = []
    audit = dict(signs_scanned=0, gaze_signs=0, excluded_fill_zero_only=0,
                 matched_gaze_symbols=0, mixed_gaze_fills=0, normalization_errors=0,
                 unknown_gaze_variants=0)
    for match in SIGN_RE.finditer(text):
        audit['signs_scanned'] += 1
        fsw = signbox(match[0])
        spatial = symbols(fsw)
        gaze = [s for s in spatial if 0x321 <= s.base <= 0x329]
        if not gaze:
            continue
        audit['gaze_signs'] += 1
        selected = [s for s in gaze if s.key[4] != '0']
        if not selected:
            audit['excluded_fill_zero_only'] += 1
            continue
        audit['matched_gaze_symbols'] += len(selected)
        mixed = any(s.key[4] == '0' for s in gaze)
        audit['mixed_gaze_fills'] += mixed
        face_items = [s for s in spatial if 0x2ff <= s.base <= 0x36c
                      and s.base not in EXCLUDED_FACE_BASES]
        flags = []
        error = None
        try:
            face = normalize_face(face_items, fsw[0], sizes)
        except ValueError as exc:
            # Selection is based on the source, not on whether a view can render.
            face = ''
            error = str(exc)
            audit['normalization_errors'] += 1
            flags.append('face-normalization-error')
        unknown = sorted({s.key for s in selected if s.key not in sizes})
        if unknown:
            audit['unknown_gaze_variants'] += 1
            flags.append('unknown-gaze-variant')
        uni, inserted = unicode_face(face_items)
        heads = sum(s.base == 0x2ff for s in face_items)
        if heads > 1:
            flags.append('multiple-heads')
        if mixed:
            flags.append('also-fill-zero-gaze')
        index = bisect.bisect_right(positions, match.start()) - 1
        previous_end = bisect.bisect_right(ends, match.start()) - 1
        entry_id = None
        if index >= 0 and (previous_end < 0 or ends[previous_end] < starts[index][0]):
            entry_id = starts[index][1]
        rows.append(dict(
            fsw=fsw, **{'fsw-face': face, 'uni-face': uni},
            source_fsw=match[0], source_offset=match.start(), entry_id=entry_id,
            diacritics=sum(s.base != 0x2ff for s in face_items),
            head_count=heads, head_inserted=inserted, flags=flags,
            gaze_matches=[dict(key=s.key, x=s.x, y=s.y) for s in selected],
            gaze_symbols=[dict(key=s.key, x=s.x, y=s.y) for s in gaze],
            normalization_error=error, unknown_gaze_keys=unknown,
        ))
    return rows, audit


def csv_record(record, source_file):
    return {**{key: record[key] for key in FIELDS[:3]},
            'source_file': source_file, 'entry_id': record['entry_id'],
            'source_offset': record['source_offset'],
            'gaze-keys': ' '.join(s['key'] for s in record['gaze_matches']),
            'gaze-positions': ' '.join(f"{s['key']}{s['x']:03}x{s['y']:03}"
                                       for s in record['gaze_matches'])}


def process(source: Path, output: Path):
    if not source.is_dir():
        raise ValueError(f'Source directory does not exist: {source}')
    inputs = sorted((p for p in source.iterdir() if p.is_file() and not p.name.startswith('.')),
                    key=lambda p: p.name)
    if len({p.stem for p in inputs}) != len(inputs):
        raise ValueError('Input basenames collide; each file needs a distinct stem.')
    for name in ('raw', 'metadata'):
        (output / name).mkdir(parents=True, exist_ok=True)
    sizes, files, excluded = load_sizes(), [], []
    with (output / 'all.csv').open('w', encoding='utf-8', newline='') as combined:
        all_writer = csv.DictWriter(combined, fieldnames=FIELDS, lineterminator='\n')
        all_writer.writeheader()
        for path in inputs:
            data = path.read_bytes()
            text = data.decode('utf-8-sig')
            title = title_of(text)
            if path.stem in EXCLUDED_COLLECTION_IDS or (title and 'private' in title.casefold()):
                excluded.append(dict(id=path.stem, source_file=path.name, title=title,
                                     reason='private-collection', source_sha256=sha256(data).hexdigest()))
                (output / 'raw' / f'{path.stem}.csv').unlink(missing_ok=True)
                (output / 'metadata' / f'{path.stem}.json').unlink(missing_ok=True)
                continue
            records, audit = extract_eye_gaze(text, sizes)
            csv_rows = [csv_record(r, path.name) for r in records]
            with (output / 'raw' / f'{path.stem}.csv').open('w', encoding='utf-8', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=FIELDS, lineterminator='\n')
                writer.writeheader()
                writer.writerows(csv_rows)
            all_writer.writerows(csv_rows)
            info = dict(id=path.stem, source_file=path.name, title=title,
                        source_sha256=sha256(data).hexdigest(), source_bytes=len(data),
                        rows=len(records), unique_fsw=len({r['fsw'] for r in records}),
                        head_inserted=sum(r['head_inserted'] for r in records),
                        multiple_heads=sum(r['head_count'] > 1 for r in records),
                        diacritics=dict(sorted(Counter(r['diacritics'] for r in records).items())),
                        gaze_keys=dict(sorted(Counter(s['key'] for r in records for s in r['gaze_matches']).items())),
                        publication_review_required=False, **audit)
            (output / 'metadata' / f'{path.stem}.json').write_text(
                json.dumps({'file': info, 'records': records}, ensure_ascii=False, separators=(',', ':')) + '\n')
            files.append(info)
            print(f'{path.name}: {len(records):,} nonzero-fill gaze occurrences', flush=True)
    fields = ('rows', 'unique_fsw', 'head_inserted', 'multiple_heads', 'signs_scanned',
              'gaze_signs', 'excluded_fill_zero_only', 'matched_gaze_symbols',
              'mixed_gaze_fills', 'normalization_errors', 'unknown_gaze_variants')
    # unique_fsw is reported per file; do not sum it into a corpus-wide unique count.
    totals = {key: sum(f[key] for f in files) for key in fields if key != 'unique_fsw'}
    report = dict(analysis_id=ANALYSIS_ID, profile=PROFILE, selection=SELECTION,
                  query='S32[1-9][1-5][0-9a-f] at a spatial coordinate',
                  excluded_collections=excluded, files=files, totals=totals)
    (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(totals, indent=2))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'data/source')
    parser.add_argument('--output', type=Path, default=ROOT / 'data/eye-gaze')
    args = parser.parse_args()
    try:
        process(args.source, args.output)
    except (OSError, ValueError) as error:
        parser.exit(1, f'Error: {error}\n')
