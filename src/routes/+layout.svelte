<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
</script>

<main class="bg-gradient-to-t from-emerald-50 to-emerald-100 bg-fixed">
	<div class="no-repeat bg-fixed" style="background-image: url(/assets/background-patterns/x.svg);">
		<Header />

		<slot />
	</div>
</main>
