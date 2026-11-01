#!/usr/bin/env python3
"""Build a portable static browser from existing CSVs and provenance sidecars."""

import argparse
from collections import Counter
import csv
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import shutil
import subprocess

from facial_pipeline import ROOT, PROFILE


def page(title, prefix='', file_id=None):
    file_attr = f' data-file="{escape(file_id, quote=True)}"' if file_id else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · Facial diacritics analysis</title>
<meta name="description" content="Inspect SignPuddle source signs, normalized facial compositions, and provisional official Unicode sequences side by side.">
<link rel="icon" href="{prefix}assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{prefix}assets/style.css"></head>
<body{file_attr} data-prefix="{prefix}"><header class="masthead"><a class="brand" href="{prefix}index.html"><img src="{prefix}assets/icon.svg" width="32" height="32" alt="">Sutton SignWriting <span>/ Research tools</span></a>
<nav aria-label="Main"><a href="{prefix}index.html">Datasets</a><a href="{prefix}methods.html">Methods &amp; provenance</a></nav></header>
<main id="app" aria-busy="true"><p class="loading" role="status">Loading the corpus…</p></main>
<footer><span>Facial diacritics analysis <b>v0.1</b></span><span>Source preserved. Transformations explicit.</span></footer>
<noscript>This browser needs JavaScript. Download the CSVs from the data directory to inspect the records directly.</noscript>
<script type="module" src="{prefix}assets/app.js"></script></body></html>'''


def build(output: Path, public: bool = False):
    report = json.loads((ROOT / 'data/report.json').read_text())
    # Only remove the dedicated generated directory owned by this builder.
    if output.resolve() != (ROOT / 'dist').resolve():
        raise ValueError('The generated output directory must be this project\'s dist/.')
    if output.exists():
        shutil.rmtree(output)
    for folder in ('assets/fonts', 'data/files', 'data/raw', 'files'):
        (output / folder).mkdir(parents=True, exist_ok=True)
    for name in ('app.js', 'style.css', 'icon.svg'):
        shutil.copyfile(ROOT / 'web' / name, output / 'assets' / name)
    package = ROOT / 'node_modules/@sutton-signwriting/font-ttf'
    if not package.exists():
        raise ValueError('Run npm install before building the website.')
    shutil.copyfile(package / 'fsw/fsw.mjs', output / 'assets/font-ttf.mjs')
    shutil.copyfile(package / 'LICENSE', output / 'assets/font-ttf-LICENSE.txt')
    for name in ('SuttonSignWritingLine.ttf', 'SuttonSignWritingFill.ttf'):
        shutil.copyfile(package / 'font' / name, output / 'assets/fonts' / name)
    for path in (ROOT / 'assets/fonts').iterdir():
        if path.is_file():
            shutil.copyfile(path, output / 'assets/fonts' / path.name)
    included, held = [], []
    for info in report['files']:
        if public and info['publication_review_required']:
            held.append(info['id'])
            continue
        records = json.loads((ROOT / 'data/metadata' / f"{info['id']}.json").read_text())['records']
        with (ROOT / 'data/raw' / f"{info['id']}.csv").open(encoding='utf-8', newline='') as stream:
            raw = list(csv.DictReader(stream))
        if len(raw) != len(records) or any(
            any(row[key] != record[key] for key in ('fsw', 'fsw-face', 'uni-face'))
            for row, record in zip(raw, records)
        ):
            raise ValueError(f"CSV/provenance mismatch for {info['id']}; rerun processing.")
        # Public payload contains no SPML prose, contributor identities, or emails.
        payload = {'file': info, 'records': records}
        (output / 'data/files' / f"{info['id']}.json").write_text(
            json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
        shutil.copyfile(ROOT / 'data/raw' / f"{info['id']}.csv", output / 'data/raw' / f"{info['id']}.csv")
        (output / 'files' / f"{info['id']}.html").write_text(page(info['id'], '../', info['id']), encoding='utf-8')
        included.append(info)
    histogram = Counter()
    for info in included:
        histogram.update({int(k): v for k, v in info['diacritics'].items()})
    manifest = dict(profile=PROFILE, query=report['query'], public_build=public,
                    files=included, held_for_review=held,
                    totals={key: sum(r[key] for r in included) for key in
                            ('rows', 'signs_scanned', 'excluded_head_only', 'head_inserted', 'multiple_heads')},
                    histogram=dict(sorted(histogram.items())),
                    assets=json.loads((ROOT / 'assets/manifest.json').read_text()))
    revision = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True)
    manifest['software_commit'] = revision.stdout.strip() if revision.returncode == 0 else None
    source_manifest = ROOT / 'data/source-manifest.json'
    manifest['source_snapshot'] = json.loads(source_manifest.read_text()) if source_manifest.exists() else None
    (output / 'data/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (output / 'index.html').write_text(page('Explore the corpus'), encoding='utf-8')
    methods = page('Methods & provenance').replace(
        '<main id="app" aria-busy="true"><p class="loading" role="status">Loading the corpus…</p></main>',
        '<main id="methods">' + (ROOT / 'web/methods.html').read_text() + '</main>')
    (output / 'methods.html').write_text(methods, encoding='utf-8')
    (output / '.nojekyll').touch()
    checksums = {str(p.relative_to(output)): sha256(p.read_bytes()).hexdigest()
                 for p in sorted((output / 'data/raw').glob('*.csv'))}
    (output / 'data/checksums.json').write_text(json.dumps(checksums, indent=2) + '\n')
    print(f"Built {len(included)} datasets / {manifest['totals']['rows']:,} rows in {output}")
    if held:
        print('Held from public build pending source review: ' + ', '.join(held))
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--public', action='store_true', help='Hold collections labelled private pending review.')
    args = parser.parse_args()
    build(ROOT / 'dist', public=args.public)
