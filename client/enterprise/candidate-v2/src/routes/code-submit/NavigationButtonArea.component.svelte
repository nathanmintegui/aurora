<script lang="ts">
	import Logger from '$lib/logger';
	import type { QuestionResponseType } from '$lib/types';
	import { getCurrentQuestionState } from './currentQuestion.svelte';

	let questionState = getCurrentQuestionState();
	let currentQuestion = $derived(questionState?.value);

	let { questionList = [] }: { questionList: Array<QuestionResponseType> } = $props();

	function handlePreviousQuestionClick(): void {
		Logger.assert(questionList.length > 0);

		if (currentQuestion.id === questionList[0].id) {
			return;
		}

		const currQuestion = questionList.find((q) => q.id === currentQuestion.id);

		Logger.assert(currQuestion !== undefined);

		let currentIndex = questionList.indexOf(currQuestion as QuestionResponseType);
		if (currentIndex === -1) {
			Logger.error('unable to find index of current question on questionList array');
			return;
		}

		const previousQuestion = questionList[currentIndex - 1];
		Logger.assert(previousQuestion !== undefined);
		questionState.setCurrentQuestion(previousQuestion);
	}

	function handleNextQuestionClick(): void {
		Logger.assert(questionList.length > 0);

		if (currentQuestion.id === questionList[questionList.length - 1].id) {
			return;
		}

		const currQuestion = questionList.find((q) => q.id === currentQuestion.id);

		Logger.assert(currQuestion !== undefined);

		let currentIndex = questionList.indexOf(currQuestion as QuestionResponseType);
		if (currentIndex === -1) {
			Logger.error('unable to find index of current question on questionList array');
			return;
		}

		const nextQuestion = questionList[currentIndex + 1];
		Logger.assert(nextQuestion !== undefined);
		questionState.setCurrentQuestion(nextQuestion);
	}

	function handleClick(): void {}
</script>

<div class="button-area">
	<button
		class={`${
			questionList.length > 0 && currentQuestion.id === questionList[0].id
				? 'disabled-button'
				: 'previous-question-button'
		}`}
		onclick={handlePreviousQuestionClick}
	>
		Voltar
	</button>
	<div class="submit-and-next-area-button">
		<button class="submit-question-button" onclick={handleClick}>Enviar</button>
		<button
			class={`${
				questionList.length > 0 && currentQuestion.id === questionList[questionList.length - 1].id
					? 'disabled-button'
					: 'next-question-button'
			}`}
			onclick={handleNextQuestionClick}>Próxima</button
		>
	</div>
</div>

<style>
	.button-area {
		height: 10%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2em;
		gap: 2em;
		border-top: 1px solid black;
		background-color: #e3e3e3;
	}

	.previous-question-button {
		color: black;
		padding: 1em;
		border-color: #2c3e50;
		border-radius: 5px;
		cursor: pointer;
	}

	.submit-question-button {
		background-color: limegreen;
		color: black;
		padding: 1em;
		border-color: #2c3e50;
		border-radius: 5px;
		cursor: pointer;
	}

	.submit-question-button:hover {
		opacity: 0.85;
	}

	.submitted-question-button {
		background-color: limegreen;
		opacity: 0.45;
		color: black;
		padding: 1em;
		border-color: #2c3e50;
		border-radius: 5px;
		cursor: progress;
	}

	.next-question-button {
		color: black;
		padding: 1em;
		border-color: #2c3e50;
		border-radius: 5px;
		cursor: pointer;
	}

	.disabled-button {
		color: black;
		padding: 1em;
		border-color: #2c3e50;
		border-radius: 5px;
		opacity: 50%;
		cursor: not-allowed;
	}

	.submit-and-next-area-button {
		display: flex;
		gap: 1.5em;
	}
</style>
