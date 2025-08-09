<script lang="ts">
	let { id, name, email, specialization, perfomance, assessment_id } = $props();

	function get_href_link() {
		return '/assessments/' + assessment_id + '/candidates/' + id;
	}
</script>

<div
	class="flex items-center justify-between border-b p-4 transition-colors duration-200 hover:bg-slate-200"
>
	<div>
		<p>{name}</p>
		<p>{email}</p>
		<p>{specialization}</p>
	</div>

	<div>
		<p>{perfomance}%</p>
	</div>

	<a class="rounded-sm border px-2 py-1 text-sm text-blue-600" href={get_href_link()}>Review</a>
</div>
