import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CodeEditor } from "@acrodata/code-editor";
import { FormsModule } from "@angular/forms";
import { languages } from '@codemirror/language-data';
import { HttpClient } from "@angular/common/http";
import { LoaderComponent } from '../shared/components/loader/loader.component';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { ViewService } from './view.service';
import { QuestionResponseType } from '../../core/models/QuestionResponseType';

type SelectedQuestion = {
  label: number;
  questionId: string
}

export type CurrentQuestionType = {
  id: string;
  complexity: string;
  content: string;
  code: string;
  langId: number;
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

  questionList: Array<QuestionResponseType> = [];
  currentSelectedQuestion: SelectedQuestion = { label: 1, questionId: this.EMPTY_STRING };
  currentQuestion: CurrentQuestionType = {
    id: this.EMPTY_STRING,
    content: this.EMPTY_STRING,
    complexity: this.EMPTY_STRING,
    code: this.EMPTY_STRING,
    langId: -1
  };
  questions: Array<SelectedQuestion> = [];

  constructor(
    private http: HttpClient,
    protected viewService: ViewService) {
  }

  ngOnInit(): void {
    this.http.get<Array<QuestionResponseType>>("http://localhost:5002/questions")
      .subscribe({
        next: (res) => {
          this.currentQuestion = {
            id: res[0].id,
            complexity: res[0].complexity,
            content: res[0].content,
            code: res[0]?.codeScaffold[0]?.code,
            langId: res[0]?.codeScaffold[0]?.id
          }
          this.questionList = res;
          this.currentSelectedQuestion = { label: 1, questionId: res[0]?.id };
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
      /*
       * NOTE: hard coded for now just to test the behavior of SSE.
       * */
      userId: "5353aedc-c178-4677-a9dd-53cb2644a078",
      lang: this.currentQuestion.langId,
      code: this.userCode()
    };

    this.http.post(`http://localhost:5002/questions/${this.currentQuestion.id}/submit`, body, {
      headers: { "Content-Type": "application/json" }
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
    const eventSource = new EventSource(`http://localhost:3001/events/${"5353aedc-c178-4677-a9dd-53cb2644a078"}`);

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

    this.http.get<QuestionResponseType>(`http://localhost:5002/questions/${questionId}`)
      .subscribe({
        next: (res) => {
          console.log('[DEBUG]: (handleChangeQuestionClick) http response >> ', res)
          this.currentQuestion = {
            id: res.id,
            complexity: res.complexity,
            content: res.content,
            code: res.codeScaffold[0].code,
            langId: res.codeScaffold[0].id
          }
          this.currentSelectedQuestion = { label: number, questionId: res.id };
        },
        error: (err) => {
          console.error('[ERROR]: fetching resource on (handleChangeQuestionClick) >> ', err);
        }
      })
  }
}
