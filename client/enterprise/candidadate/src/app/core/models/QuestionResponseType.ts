export type QuestionResponseType = {
  id: string;
  complexity: string;
  content: string;
  codeScaffold: Array<CodeScaffoldType>;
}

export type CodeScaffoldType = {
  id: number;
  code: string;
  lang: string;
}
