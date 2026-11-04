import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from audit_source_context import context_at, field_index

FSW = 'M518x518S2ff00482x483S32126489x493'


class SourceContextTests(unittest.TestCase):
    def test_storage_field_and_multiple_signboxes_remain_distinct(self):
        text = f'<term><![CDATA[{FSW}]]></term><text>{FSW} {FSW}</text>'
        index = field_index(text)
        self.assertEqual(context_at(index, text.index(FSW)), 'term:single-signbox')
        self.assertEqual(context_at(index, text.index(FSW, text.index('</term>'))),
                         'text:multiple-signboxes')

    def test_a_term_can_itself_contain_a_passage(self):
        text = f'<term>{FSW} {FSW}</term>'
        self.assertEqual(context_at(field_index(text), text.index(FSW)),
                         'term:multiple-signboxes')

    def test_unlocated_content_is_explicit(self):
        text = f'{FSW}<term>no sign</term>'
        self.assertEqual(context_at(field_index(text), 0), 'unlocated-field')


if __name__ == '__main__':
    unittest.main()
