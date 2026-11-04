#!/usr/bin/env python3
"""Describe source fields with regex; never infer legal status or alter records."""

import bisect
from collections import Counter
from hashlib import sha256
import json
import re

from facial_pipeline import ROOT, SIGN_RE, EXCLUDED_COLLECTION_IDS

FIELD_RE = re.compile(r'<(term|text|src|video|image|png|svg)\b[^>]*>(.*?)</\1\s*>', re.S)


def field_index(text):
    fields = [(m.start(2), m.end(2), m[1], sum(1 for _ in SIGN_RE.finditer(m[2])))
              for m in FIELD_RE.finditer(text)]
    return fields, [field[0] for field in fields]


def context_at(index, offset):
    fields, starts = index
    position = bisect.bisect_right(starts, offset) - 1
    if position < 0 or offset >= fields[position][1]:
        return 'unlocated-field'
    _, _, tag, count = fields[position]
    return f'{tag}:' + ('multiple-signboxes' if count > 1 else 'single-signbox')


def audit():
    cache, analyses = {}, {}
    for label, folder in [('facial', 'data/metadata'), ('eye_gaze', 'data/eye-gaze/metadata')]:
        counts, files, opening = Counter(), [], Counter()
        for path in sorted((ROOT / folder).glob('*.json')):
            data = json.loads(path.read_text())
            info, records = data['file'], data['records']
            assert info['id'] not in EXCLUDED_COLLECTION_IDS
            source = info['source_file']
            if source not in cache:
                original = (ROOT / 'data/source' / source).read_bytes()
                assert sha256(original).hexdigest() == info['source_sha256'], source
                text = original.decode('utf-8-sig')
                cache[source] = text, field_index(text)
            text, index = cache[source]
            per_file = Counter()
            for row in records:
                offset, witness = row['source_offset'], row['source_fsw']
                assert text[offset:offset + len(witness)] == witness, (source, offset)
                context = context_at(index, offset)
                counts[context] += 1
                per_file[context] += 1
                if source == 'sgn114.spml' and row['entry_id'] == '1920':
                    opening[context] += 1
            files.append({'source_file': source, 'source_sha256': info['source_sha256'],
                          'rows': len(records), 'contexts': dict(sorted(per_file.items()))})
        analyses[label] = {'rows': sum(counts.values()), 'contexts': dict(sorted(counts.items())),
                           'sgn114_entry1920': dict(sorted(opening.items())), 'files': files}
    result = {
        'source_snapshot': 'data/source-manifest.json',
        'method': 'Regex field intervals and counts of complete source signboxes; recorded offsets and source hashes are verified.',
        'interpretation': 'Source-field categories describe storage context, not lexicality, authorship, copyright, licensing, or permission. A single-signbox field is not a legal clearance.',
        'data_changed': False,
        'analyses': analyses,
    }
    destination = ROOT / 'publication/source-context-summary.json'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: {n: v[n] for n in ('rows', 'contexts', 'sgn114_entry1920')}
                      for k, v in analyses.items()}, indent=2))


if __name__ == '__main__':
    audit()
