<script lang="ts">
	import Constants from '$lib/constants';
	import Logger from '$lib/logger';
	import { getCurrentQuestionState } from './currentQuestion.svelte';

	let { questionList = [] } = $props();

	let currentQuestion = getCurrentQuestionState();

	/**
	 * Returns custom style if the question circle is the same as the current question.
	 *
	 * @param questionIndex
	 * @returns class style
	 */
	function getCircleStyle(index: number): string {
		Logger.assert(questionList.length !== Constants.ZERO);
		Logger.assert(index >= Constants.ZERO && index < questionList.length);
		Logger.assert(currentQuestion?.value !== null && currentQuestion?.value !== undefined);
		return currentQuestion?.value?.id === questionList[index]?.id
			? `current-selected-question`
			: '';
	}

	/**
	 * Set the currentQuestion based on the questionIndex.
	 *
	 * @param questionIndex
	 */
	function handleChangeQuestionClick(questionIndex: number): void {
		if (questionIndex < 0) {
			Logger.warn('Parameter questionIndex is less than zero.');
			return;
		}

		if (questionList.length === 0) {
			Logger.warn('QuestionList length is zero.');
			return;
		}

		if (questionIndex > questionList.length) {
			Logger.warn('Parameter questionIndex is bigger than list length.');
			return;
		}

		const newCurrentQuestion = questionList[questionIndex];
		Logger.assert(newCurrentQuestion !== undefined && newCurrentQuestion !== null);
		currentQuestion.setCurrentQuestion(newCurrentQuestion);
	}
</script>

<div class="navigation-menu-container">
	<div class="question-circle-container">
		{#each questionList, index}
			<button
				class={getCircleStyle(index)}
				onclick={function () {
					handleChangeQuestionClick(index);
				}}
			>
				{index + 1}
			</button>
		{/each}
	</div>
</div>

<style>
	.navigation-menu-container {
		border-bottom: 1px solid black;
		display: flex;
		padding: 0.5em;
	}

	.question-circle-container {
		display: flex;
		gap: 1.5em;
	}

	.question-circle-container > button {
		border: 2px solid black;
		border-radius: 50%;
		width: 2em;
		height: 2em;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-weight: bold;
	}

	.question-circle-container > button:hover {
		cursor: pointer;
		background-color: lightgray;
	}

	.current-selected-question {
		background-color: lightskyblue;
	}
</style>
