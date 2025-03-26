import {Component, signal, ViewChild} from '@angular/core';
import {CodeEditor} from "@acrodata/code-editor";
import {FormsModule} from "@angular/forms";
import {languages} from '@codemirror/language-data';
import {HttpClient} from "@angular/common/http";
import {LoaderComponent} from '../shared/components/loader/loader.component';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-code-submit',
  imports: [
    CodeEditor,
    FormsModule,
    LoaderComponent,
    NgIf,
    NgClass
  ],
  templateUrl: './code-submit.component.html',
  styleUrl: './code-submit.component.css'
})
export class CodeSubmitComponent {
  @ViewChild(LoaderComponent) loader?: LoaderComponent;

  value =
    `function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
              return [map.get(complement), i];
          }
          map.set(nums[i], i);
      }
      return [];
    }

module.exports = twoSum;
`;
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
  userCode = signal('');

  constructor(private http: HttpClient) {
  }

  log(e: any) {
    this.userCode.set(e)
  }

  handleClick = () => {
    this.loader?.showLoader(true);

    const body = {
      lang: 1,
      code: this.userCode()
    };

    this.http.post('http://localhost:5002/questions/5353aedc-c178-4677-a9dd-53cb2644a078/submit', body, {
      headers: {
        "Content-Type": "application/json",
      }
    }).subscribe((res) => {
      if (res === null) {
        const eventSource = new EventSource('http://localhost:3001/events');
        eventSource.onmessage = (event) => {
          const {type, data} = JSON.parse(event.data);
          if (type === 'close') {
            eventSource.close();
          } else {
            console.log(data);
            this.loader?.showLoader(false);
          }
        };
      }
    });
  }
}
