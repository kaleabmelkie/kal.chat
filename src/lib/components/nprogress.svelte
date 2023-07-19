<script lang="ts">
	import 'nprogress/nprogress.css'

	import { browser } from '$app/environment'
	import { navigating } from '$app/stores'
	import NProgress from 'nprogress'

	const delay = 250

	let timer: number | null = null
	let state: 'loading' | 'stop' | null = null
	let activeRequests = 0

	function load() {
		if (state === 'loading') {
			return
		}

		state = 'loading'

		timer = setTimeout(function () {
			NProgress.start()
		}, delay) as unknown as number
	}

	function stop() {
		if (activeRequests > 0) {
			return
		}

		state = 'stop'

		if (timer) {
			clearTimeout(timer)
		}
		NProgress.done()
	}

	$: {
		if ($navigating) {
			load()
		} else {
			stop()
		}
	}

	if (browser) {
		NProgress.configure({ showSpinner: false })

		load()

		const originalFetch = window.fetch
		window.fetch = async function (...args) {
			if (activeRequests === 0) {
				load()
			}

			activeRequests++

			try {
				const response = await originalFetch(...args)
				return response
			} catch (error) {
				return Promise.reject(error)
			} finally {
				activeRequests -= 1
				if (activeRequests === 0) {
					stop()
				}
			}
		}
	}
</script>

<style lang="postcss">
	:global(#nprogress .bar) {
		@apply h-1 bg-gradient-to-r from-primary-700 to-primary-500;
	}
	:global(#nprogress .bar .peg) {
		@apply hidden;
	}
</style>
