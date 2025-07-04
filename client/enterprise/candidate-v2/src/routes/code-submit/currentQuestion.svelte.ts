import type { QuestionResponseType } from '$lib/types';
import Constants from '$lib/constants';
import { getContext, setContext } from 'svelte';

type QuestionType = {
	id: string;
	complexity: string;
	content: string;
	codeScaffold: Array<CodeScaffoldType>;
};

type CodeScaffoldType = {
	id: number;
	code: string;
	lang: string;
};

interface CurrentQuestionStateInterface {
	value: QuestionType;
	setCurrentQuestion(newQuestion: QuestionResponseType): void;
}

export class CurrentQuestionClass implements CurrentQuestionStateInterface {
	private initialState: QuestionType = {
		id: Constants.EMPTY_STRING,
		complexity: Constants.EMPTY_STRING,
		content: Constants.EMPTY_STRING,
		codeScaffold: []
	};

	value = $state<QuestionType>(this.initialState);

	constructor(questions: Array<QuestionResponseType>) {
		if (questions.length === Constants.ZERO) {
			throw new Error('Questions list is empty.');
		}

		this.value = questions?.[Constants.FIRST_ELEMENT];
		setCurrentQuestionState(this);
	}

	setCurrentQuestion(newQuestion: QuestionType): void {
		if (!newQuestion) {
			throw new Error('Parameter newQuestion is null or undefined.');
		}
		this.value = newQuestion;
	}
}

const DEFAULT_KEY = '$_currentQuestion_state';

function setCurrentQuestionState(question: CurrentQuestionClass) {
	return setContext(DEFAULT_KEY, question);
}

export function getCurrentQuestionState() {
	return getContext<CurrentQuestionStateInterface>(DEFAULT_KEY);
}
