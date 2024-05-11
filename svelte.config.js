import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { imageBreakpoints } from './src/lib/configs/image-breakpoints.js'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			maxDuration: 60,
			images: {
				sizes: imageBreakpoints,
				domains: [],
				formats: ['image/avif', 'image/webp'],
				minimumCacheTTL: 14 * 24 * 60 * 60, // 14 days
			},
		}),

		prerender: {
			origin: 'https://kal.chat',
		},
	},

	vitePlugin: {
		inspector: true,
	},
}

export default config
