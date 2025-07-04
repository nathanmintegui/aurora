import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CodeEditor, Theme } from "@acrodata/code-editor";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { languages } from '@codemirror/language-data';
import { HttpClient } from "@angular/common/http";
import { LoaderComponent } from '../shared/components/loader/loader.component';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ViewService } from './view.service';
import { QuestionResponseType } from '../../core/models/QuestionResponseType';
import { vim } from '@replit/codemirror-vim';
import { Extension } from '@codemirror/state';

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
    AsyncPipe,
    ReactiveFormsModule,
    NgFor
  ],
  templateUrl: './code-submit.component.html',
  styleUrl: './code-submit.component.css'
})
export class CodeSubmitComponent implements OnInit {
  @ViewChild(LoaderComponent) loader?: LoaderComponent;

  editorConfigForm = new FormGroup({
    lang: new FormControl('Javascript'),
    fontSize: new FormControl('12'),
    theme: new FormControl('light'),
  })

  extensions: Array<Extension> = [];

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
    extensions: []
  };

  langs = ["Javascript", "C", "C++", "Python", "PHP", "Java"]
  fontSizes = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30]

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
  selectedLang: string = 'Javascript';
  themes: string[] = ['light', 'dark'];
  selectedTheme: Theme = 'light'

  userCode = signal('');

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

  onChangeLang(newValue: string) {
    console.assert(newValue !== this.EMPTY_STRING)
    this.selectedLang = newValue
    this.changeCurrentCodeTemplateLang(newValue)
  }

  changeCurrentCodeTemplateLang(newLang: string) {
    console.assert(newLang !== this.EMPTY_STRING)

    /*
     * NOTE: In case of multiple places usage then please consider moving it to a different place/location, like a
     * constant file or top class.
     * */
    const LANG_MAP = [
      { id: 1, value: 'Javascript' },
      { id: 2, value: 'Java' },
      { id: 3, value: 'Python' }
    ] as const;

    if (!this.langs.find(l => l === newLang)) {
      console.error('[ERROR]: could not find corresponding lang on list of acceptable langs.');
    }

    const codeQuestion = this.questionList.find(q => q.id === this.currentQuestion.id)?.codeScaffold;
    if (!codeQuestion) {
      console.error('[ERROR]: did not find question with current question ID >>', this.currentQuestion.id);
      return;
    }

    const desiredLang = LANG_MAP.find(l => l.value === newLang);
    if (!desiredLang) {
      console.error('[ERROR]: did not find lang with provided name >>', newLang);
      return;
    }

    const codeScaffold = codeQuestion.find(c => c.lang === desiredLang.value);
    if (!codeScaffold) {
      console.error('[ERROR]: did not find a code scaffold with lang ID >>', desiredLang.id);
      return;
    }

    this.currentQuestion = { ...this.currentQuestion, langId: desiredLang.id, code: codeScaffold.code }
  }

  onChangeTheme(newValue: Theme) {
    console.assert(newValue !== this.EMPTY_STRING)
    this.selectedTheme = newValue
  }

  handleNextQuestionClick(): void {
    console.assert(this.questionList.length > 0);

    if (this.currentQuestion.id === this.questionList[this.questionList.length - 1].id) {
      return;
    }

    const currQuestion = this.questionList.find(q => q.id === this.currentQuestion.id);

    console.assert(currQuestion !== undefined);

    let currentIndex = this.questionList.indexOf(currQuestion as QuestionResponseType);
    if (currentIndex === -1) {
      console.error('[ERROR]: unable to find index of current question on questionList array');
      return;
    }

    currentIndex = currentIndex === 0 ? 1 : currentIndex;

    this.handleChangeQuestionClick(currentIndex + 1);
  }

  handlePreviousQuestionClick(): void {
    console.assert(this.questionList.length > 0);

    if (this.currentQuestion.id === this.questionList[0].id) {
      return;
    }

    const currQuestion = this.questionList.find(q => q.id === this.currentQuestion.id);

    console.assert(currQuestion !== undefined);

    let currentIndex = this.questionList.indexOf(currQuestion as QuestionResponseType);
    if (currentIndex === -1) {
      console.error('[ERROR]: unable to find index of current question on questionList array');
      return;
    }

    this.handleChangeQuestionClick(currentIndex);
  }

  /**
   * Toggle on/off vim mode on monaco editor.
   * */
  handleVimModeToggleClick(): void {
    this.extensions.length == 0
      ? this.extensions = [vim()]
      : this.extensions = [];
  }
}

