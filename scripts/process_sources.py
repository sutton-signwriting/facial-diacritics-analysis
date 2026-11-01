#!/usr/bin/env python3
"""Process every regular input file as text; never download or parse XML."""

import argparse
from collections import Counter
import csv
from hashlib import sha256
import json
from pathlib import Path
import unicodedata

from facial_pipeline import ROOT, PROFILE, extract, load_sizes, title_of


def process(source: Path, output: Path, metadata: Path, report: Path) -> dict:
    if not source.is_dir():
        raise ValueError(f"Source directory does not exist: {source}")
    files = sorted((p for p in source.iterdir() if p.is_file() and not p.name.startswith('.')),
                   key=lambda p: p.name)
    if len({p.stem for p in files}) != len(files):
        raise ValueError("Input basenames collide; each file needs a distinct stem.")
    output.mkdir(parents=True, exist_ok=True)
    metadata.mkdir(parents=True, exist_ok=True)
    sizes, reports = load_sizes(), []
    for path in files:
        data = path.read_bytes()
        text = data.decode('utf-8-sig')
        rows, audit = extract(text, sizes)
        title = title_of(text)
        with (output / f"{path.stem}.csv").open('w', encoding='utf-8', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=['fsw', 'fsw-face', 'uni-face'],
                                    extrasaction='ignore', lineterminator='\n')
            writer.writeheader()
            writer.writerows(rows)
        review = bool(title and 'private' in title.casefold())
        info = dict(
            id=path.stem, source_file=path.name, title=title,
            source_sha256=sha256(data).hexdigest(), source_bytes=len(data),
            rows=len(rows), unique_fsw=len({r['fsw'] for r in rows}),
            head_inserted=sum(r['head_inserted'] for r in rows),
            multiple_heads=sum(r['head_count'] > 1 for r in rows),
            noncombining_resources=sum('noncombining-resource' in r['flags'] for r in rows),
            diacritics=dict(sorted(Counter(r['diacritics'] for r in rows).items())),
            publication_review_required=review, **audit,
        )
        (metadata / f'{path.stem}.json').write_text(
            json.dumps({'file': info, 'records': rows}, ensure_ascii=False, separators=(',', ':')) + '\n',
            encoding='utf-8')
        reports.append(info)
        print(f"{path.name}: {len(rows):,} rows; {len(audit['errors'])} normalization errors", flush=True)
    result = dict(profile=PROFILE, query='QR2fft36c', unicode_database=unicodedata.unidata_version,
                  files=reports, totals={key: sum(r[key] for r in reports) for key in
                  ('rows', 'signs_scanned', 'matching_signs', 'excluded_head_only', 'head_inserted',
                   'multiple_heads', 'noncombining_resources')})
    result['totals']['errors'] = sum(len(r['errors']) for r in reports)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result['totals'], indent=2))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'data/source')
    parser.add_argument('--output', type=Path, default=ROOT / 'data/raw')
    parser.add_argument('--metadata', type=Path, default=ROOT / 'data/metadata')
    parser.add_argument('--report', type=Path, default=ROOT / 'data/report.json')
    args = parser.parse_args()
    try:
        process(args.source, args.output, args.metadata, args.report)
    except (OSError, ValueError) as error:
        parser.exit(1, f'Error: {error}\n')


if __name__ == '__main__':
    main()
