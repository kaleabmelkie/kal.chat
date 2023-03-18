import { partytownVite } from '@builder.io/partytown/utils'
import { sveltekit } from '@sveltejs/kit/vite'
import path from 'path'
import type { UserConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default {
	plugins: [
		partytownVite({
			dest: path.join(__dirname, 'static', '~partytown'),
		}),

		sveltekit(),

		visualizer({
			emitFile: true,
			filename: 'admin/bundle',
			gzipSize: true,
			brotliSize: true,
		}),
	],
} satisfies UserConfig
