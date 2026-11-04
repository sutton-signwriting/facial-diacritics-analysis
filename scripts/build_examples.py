"""Resolve the article's selected examples against the public eye-gaze records."""

from collections import Counter
import csv
from hashlib import sha256
import json
import re

from facial_pipeline import EXCLUDED_COLLECTION_IDS, ROOT


def resolve_examples(curated, collections):
    cases, seen = [], set()
    for selected in curated['cases']:
        case_id = selected['id']
        collection = selected['collection']
        if not re.fullmatch(r'[A-Z][0-9]{2}', case_id) or case_id in seen:
            raise ValueError('Example identifiers must be unique and stable.')
        seen.add(case_id)
        if not re.fullmatch(r'sgn[0-9]+', collection) or collection in EXCLUDED_COLLECTION_IDS:
            raise ValueError('An example refers to an excluded collection.')
        if collection not in collections:
            raise ValueError(f'Example {case_id} is outside the public selection.')
        data = collections[collection]
        info = data['file']
        if info.get('publication_review_required') or info['source_sha256'] != selected['source_sha256']:
            raise ValueError(f'Example {case_id} has an unverified source snapshot.')
        matches = [(i, r) for i, r in enumerate(data['records'], 1)
                   if r['fsw'] == selected['fsw'] and str(r['entry_id']) == selected['entry_id']]
        if not matches:
            raise ValueError(f'Example {case_id} does not match its source entry and sign.')
        row, record = matches[0]
        keys = [g['key'] for g in record['gaze_matches']]
        if keys != selected['gaze_keys']:
            raise ValueError(f'Example {case_id} has different gaze symbols.')
        if len(keys) == 1:
            if selected['eye_position'] not in ('page-left', 'page-right'):
                raise ValueError(f'Example {case_id} needs a recorded page-side annotation.')
        elif len(keys) != 2 or selected['eye_position'] != 'both eye positions':
            raise ValueError(f'Example {case_id} has an unexpected gaze count.')
        if selected['context'] not in ('gaze-with-eye-state', 'gaze-without-eye-state', 'two-gazes'):
            raise ValueError(f'Example {case_id} has an unknown context.')
        if (selected['context'] == 'two-gazes') != (len(keys) == 2):
            raise ValueError(f'Example {case_id} has an inconsistent context.')
        cases.append({**record, 'case_id': case_id, 'collection': collection,
                      'row': row, 'eye_position': selected['eye_position'],
                      'context': selected['context'], 'source_sha256': info['source_sha256'],
                      'dataset_url': f'../files/{collection}.html#row-{row}',
                      'source_url': 'http://signbank.org/signpuddle2.0/canvas.php?ui=1&sgn='
                                    + collection[3:] + '&sid=' + selected['entry_id']})
    sides = Counter(c['eye_position'] for c in cases if len(c['gaze_matches']) == 1)
    return {key: value for key, value in curated.items() if key != 'cases'} | {
        'counts': {'total': len(cases), 'single_gaze': sum(len(c['gaze_matches']) == 1 for c in cases),
                   'two_gazes': sum(len(c['gaze_matches']) == 2 for c in cases),
                   'collections': len({c['collection'] for c in cases}),
                   'page_left': sides['page-left'], 'page_right': sides['page-right']},
        'cases': cases}


def build_examples(target, manifest):
    curated = json.loads((ROOT / 'data/eye-gaze/article-examples.json').read_text())
    collections = {f['id']: json.loads((target / 'data/files' / f"{f['id']}.json").read_text())
                   for f in manifest['files']}
    result = resolve_examples(curated, collections)
    result['analysis_id'] = manifest['analysis_id']
    result['mapping_profile'] = manifest['profile']
    result['corpus_occurrences'] = manifest['totals']['rows']
    (target / 'data/examples.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    fields = ['case_id', 'collection', 'entry_id', 'eye_position', 'context', 'gaze_keys',
              'fsw', 'fsw-face', 'uni-face', 'dataset_row', 'source_offset', 'source_sha256', 'source_url']
    with (target / 'data/examples.csv').open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for case in result['cases']:
            row = {key: case.get(key, '') for key in fields}
            row['dataset_row'] = case['row']
            row['gaze_keys'] = ' '.join(g['key'] for g in case['gaze_matches'])
            writer.writerow(row)
    checksums = {str(p.relative_to(target)): sha256(p.read_bytes()).hexdigest()
                 for p in sorted((target / 'data').rglob('*.csv'))}
    (target / 'data/checksums.json').write_text(json.dumps(checksums, indent=2) + '\n')
    return result
