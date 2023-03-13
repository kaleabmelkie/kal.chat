<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
</script>

<main class="bg-gradient-to-t from-sky-50 to-sky-100 bg-fixed">
	<Header />

	<slot />
</main>
