import Constants from '$lib/constants';
import { getContext, setContext } from 'svelte';
import type { Extension } from '@codemirror/state';
import Logger from '$lib/logger';
import { vim } from '@replit/codemirror-vim';
import { basicSetup } from 'codemirror';
import type { LanguageSupport } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { LanguagesEnum } from '$lib/types';

export type EditorThemeType = 'light' | 'dark';

interface EditorConfigInterface {
	fontSize: number;
	language: LanguageSupport;
	theme: EditorThemeType;
	setup: string;
	disabled: boolean;
	readonly: boolean;
	placeholder: string;
	indentWithTab: boolean;
	indentUnit: string;
	lineWrapping: boolean;
	highlightWhitespace: boolean;
	extensions: Array<Extension>;

	setFontSize(fontSize: number): void;
	setLanguage(language: string): void;
	setTheme(theme: EditorThemeType): void;
	setExtension(extension: unknown): void;
	removeExtension(extension: unknown): void;
	hasExtension(extension: string): boolean;
};

export class EditorConfigClass implements EditorConfigInterface {
	fontSize = 12
	language = $state(javascript());
	theme: EditorThemeType = 'light';
	setup = "basic";
	disabled = false;
	readonly = false;
	placeholder = Constants.EMPTY_STRING;
	indentWithTab = true;
	indentUnit = Constants.EMPTY_STRING;
	lineWrapping = false;
	highlightWhitespace = false;
	extensions: Array<Extension> = $state.raw([basicSetup])

	private availableLangs: Record<LanguagesEnum, LanguageSupport | null> = {
		[LanguagesEnum.JAVASCRIPT]: javascript(),
		[LanguagesEnum.PYTHON]: python(),
		[LanguagesEnum.JAVA]: java(),
		[LanguagesEnum.PHP]: php(),
		[LanguagesEnum.C]: null,
		[LanguagesEnum.CPP]: null
	}

	private _availableExtensions: Record<string, Extension> = {
		"vim": vim()
	}

	constructor() {
		Logger.info(this.extensions)
		setContext(DEFAULT_KEY, this);
	}

	hasExtension(extension: string): boolean {
		if (extension === undefined || extension === null) {
			throw new Error("Parameter extension is null or undefined.");
		}

		if (extension.length < 1) {
			throw new Error("Parameter extension size must be bigger than zero.");
		}

		if (typeof extension !== "string") {
			throw new Error("Parameter extension must be of type string.");
		}

		return this.extensions
			.findIndex(ext => ext === this._availableExtensions[extension]) > -1
			? true
			: false
	}

	/**
	 * Sets a new font size.
	 *
	 * @param fontSize number.
	 * */
	setFontSize(fontSize: number): void {
		if (typeof fontSize !== "number") {
			throw new Error("Parameter fontSize must be of type number.");
		}

		if (fontSize < 12 || fontSize > 30) {
			throw new Error("Parameter fontSize must be between 12 and 30.");
		}

		this.fontSize = fontSize;
	}

	/**
	 * Sets a new language.
	 *
	 * @param {LanguagesEnum} language.
	 * */
	setLanguage(language: LanguagesEnum): void {
		if (typeof language !== "string") {
			throw new Error("Parameter language must be of type string.");
		}

		if (language.length < 1 || language.length > 50) {
			throw new Error("Parameter language must be between 1 and 30 characters.");
		}

		this.language = this.availableLangs[language] || javascript();
	}

	/**
	 * Applies the given theme to the editor.
	 * 
	 * @param {EditorThemeType} theme - The theme to apply.
	 */
	setTheme(theme: EditorThemeType): void {
		if (theme === null || theme === undefined) {
			Logger.warn("Parameter theme is null or undefined.");
			return;
		}

		this.theme = theme;
	}

	removeExtension(extension: Extension): void {
		if (extension === null || extension === undefined) {
			Logger.warn("Parameter extension is null or undefined.");
			return;
		}

		this.extensions = [this.extensions.filter(ext => ext !== extension)]
	}

	setExtension(extension: string): void {
		if (this.hasExtension(extension)) {
			return;
		}

		this.extensions = [...this.extensions, this._availableExtensions[extension]]
	}
}

const DEFAULT_KEY = '$_editorConfig_state';

export function getCurrentEditorConfigState() {
	return getContext<EditorConfigInterface>(DEFAULT_KEY);
}
