export async function load(event) {
	return {
		session: await event.locals.getSession(),
	}
}
