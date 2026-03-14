import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: [
			"svelte-codemirror-editor",
			"codemirror",
			"@codemirror/language-javascript",
			"@codemirror/language-python",
			"@replit/codemirror-vim"
		],
	},
});
