export type QuestionResponseType = {
	id: string;
	complexity: string;
	content: string;
	codeScaffold: Array<CodeScaffoldType>;
};

export type CodeScaffoldType = {
	id: number;
	code: string;
	lang: string;
};

export enum LanguagesEnum {
	JAVASCRIPT = "Javascript",
	C = "C",
	CPP = "C++",
	PYTHON = "Python",
	PHP = "PHP",
	JAVA = "Java"
}
