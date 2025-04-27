import unittest
from main import quicksort
from json_test_runner import JSONTestRunner


class TestQuickSort(unittest.TestCase):
    def test_sorted_array(self):
        self.assertEqual(quicksort([1, 2, 3, 4, 5]), [1, 2, 3, 4, 5])

    def test_unsorted_array(self):
        self.assertEqual(quicksort([5, 3, 1, 4, 2]), [1, 2, 3, 4, 5])

    def test_array_with_duplicates(self):
        self.assertEqual(quicksort([3, 1, 2, 3, 4, 1]), [1, 1, 2, 3, 3, 4])

    def test_empty_array(self):
        self.assertEqual(quicksort([]), [])

    def test_single_element(self):
        self.assertEqual(quicksort([42]), [42])

    def test_negative_numbers(self):
        self.assertEqual(quicksort([0, -1, -3, 8, 5]), [-3, -1, 0, 5, 8])


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestQuickSort)
    runner = JSONTestRunner(verbosity=2, output_file="test_report.json")
    runner.run(suite)
