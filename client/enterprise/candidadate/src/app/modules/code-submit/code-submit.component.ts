import {Component} from '@angular/core';
import {CodeEditor} from "@acrodata/code-editor";
import {FormsModule} from "@angular/forms";
import {languages} from '@codemirror/language-data';

@Component({
    selector: 'app-code-submit',
    imports: [
        CodeEditor,
        FormsModule
    ],
    templateUrl: './code-submit.component.html',
    styleUrl: './code-submit.component.css'
})
export class CodeSubmitComponent {
    value = `/**
 * Sorts an array using the QuickSort algorithm.
 *
 * QuickSort is a divide-and-conquer algorithm that selects a pivot element,
 * partitions the array into two subarrays (elements less than the pivot and elements greater),
 * and recursively sorts each subarray.
 *
 * @param {number[]} arr - The array of numbers to be sorted.
 * @returns {number[]} A new sorted array.
 *
 * @example
 * const sorted = quickSort([3, 6, 8, 10, 1, 2, 1]);
 * console.log(sorted); // Output: [1, 1, 2, 3, 6, 8, 10]
 */
function quickSort(arr) {
    if (arr.length <= 1) {
        return arr; // Base case: arrays with 0 or 1 element are already sorted
    }

    const pivot = arr[arr.length - 1]; // Choose the last element as the pivot
    const left = [];  // Elements less than the pivot
    const right = []; // Elements greater than or equal to the pivot

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    // Recursively sort the left and right subarrays and concatenate them with the pivot
    return [...quickSort(left), pivot, ...quickSort(right)];
}`;

    languages = languages

    options: any = {
        language: 'javascript',
        theme: 'light',
        setup: 'basic',
        disabled: false,
        readonly: false,
        placeholder: 'Type your code here...',
        indentWithTab: false,
        indentUnit: '',
        lineWrapping: false,
        highlightWhitespace: false,
    };
}
