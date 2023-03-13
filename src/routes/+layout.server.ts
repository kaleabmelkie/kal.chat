export async function load(event) {
	return {
		session: event.locals.getSession(),
	}
}
