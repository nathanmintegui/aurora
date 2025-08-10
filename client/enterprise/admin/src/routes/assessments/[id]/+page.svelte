<script lang="ts">
	import type { PageProps } from './$types';
	import CandidateCardAssessment from './components/CandidateCardAssessment.component.svelte';
	import { page } from '$app/stores';

	let { data }: PageProps = $props();

	const current_route = $page.url.pathname
		.split('/')
		.filter((i) => Number.isNaN(Number(i)) && i.length !== 36);

	const candidates = data.candidates;
	const assessment = data.assessment;
</script>

<svelte:head>
	<title>Aurora | Assessments</title>
</svelte:head>

<div class="flex cursor-pointer gap-2 bg-gray-300 p-4">
	{#each current_route as menu, idx}
		<p class="hover:text-stone-700">{menu}</p>
		{#if idx < current_route.length - 1}
			<p>></p>
		{/if}
	{/each}
</div>

<div class="m-4">
	<div class="">
		<p>Assesment <strong>{assessment.name}</strong></p>
		<p>Assesment ID <strong>{assessment.id}</strong></p>
		<p>Qualyfing criteria <strong>{assessment.qualifying_criteria}%</strong></p>
	</div>

	<div class="flex flex-col gap-2">
		{#each candidates as candidate}
			<CandidateCardAssessment {...candidate} assessment_id={assessment.id} />
		{/each}
	</div>
</div>
