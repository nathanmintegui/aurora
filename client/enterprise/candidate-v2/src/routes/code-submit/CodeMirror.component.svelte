<script lang="ts">
	import { basicSetup, EditorView } from 'codemirror';
	import { onMount } from 'svelte';

	let dom: HTMLDivElement;

	onMount(function () {
		new EditorView({
			doc: 'doc',
			extensions: [basicSetup],
			parent: dom
		});
	});
</script>

<div bind:this={dom} class="editor"></div>

<style>
	.editor {
		display: block;
		font-size: 12px;
	}
</style>
