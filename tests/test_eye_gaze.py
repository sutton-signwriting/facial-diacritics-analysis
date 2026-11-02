import csv
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from facial_pipeline import load_sizes
from process_eye_gaze import extract_eye_gaze, process


class EyeGazeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sizes = load_sizes()

    def test_source_selection_includes_singletons_and_preserves_other_symbols(self):
        text = ('AS32127M520x520S10000482x482 '
                'M520x520S32010482x482 M520x520S32a10482x482 '
                'M520x520S32107482x482 M520x520S32900482x482 '
                'M520x520S32127482x482S33700450x450 '
                'M520x520S32910482x482 '
                'M520x520S32100482x482S32210505x482')
        rows, audit = extract_eye_gaze(text, self.sizes)
        self.assertEqual(len(rows), 3)
        self.assertEqual(audit['gaze_signs'], 5)
        self.assertEqual(audit['excluded_fill_zero_only'], 2)
        self.assertEqual([r['diacritics'] for r in rows], [1, 1, 2])
        self.assertIn('S33700', rows[0]['fsw'])
        self.assertNotIn('S33700', rows[0]['fsw-face'])
        self.assertEqual(rows[-1]['gaze_matches'], [dict(key='S32210', x=505, y=482)])
        self.assertEqual(len(rows[-1]['gaze_symbols']), 2)
        self.assertIn('also-fill-zero-gaze', rows[-1]['flags'])

    def test_every_requested_base_fill_and_rotation_is_examined(self):
        text = ' '.join(f'M520x520S{base:03x}{fill:x}{rotation:x}482x482'
                        for base in range(0x321, 0x32a)
                        for fill in range(6) for rotation in range(16))
        rows, audit = extract_eye_gaze(text, self.sizes)
        self.assertEqual(len(rows), 9 * 5 * 16)
        self.assertEqual(audit['excluded_fill_zero_only'], 9 * 16)
        self.assertTrue(all(r['gaze_matches'][0]['key'][4] != '0' for r in rows))
        # Invalid source variants are retained and flagged, not silently removed.
        self.assertGreater(audit['unknown_gaze_variants'], 0)

    def test_duplicates_provenance_and_unrenderable_faces_remain(self):
        fsw = 'AS10000M520x520S32127482x482S35120538x250'
        text = f'<entry id="42">{fsw} {fsw}</entry> {fsw}'
        rows, audit = extract_eye_gaze(text, self.sizes)
        self.assertEqual(len(rows), 3)
        self.assertEqual([r['entry_id'] for r in rows], ['42', '42', None])
        self.assertEqual(audit['normalization_errors'], 3)
        self.assertEqual(rows[0]['source_fsw'], fsw)
        self.assertFalse(rows[0]['fsw'].startswith('A'))
        self.assertEqual(rows[0]['fsw-face'], '')
        self.assertIn('S35120', rows[0]['normalization_error'])
        self.assertNotEqual(rows[0]['source_offset'], rows[1]['source_offset'])

    def test_arbitrary_filename_csv_and_private_cleanup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source, output = root / 'source', root / 'eye-gaze'
            source.mkdir()
            output.mkdir()
            (output / 'raw').mkdir()
            (output / 'raw/sgn105.csv').write_text('stale private output')
            (source / 'input.txt').write_text('<entry id="7">M520x520S32127482x482</entry>')
            (source / 'sgn105.spml').write_text('M520x520S32127482x482')
            (source / 'other.txt').write_text('<term>Private test collection</term>M520x520S32127482x482')
            report = process(source, output)
            self.assertEqual(report['totals']['rows'], 1)
            self.assertEqual(len(report['excluded_collections']), 2)
            self.assertFalse((output / 'raw/sgn105.csv').exists())
            with (output / 'raw/input.csv').open(newline='') as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(rows[0]['gaze-keys'], 'S32127')
            self.assertEqual(rows[0]['gaze-positions'], 'S32127482x482')
            self.assertEqual(rows[0]['entry_id'], '7')
            self.assertEqual((output / 'all.csv').read_bytes(), (output / 'raw/input.csv').read_bytes())
            self.assertIsNone(json.loads((output / 'report.json').read_text())['selection']['min_diacritics'])
