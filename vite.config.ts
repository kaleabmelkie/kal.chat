import { partytownVite } from '@builder.io/partytown/utils'
import { sveltekit } from '@sveltejs/kit/vite'
import path from 'path'
import type { UserConfig } from 'vite'

export default {
	plugins: [
		partytownVite({
			dest: path.join(__dirname, 'static', '~partytown'),
		}),
		sveltekit(),
	],
} satisfies UserConfig
