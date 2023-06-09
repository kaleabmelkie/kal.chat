import Bowser from 'bowser'

export async function load(event) {
	const userAgentParser = Bowser.getParser(event.request.headers.get('user-agent') || ' ')

	return {
		browser: {
			isAndroid: userAgentParser.getOS().name === 'Android',
			isMicrosoftEdgeOnMacOS:
				userAgentParser.getOS().name === 'macOS' &&
				userAgentParser.getBrowserName() === 'Microsoft Edge',
		},

		session: event.locals.getSession() as Promise<EnhancedSessionType | null>,
	}
}
