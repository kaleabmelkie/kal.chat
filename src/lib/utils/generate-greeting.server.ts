const greetingTemplate = [
	`Hi {NAME}, how can I be of service today?`,
	`What can I help you with, {NAME}?`,
	`Have any questions, {NAME}? Ask away!`,
	`How can I assist you, {NAME}?`,
	`Need any help, {NAME}?`,
	`What can I do for you, {NAME}?`,
	`Hi {NAME}, is there anything on your mind that I can help with?`,
	`How may I assist you today, {NAME}?`,
	`How can I make your day easier, {NAME}?`,
	`Any questions for me, {NAME}?`,
	`Hi {NAME}, what brings you here?`,
	`How can I make your experience better, {NAME}?`,
	`Hi {NAME}, what do you need help with?`,
	`What can I do to assist you, {NAME}?`,
	`How may I serve you, {NAME}?`,
	`Hi {NAME}, what can I help you with right now?`,
	`Do you need any assistance, {NAME}?`,
	`Hi {NAME}, is there anything I can help with?`,
	`How can I support you today, {NAME}?`,
	`Want to know how I can assist you, {NAME}?`,
	`Hi {NAME}, what kind of help are you looking for?`,
	`What do you need help with today, {NAME}?`,
	`Hi {NAME}, how can I be of assistance to you?`,
	`How can I make your day better, {NAME}?`,
	`What can I help you with right now, {NAME}?`,
	`Hi {NAME}, can I assist you with anything specific?`,
	`Do you need any assistance with anything, {NAME}?`,
	`Hi {NAME}, is there anything you'd like me to help with?`,
	`What can I do to make your experience better, {NAME}?`,
	`How may I make your life easier, {NAME}?`,
	`Hi {NAME}, what can I help you with today?`,
	`What's on your mind, {NAME}? I'm here to help.`,
	`How may I assist you, {NAME}?`,
	`Hi {NAME}, what can I do for you right now?`,
	`Hi {NAME}, how can I make your day better?`,
	`How may I be of service, {NAME}?`,
	`Is there anything I can help you with today, {NAME}?`,
	`Hi {NAME}, what do you need help with right now?`,
	`Can I assist you with anything specific, {NAME}?`,
	`Hi {NAME}, do you have any questions for me?`,
	`How can I make your experience better today, {NAME}?`,
	`Hi {NAME}, what kind of help do you need?`,
	`Is there anything I can do to support you, {NAME}?`,
	`How may I be of assistance today, {NAME}?`,
	`Hi {NAME}, how can I help you achieve your goals?`,
	`What can I do to make your day more productive, {NAME}?`,
	`Hi {NAME}, do you need any help getting started?`,
	`How can I serve you today, {NAME}?`,
	`Is there anything I can do to simplify your life, {NAME}?`,
	`Hi {NAME}, how can I make your day more productive?`,
] as const

export function generateGreeting(name: string) {
	return greetingTemplate[Math.floor(Math.random() * greetingTemplate.length)].replace(
		'{NAME}',
		name.split(' ')[0],
	)
}