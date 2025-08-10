<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen w-screen gap-2 border">
	<nav class="flex w-[15%] flex-col border-r">
		<p class="my-4 text-center font-bold">Aurora</p>
		<a href="/assessments" class="pl-4">Assessments</a>
	</nav>
	<div class="w-[85%]">
		{@render children()}
	</div>
</div>
