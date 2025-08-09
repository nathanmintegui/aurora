<script lang="ts">
	import type { PageProps } from './$types';
	import CandidateCardAssessment from './components/CandidateCardAssessment.component.svelte';

	let { data }: PageProps = $props();

	const candidates = data.candidates;
	const assessment = data.assessment;
</script>

<svelte:head>
	<title>Aurora | Assessments</title>
</svelte:head>
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
