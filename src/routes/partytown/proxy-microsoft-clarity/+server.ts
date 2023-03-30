import { error } from '@sveltejs/kit'

const clarityDomain = 'https://www.clarity.ms'

export async function GET(event) {
	const href = event.url.searchParams.get('href')

	if (!href?.startsWith(`${clarityDomain}/`)) {
		throw error(400, 'Invalid URL')
	}

	const targetUrl = `${clarityDomain}/${href.replace(`${clarityDomain}/`, '')}`

	return await fetch(targetUrl, {
		headers: {
			...event.request.headers,
			'Access-Control-Allow-Origin': '*',
		},
	})
}
