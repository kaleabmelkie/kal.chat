import { error, redirect } from '@sveltejs/kit'

const clarityDomain = 'https://www.clarity.ms'

export async function GET(event) {
	const href = event.url.searchParams.get('href')

	if (!href?.startsWith(`${clarityDomain}/`)) {
		throw error(400, 'Invalid URL')
	}

	throw redirect(302, `${clarityDomain}/${href.replace(`${clarityDomain}/`, '')}`)
}
