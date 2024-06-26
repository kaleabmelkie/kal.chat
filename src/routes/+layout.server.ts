import Bowser from 'bowser'

export async function load(event) {
	const userAgentParser = Bowser.getParser(event.request.headers.get('user-agent') || ' ')

	return {
		browser: {
			isDesktop: userAgentParser.getPlatformType(true) === 'desktop',
			isAndroid: userAgentParser.getOS().name === 'Android',
			isMicrosoftEdgeOnMacOS:
				userAgentParser.getOS().name === 'macOS' &&
				userAgentParser.getBrowserName() === 'Microsoft Edge',
		},

		session: await event.locals.auth(),
	}
}
