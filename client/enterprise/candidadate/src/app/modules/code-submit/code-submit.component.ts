import {Component, signal, ViewChild} from '@angular/core';
import {CodeEditor} from "@acrodata/code-editor";
import {FormsModule} from "@angular/forms";
import {languages} from '@codemirror/language-data';
import {HttpClient} from "@angular/common/http";
import {LoaderComponent} from '../shared/components/loader/loader.component';
import {AsyncPipe, NgClass, NgIf} from '@angular/common';
import {ViewService} from './view.service';

@Component({
  selector: 'app-code-submit',
  imports: [
    CodeEditor,
    FormsModule,
    LoaderComponent,
    NgIf,
    NgClass,
    AsyncPipe
  ],
  templateUrl: './code-submit.component.html',
  styleUrl: './code-submit.component.css'
})
export class CodeSubmitComponent {
  @ViewChild(LoaderComponent) loader?: LoaderComponent;

  EMPTY_STRING: string = "" as const;

  sucessTestCount = 0;
  errorTestCount = 0;

  responseContent: any = {};

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

  constructor(
    private http: HttpClient,
    protected viewService: ViewService) {
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
      headers: {"Content-Type": "application/json"}
    }).subscribe({
      next: (res) => {
        if (res === null) {
          this.setupSSE();
        } else {
          this.loader?.showLoader(false);
        }
      },
      error: (error) => {
        console.error("[ERROR]: HTTP Error:", error);
        this.loader?.showLoader(false);
      }
    });
  };

  setupSSE = () => {
    const eventSource = new EventSource('http://localhost:3001/events');

    eventSource.onmessage = (event) => {
      if (!event?.data) {
        console.error("[ERROR]: Error receiving message data.");
        return;
      }

      this.responseContent = JSON.parse(event.data);
      console.log("[DEBUG]: SSE message ", this.responseContent);

      // @ts-ignore
      this.sucessTestCount = this.responseContent?.message.filter(m => m?.failure === "").length;
      // @ts-ignore
      this.errorTestCount = this.responseContent?.message.filter(m => m?.failure !== "").length;

      this.loader?.showLoader(false);
      this.handleOutputClick();
      eventSource.close();
    };

    eventSource.onerror = (error) => {
      console.error("[ERROR]: SSE Error:", error);
      this.loader?.showLoader(false);
      eventSource.close();
    };
  };

  handleInstructionClick(): void {
    this.viewService.setInstructionView(true);
  }

  handleOutputClick(): void {
    this.viewService.setInstructionView(false);
  }
}
