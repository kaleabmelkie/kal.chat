import { dev } from '$app/environment'
import { imageBreakpoints } from '$lib/configs/image-breakpoints.js'

const defaultQuality = 90

export function getImgSrc(
	sourceUrl: string,
	width: (typeof imageBreakpoints)[number],
	quality = defaultQuality,
) {
	if (dev) {
		return sourceUrl
	}

	return `/_vercel/image?url=${encodeURIComponent(sourceUrl)}&w=${width}&q=${quality}`
}

export function getResponsiveImgSrcSet(sourceUrl: string, quality = defaultQuality) {
	return imageBreakpoints.map((bp) => `${getImgSrc(sourceUrl, bp, quality)} ${bp}w`).join(', ')
}
