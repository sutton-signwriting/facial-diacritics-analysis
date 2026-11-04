#!/usr/bin/env python3
"""Package a reviewed public build; never include raw SPML or private-held rows."""

from hashlib import sha256
import json
import subprocess
import zipfile

from facial_pipeline import ROOT
from release_inputs import source_checksums


def package():
    site = ROOT / 'dist'
    manifest = json.loads((site / 'data/manifest.json').read_text())
    if not manifest['public_build']:
        raise ValueError('Build with --public before creating public release bundles.')
    if manifest.get('source_files_sha256') != source_checksums():
        raise ValueError('Project sources changed since the site build; rebuild before packaging.')
    artifacts = ROOT / 'artifacts'
    artifacts.mkdir(exist_ok=True)
    version = manifest['version']
    site_zip = artifacts / f'facial-diacritics-site-v{version}.zip'
    data_zip = artifacts / f'facial-diacritics-data-v{version}.zip'
    with zipfile.ZipFile(site_zip, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(site.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(site))
    result = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True)
    commit = result.stdout.strip() if result.returncode == 0 else None
    with zipfile.ZipFile(data_zip, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in manifest['source_files_sha256']:
            archive.write(ROOT / name, name)
        for info in manifest['files']:
            stem = info['id']
            archive.write(site / f'data/raw/{stem}.csv', f'data/raw/{stem}.csv')
            archive.write(site / f'data/files/{stem}.json', f'data/metadata/{stem}.json')
        report = {key: manifest[key] for key in ('profile', 'query', 'files', 'totals', 'selection', 'excluded_collections')}
        report['held_for_review'] = manifest['held_for_review']
        archive.writestr('data/report.json', json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        archive.writestr('source-checksums.json', json.dumps(manifest['source_files_sha256'], indent=2) + '\n')
        browser_check = artifacts / 'browser-normalization-check.json'
        if browser_check.exists():
            check = json.loads(browser_check.read_text())
            if check.get('source_files_sha256') != manifest['source_files_sha256']:
                raise ValueError('Browser check refers to different source bytes; rerun browser checks.')
            archive.write(browser_check, 'verification/browser-normalization-check.json')
        # Preserve the independent source selection as part of reproducibility.
        gaze = json.loads((site / 'eye-gaze/data/manifest.json').read_text())
        archive.writestr('data/eye-gaze/report.json', json.dumps(gaze, ensure_ascii=False, indent=2) + '\n')
        archive.write(site / 'eye-gaze/data/all.csv', 'data/eye-gaze/all.csv')
        for info in gaze['files']:
            stem = info['id']
            archive.write(site / f'eye-gaze/data/raw/{stem}.csv', f'data/eye-gaze/raw/{stem}.csv')
            archive.write(site / f'eye-gaze/data/files/{stem}.json', f'data/eye-gaze/metadata/{stem}.json')
        archive.writestr('release.json', json.dumps(dict(
            version=version, software_commit=commit, mapping_profile=manifest['profile'],
            software_dirty=manifest['software_dirty'], rights=manifest['rights'],
            selection=manifest['selection'], excluded_collections=manifest['excluded_collections'],
            source_snapshot_included=False, public_build=True,
            held_for_review=manifest['held_for_review'],
            additional_analyses=[{'analysis_id': gaze['analysis_id'], 'selection': gaze['selection'],
                                  'rows': gaze['totals']['rows']}],
            note='Original SPML is preserved separately. Reproduction from archived CSVs is available; re-extraction requires the matching source snapshot.'
        ), indent=2) + '\n')
    lines = []
    for path in (site_zip, data_zip):
        digest = sha256(path.read_bytes()).hexdigest()
        lines.append(f'{digest}  {path.name}')
        print(f'{path.name}: {path.stat().st_size:,} bytes; SHA256 {digest}')
    (artifacts / 'SHA256SUMS.txt').write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    package()
