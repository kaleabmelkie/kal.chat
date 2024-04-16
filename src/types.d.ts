// THESE ARE TEMPORARY FIXES FOR @auth/sveltekit TYPES:
declare module '@auth/sveltekit/client' {
	import Client from '@auth/sveltekit/dist/client'
	export default Client
	export * from '@auth/sveltekit/dist/client'
}
declare module '@auth/sveltekit/providers' {
	import Providers from '@auth/sveltekit/dist/providers'
	export default Providers
	export * from '@auth/sveltekit/dist/providers'
}
declare module '@auth/sveltekit/providers/github' {
	import GitHub from '@auth/sveltekit/dist/providers/github'
	export default GitHub
	export * from '@auth/sveltekit/dist/providers/github'
}
declare module '@auth/sveltekit/providers/google' {
	import Google from '@auth/sveltekit/dist/providers/google'
	export default Google
	export * from '@auth/sveltekit/dist/providers/google'
}
