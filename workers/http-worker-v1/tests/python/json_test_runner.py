import unittest
import json


class JSONTestResult(unittest.TextTestResult):
    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self.test_results = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.test_results.append({
            "title": self.getDescription(test),
            "status": "passed",
            "failure": ""
        })

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.test_results.append({
            "title": self.getDescription(test),
            "status": "failed",
            "failure": self._exc_info_to_string(err, test)
        })

    def addError(self, test, err):
        super().addError(test, err)
        self.test_results.append({
            "test": self.getDescription(test),
            "status": "error",
            "failure": self._exc_info_to_string(err, test)
        })


class JSONTestRunner(unittest.TextTestRunner):
    def __init__(self, *args, output_file="test_report.json", **kwargs):
        super().__init__(*args, **kwargs)
        self.output_file = output_file

    def _makeResult(self):
        return JSONTestResult(self.stream, self.descriptions, self.verbosity)

    def run(self, test):
        result = super().run(test)
        with open(self.output_file, "w") as f:
            json.dump(result.test_results, f, indent=4)
        return result
