<script lang="ts">
	import { getCurrentEditorConfigState, type EditorThemeType } from './editorConfig.svelte';
	import logo from '$lib/assets/vim-logo.png';
	import { LanguagesEnum } from '$lib/types';
	import Logger from '$lib/logger';

	const langs: Array<LanguagesEnum> = [
		LanguagesEnum.JAVASCRIPT,
		LanguagesEnum.C,
		LanguagesEnum.CPP,
		LanguagesEnum.PYTHON,
		LanguagesEnum.PHP,
		LanguagesEnum.JAVA
	];
	const fontSizes: Array<number> = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30] as const;
	const themes: Array<EditorThemeType> = ['light', 'dark'] as const;

	let editorConfig = getCurrentEditorConfigState();

	function onChangeLang(event: Event & { currentTarget: EventTarget & HTMLSelectElement }): void {
		editorConfig.setLanguage(event.currentTarget.value);
	}

	function onChangeTheme(event: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
		editorConfig.setTheme(event.currentTarget.value as EditorThemeType);
	}

	function handleVimModeToggleClick() {
		editorConfig.hasExtension('vim')
			? editorConfig.removeExtension('vim')
			: editorConfig.setExtension('vim');
	}
</script>

<form>
	<label for="lang">
		<select
			name="lang"
			onchange={function (event) {
				onChangeLang(event);
			}}
		>
			{#each langs as lang}
				<option value={lang}>{lang}</option>
			{/each}
		</select>
	</label>

	<label for="fontSize">
		<select name="fontSize">
			{#each fontSizes as size}
				<option value={size}>{size}</option>
			{/each}
		</select>
	</label>

	<label for="theme">
		<select
			onchange={function (event) {
				onChangeTheme(event);
			}}
			name="theme"
		>
			{#each themes as theme}
				<option value="theme">{theme}</option>
			{/each}
		</select>
	</label>

	<button
		onclick={handleVimModeToggleClick}
		aria-label="Ativar modo de edição modal Vim"
		class="vim-btn"
	>
		<img
			src={logo}
			alt="Vim logo"
			class={`${Array.from(editorConfig.extensions).length === 1 ? 'vim-img-mode-handler-off' : 'vim-img-mode-handler-on'}`}
		/>
	</button>
</form>

<style>
	form {
		display: flex;
		border-bottom: 1px solid gray;
		background-color: #e3e3e3;
		gap: 0.5em;
	}

	form > label > select {
		padding: 0 1em;
	}

	.vim-img-mode-handler-on {
		width: 25px;
		height: 25px;
	}

	.vim-img-mode-handler-on:hover {
		cursor: pointer;
	}

	.vim-img-mode-handler-off {
		width: 25px;
		height: 25px;
		-webkit-filter: grayscale(100%); /* Safari 6.0 - 9.0 */
		filter: grayscale(100%);
	}

	.vim-img-mode-handler-off:hover {
		cursor: pointer;
	}

	.vim-btn {
		background: none;
		color: inherit;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
		outline: inherit;
	}
</style>
