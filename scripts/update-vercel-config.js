import fs from 'node:fs'
import { imageBreakpoints } from '../src/lib/configs/image-breakpoints.js'

const config_file = '.vercel/output/config.json'
const config = JSON.parse(fs.readFileSync(config_file, 'utf8'))

config.images = {
	sizes: imageBreakpoints,
	domains: [],
	formats: ['image/avif', 'image/webp'],
	minimumCacheTTL: 300,
}

config.github = {
	silent: true,
}

fs.writeFileSync(config_file, JSON.stringify(config, null, '\t'))
