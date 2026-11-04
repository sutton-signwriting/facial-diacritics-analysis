"""Enumerate public project sources without raw SPML, bulk data, or caches."""

from hashlib import sha256

from facial_pipeline import ROOT

ROOT_FILES = (
    'README.md', 'AGENTS.md', 'LICENSE', 'LICENSE-CC-BY-4.0.txt', 'LICENSING.md',
    'CITATION.cff', 'requirements.txt', 'package.json', 'package-lock.json',
    'docker-compose.yml', 'nginx.conf', '.gitignore', 'data/source-manifest.json',
    'data/eye-gaze/article-examples.json',
)
SOURCE_FOLDERS = ('scripts', 'tests', 'web', 'docs', 'assets', 'publication', '.github')


def source_checksums():
    paths = [ROOT / name for name in ROOT_FILES if (ROOT / name).is_file()]
    for name in SOURCE_FOLDERS:
        paths.extend(p for p in (ROOT / name).rglob('*') if p.is_file()
                     and '__pycache__' not in p.parts and p.suffix != '.pyc')
    return {p.relative_to(ROOT).as_posix(): sha256(p.read_bytes()).hexdigest()
            for p in sorted(set(paths))}
