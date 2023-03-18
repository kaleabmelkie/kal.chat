<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
</script>

<main class="bg-gradient-to-t from-emerald-50 to-emerald-100 bg-fixed">
	<Header />

	<slot />
</main>
