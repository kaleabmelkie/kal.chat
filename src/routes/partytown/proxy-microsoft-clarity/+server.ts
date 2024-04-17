import { error } from '@sveltejs/kit'

const clarityDomain = 'https://www.clarity.ms'

export async function GET(event) {
	const href = event.url.searchParams.get('href')

	if (!href?.startsWith(`${clarityDomain}/`)) {
		error(400, 'Invalid URL')
	}

	const response = await fetch(`${clarityDomain}/${href.replace(`${clarityDomain}/`, '')}`)

	return new Response(response.body, {
		status: response.status,
		headers: {
			...response.headers,
			'Access-Control-Allow-Origin': '*',
		},
	})
}
