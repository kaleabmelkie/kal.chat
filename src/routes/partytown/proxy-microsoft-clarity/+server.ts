import { error } from '@sveltejs/kit'

const clarityDomain = 'https://www.clarity.ms'

export async function GET(event) {
	const href = event.url.searchParams.get('href')

	if (!href?.startsWith(`${clarityDomain}/`)) {
		throw error(400, 'Invalid URL')
	}

	const targetUrl = `${clarityDomain}/${href.replace(`${clarityDomain}/`, '')}`

	return new Response(null, {
		status: 302,
		headers: {
			'Access-Control-Allow-Origin': '*',
			Location: targetUrl,
		},
	})
}
