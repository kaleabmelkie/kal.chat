<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
</script>

<main class="bg-gradient-to-t from-primary-50 to-primary-100 bg-fixed">
	<div class="no-repeat bg-fixed" style="background-image: url(/assets/background-patterns/x.svg);">
		<Header />

		<slot />
	</div>
</main>
