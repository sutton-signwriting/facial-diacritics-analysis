import copy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build_examples import resolve_examples


class ExampleTests(unittest.TestCase):
    def setUp(self):
        self.record = {'fsw':'M518x518S2ff00482x483S32126489x493',
                       'entry_id':'7', 'gaze_matches':[{'key':'S32126','x':489,'y':493}]}
        self.selected = {'id':'D01','collection':'sgn155','entry_id':'7',
                         'fsw':self.record['fsw'],'source_sha256':'snapshot',
                         'gaze_keys':['S32126'],'eye_position':'page-left',
                         'context':'gaze-without-eye-state'}
        self.curated = {'id':'selection','cases':[self.selected]}
        self.collections = {'sgn155':{'file':{'source_sha256':'snapshot'},
                                     'records':[dict(self.record,entry_id='6'),self.record]}}

    def test_link_uses_exact_entry_and_original_record_number(self):
        result=resolve_examples(self.curated,self.collections)
        self.assertEqual(result['cases'][0]['dataset_url'],'../files/sgn155.html#row-2')
        self.assertEqual(result['counts']['page_left'],1)

    def test_source_changes_and_missing_witnesses_are_rejected(self):
        for field,value in [('source_sha256','changed'),('entry_id','8'),('fsw','different')]:
            selected=copy.deepcopy(self.curated)
            selected['cases'][0][field]=value
            with self.assertRaises(ValueError): resolve_examples(selected,self.collections)

    def test_private_collections_and_missing_public_collections_are_rejected(self):
        for collection in ('sgn97','sgn103','sgn105','sgn999'):
            selected=copy.deepcopy(self.curated)
            selected['cases'][0]['collection']=collection
            with self.assertRaises(ValueError): resolve_examples(selected,self.collections)
        self.collections['sgn155']['file']['publication_review_required']=True
        with self.assertRaises(ValueError): resolve_examples(self.curated,self.collections)

    def test_changed_gaze_and_repeated_identifiers_are_rejected(self):
        selected=copy.deepcopy(self.curated)
        selected['cases'][0]['gaze_keys']=['S32127']
        with self.assertRaises(ValueError): resolve_examples(selected,self.collections)
        self.curated['cases'].append(dict(self.selected))
        with self.assertRaises(ValueError): resolve_examples(self.curated,self.collections)
