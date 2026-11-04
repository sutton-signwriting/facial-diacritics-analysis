#!/usr/bin/env python3
"""Verify frozen file contents and reproduce the reviewed ZIP containers."""

import argparse
import base64
from hashlib import sha256
import json
from pathlib import Path
import zipfile


def restore(artifacts: Path, plan: dict) -> None:
    for name, expected in plan['archives'].items():
        path = artifacts / name
        temporary = path.with_suffix('.reviewed.zip')
        with zipfile.ZipFile(path) as source:
            names = [item['filename'] for item in expected['entries']]
            if len(source.namelist()) != len(names) or set(source.namelist()) != set(names):
                raise ValueError(f'{name}: archive file selection differs from review')
            with zipfile.ZipFile(temporary, 'w') as output:
                output.comment = base64.b64decode(expected['comment'])
                for entry in expected['entries']:
                    content = source.read(entry['filename'])
                    if sha256(content).hexdigest() != entry['sha256']:
                        raise ValueError(f"{name}: changed content: {entry['filename']}")
                    info = zipfile.ZipInfo(entry['filename'], tuple(entry['date_time']))
                    for key in ('compress_type', 'create_system', 'create_version',
                                'extract_version', 'flag_bits', 'volume',
                                'internal_attr', 'external_attr'):
                        setattr(info, key, entry[key])
                    info.comment = base64.b64decode(entry['comment'])
                    info.extra = base64.b64decode(entry['extra'])
                    output.writestr(info, content)
        actual = sha256(temporary.read_bytes()).hexdigest()
        if actual != expected['sha256']:
            raise ValueError(f'{name}: reviewed ZIP checksum differs: {actual}')
        temporary.replace(path)
        print(f'{name}: all {len(names)} files and reviewed ZIP checksum verified')
    (artifacts / 'SHA256SUMS.txt').write_text(plan['checksums'], encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifacts', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    args = parser.parse_args()
    restore(args.artifacts, json.loads(args.plan.read_text(encoding='utf-8')))
