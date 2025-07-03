<script lang="ts">
	import { onMount } from 'svelte';
	import { Webcam } from './webcam';
	import type { PageProps } from './$types';
	import type { QuestionResponseType } from '$lib/types';
	import { CurrentQuestionClass } from './currentQuestion.svelte';
	import NavigationMenu from './NavigationMenu.component.svelte';

	let { data }: PageProps = $props();

	let mockVideoEl: HTMLVideoElement | null = null;
	let outputVideoEl: HTMLVideoElement | null = null;
	let canvasEl: HTMLCanvasElement | null = null;
	let webcam: Webcam;
	let currentQuestion = new CurrentQuestionClass(data?.questions ?? []);
	let questionsList: Array<QuestionResponseType> = data?.questions ?? [];

	async function setupCamera() {
		if (mockVideoEl && outputVideoEl && canvasEl) {
			webcam = new Webcam(mockVideoEl, outputVideoEl, canvasEl);
			await webcam.setup(mockVideoEl);

			setInterval(async function () {
				//await webcam.run(mockVideoEl, outputVideoEl, canvasEl);
			}, 1000);
		}
	}

	onMount(async function () {
		await setupCamera();
	});
</script>

<!--
<h1>Mock de getUserMedia com vídeo real</h1>
<video bind:this={mockVideoEl} autoplay muted loop playsinline>
	<source src="/mock-footage.mp4" type="video/mp4" /> Seu navegador não suporta vídeo.
</video> <canvas bind:this={canvasEl} style="display: none;"></canvas>

<h2>Stream Simulado (como se fosse da câmera)</h2>
<video bind:this={outputVideoEl} autoplay playsinline>
	<track kind="captions" />
</video>
-->

<div id="page-container">
	<NavigationMenu questionList={questionsList} />
	<!--Code Area -->
	<div class="code-area">
		<!--| Question Container | -->
		<div class="question-container">
			<!--Question Bar -->
			<div class="question-bar">
				<div><p>Instruções</p></div>
				<div><p>Output</p></div>
			</div>
			<!--Question Bar -->
			<div class="question-content">
				{@html currentQuestion?.value?.content ?? 'no content'}
			</div>
		</div>
		<!-- | Question Container | -->

		<div class="editor-container"></div>
	</div>
</div>

<style>
	#page-container {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
