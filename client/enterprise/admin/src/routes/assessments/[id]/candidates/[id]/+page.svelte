<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const result_card_map = {
		easy: {
			label: 'Fácil',
			class: 'bg-green-400'
		},
		medium: {
			label: 'Médio',
			class: 'bg-yellow-400'
		},
		hard: {
			label: 'Difícil',
			class: 'bg-red-400'
		}
	};

	const personal_info = data?.personal_info || {};
	const assessment_info = data?.assessment_info || {};
</script>

<div>
	<p>{personal_info.name}</p>
	<p>{personal_info.specialization}</p>
	<p>{personal_info.email}</p>

	<p>Desempenho {personal_info.perfomance}%</p>

	<p>Questões</p>
	<div>
		{#each Object.entries(assessment_info.results) as [key, value]}
			{@render result_card(key, value.total, value.hits)}
		{/each}
	</div>
</div>

{#snippet result_card(difficulty: string, total: number, hits: number)}
	<p>{result_card_map[difficulty].label}</p>
	<div class="flex items-center gap-3">
		<div class="flex gap-1">
			{#each { length: total }, idx}
				<div class={`h-4 w-4 border ${idx < hits && result_card_map[difficulty].class}`}></div>
			{/each}
		</div>
		<p>{hits}/{total}</p>
	</div>
{/snippet}
