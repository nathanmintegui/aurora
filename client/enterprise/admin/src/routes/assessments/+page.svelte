<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import type { AssessmentType } from '$lib/types';

	let { data }: PageProps = $props();

	const current_route = $page.url.pathname
		.split('/')
		.filter((i) => Number.isNaN(Number(i)) && i.length !== 36);

	const assessments = data?.assessments;
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
	<div class="flex flex-col gap-2">
		{#each assessments as assessment}
			{@render render_assessment(assessment)}
		{/each}
	</div>
</div>

{#snippet render_assessment(assessment: AssessmentType)}
	<a
		href={'/assessments/' + assessment?.id}
		class="flex cursor-pointer items-center justify-between border-b p-4 transition-colors duration-200 hover:bg-slate-200"
	>
		<div>
			<p><strong>#{assessment.id}</strong></p>
			<p>{assessment.name}</p>
			<div>
				<div>
					<p>{assessment.qualyfing_criteria}%</p>
				</div>
			</div>
		</div></a
	>
{/snippet}
