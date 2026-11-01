import csv
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from facial_pipeline import extract, load_sizes, normalize_face, Symbol, unicode_face, unicode_symbol
from process_sources import process


class PipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sizes = load_sizes()

    def test_only_spatial_matches_and_head_only_exclusion(self):
        text = ('AS30a00M515x515S10000485x485 '
                'M518x518S2ff00482x482 '
                'M518x518S2ff00482x482S30a00482x482')
        rows, audit = extract(text, self.sizes)
        self.assertEqual(len(rows), 1)
        self.assertEqual(audit['matching_signs'], 2)
        self.assertEqual(audit['excluded_head_only'], 1)

    def test_exact_range_edges_and_prefix(self):
        text = 'AS10000M530x530S2fe00480x480S2ff00481x481S36c00482x482S36d00483x483'
        rows, _ = extract(text, self.sizes)
        self.assertEqual(len(rows), 1)
        self.assertFalse(rows[0]['fsw'].startswith('A'))
        self.assertIn('S2fe00', rows[0]['fsw'])
        self.assertNotIn('S2fe00', rows[0]['fsw-face'])
        self.assertNotIn('S36d00', rows[0]['fsw-face'])
        self.assertIn('S36c00', rows[0]['fsw-face'])

    def test_normalization_uses_glyph_extents_preserves_relations(self):
        sizes = {'S2ff00': [36, 36], 'S30a00': [20, 10]}
        a = [Symbol('S2ff00', 700, 650), Symbol('S30a00', 710, 640)]
        b = [Symbol(s.key, s.x - 300, s.y - 200) for s in a]
        normalized = normalize_face(a, 'M', sizes)
        self.assertEqual(normalized, 'M518x523S2ff00482x487S30a00492x477')
        self.assertEqual(normalized, normalize_face(b, 'M', sizes))

    def test_head_moves_as_a_complete_block_and_modifiers_stay_attached(self):
        items = [Symbol('S30a00', 480, 480), Symbol('S2ff14', 481, 481),
                 Symbol('S34410', 482, 482)]
        uni, inserted = unicode_face(items)
        self.assertFalse(inserted)
        self.assertEqual([ord(c) for c in uni[:3]], [0x1D9FF, 0x1DA9B, 0x1DAA4])
        self.assertEqual(uni[3:], unicode_symbol('S30a00') + unicode_symbol('S34410'))
        self.assertEqual(unicode_symbol('S2ff00'), chr(0x1D9FF))

    def test_missing_head_is_inserted_and_other_symbols_keep_order(self):
        items = [Symbol('S30a00', 482, 483), Symbol('S34410', 495, 504)]
        uni, inserted = unicode_face(items)
        self.assertTrue(inserted)
        self.assertEqual([ord(c) for c in uni], [0x1D9FF, 0x1DA0A, 0x1DA44, 0x1DA9B])

    def test_multiple_heads_are_not_silently_dropped(self):
        text = 'M530x530S2ff00482x483S30a00482x483S2ff00520x500'
        rows, _ = extract(text, self.sizes)
        self.assertEqual(rows[0]['head_count'], 2)
        self.assertIn('multiple-heads', rows[0]['flags'])
        self.assertEqual(rows[0]['uni-face'].count(chr(0x1D9FF)), 2)

    def test_duplicates_provenance_and_invalid_keys(self):
        good = 'M520x520S30a00482x483'
        text = f'<entry id="42"><term>{good} {good}</term></entry> {good} '
        rows, _ = extract(text, self.sizes)
        self.assertEqual(len(rows), 3)
        self.assertEqual([r['entry_id'] for r in rows], ['42', '42', None])
        self.assertNotEqual(rows[0]['source_offset'], rows[1]['source_offset'])
        _, audit = extract('M520x520S30a5f482x483', self.sizes)
        self.assertEqual(len(audit['errors']), 1)

    def test_arbitrary_text_filename_and_zero_result_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'source'
            source.mkdir()
            (source / 'input.txt').write_text('M520x520S30a00482x483', encoding='utf-8')
            (source / 'empty.spml').write_text('ordinary text', encoding='utf-8')
            process(source, root / 'raw', root / 'meta', root / 'report.json')
            with (root / 'raw/input.csv').open(encoding='utf-8', newline='') as stream:
                reader = csv.DictReader(stream)
                self.assertEqual(reader.fieldnames, ['fsw', 'fsw-face', 'uni-face'])
                self.assertEqual(len(list(reader)), 1)
            self.assertEqual((root / 'raw/empty.csv').read_text(), 'fsw,fsw-face,uni-face\n')
            report = json.loads((root / 'report.json').read_text())
            self.assertEqual(report['totals']['rows'], 1)


if __name__ == '__main__':
    unittest.main()
