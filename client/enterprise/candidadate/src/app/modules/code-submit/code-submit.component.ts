import {Component, OnInit, signal, ViewChild} from '@angular/core';
import {CodeEditor} from "@acrodata/code-editor";
import {FormsModule} from "@angular/forms";
import {languages} from '@codemirror/language-data';
import {HttpClient} from "@angular/common/http";
import {LoaderComponent} from '../shared/components/loader/loader.component';
import {AsyncPipe, NgClass, NgIf} from '@angular/common';
import {ViewService} from './view.service';
import {QuestionResponse} from '../../core/models/QuestionResponse';

type SelectedQuestion = {
  label: number;
  questionId: string
}

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
export class CodeSubmitComponent implements OnInit {
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

  questionList: Array<QuestionResponse> = [];
  currentSelectedQuestion: SelectedQuestion = {label: 1, questionId: this.EMPTY_STRING};
  currentQuestion: QuestionResponse = {
    id: this.EMPTY_STRING,
    content: this.EMPTY_STRING,
    complexity: this.EMPTY_STRING
  };
  questions: Array<SelectedQuestion> = [];

  constructor(
    private http: HttpClient,
    protected viewService: ViewService) {
  }

  ngOnInit(): void {
    this.http.get<Array<QuestionResponse>>("http://localhost:5002/questions")
      .subscribe({
        next: (res) => {
          this.currentQuestion = res[0];
          this.questionList = res;
          this.currentSelectedQuestion = {label: 1, questionId: res[0]?.id};
          this.questions = res.map((q, idx) => {
            return {
              label: idx + 1,
              questionId: q.id
            }
          });
        },
        error: (err) => {
          console.error('[ERROR]: fetching resource, ', err);
        }
      })
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

  handleChangeQuestionClick(number: number) {
    console.log("[DEBUG]: current question ", number)

    const questionId = this.questions.find(question => question.label === number)?.questionId;
    if (!questionId) {
      console.error("[ERROR]: (handleChangeQuestionClick) >> no question id found");
    }

    this.http.get<QuestionResponse>(`http://localhost:5002/questions/${questionId}`)
      .subscribe({
        next: (res) => {
          console.log('[DEBUG]: (handleChangeQuestionClick) http response >> ', res)
          this.currentQuestion = res;
          this.currentSelectedQuestion = {label: number, questionId: res.id};
        },
        error: (err) => {
          console.error('[ERROR]: fetching resource on (handleChangeQuestionClick) >> ', err);
        }
      })
  }
}
