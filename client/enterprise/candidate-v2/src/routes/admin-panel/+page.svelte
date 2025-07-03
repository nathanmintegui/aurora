<script lang="ts">
	import { writable } from 'svelte/store';

	const imgSrc = writable('');
	let videoSrc = writable('');

	const socket = new WebSocket('ws://localhost:2002/ws');

	socket.onmessage = (event) => {
		const base64 = event.data.replaceAll('"', '');
		imgSrc.set(`data:image/jpeg;base64,${base64}`);
	};

	socket.onerror = (event) => {
		console.error('[ERROR]: WebSocket error: ', event);
	};
</script>

<div>yummy</div>

{#if $imgSrc}
	<img src={$imgSrc} alt="img" />
{/if}
