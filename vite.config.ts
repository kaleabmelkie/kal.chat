import { partytownVite } from '@builder.io/partytown/utils'
import { sveltekit } from '@sveltejs/kit/vite'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import type { UserConfig } from 'vite'

export default {
	plugins: [
		partytownVite({
			dest: path.join(__dirname, 'static', '~partytown'),
		}),

		sveltekit(),

		visualizer({
			emitFile: true,
			filename: 'admin/bundle.html',
			gzipSize: true,
			brotliSize: true,
		}),
	],
} satisfies UserConfig
