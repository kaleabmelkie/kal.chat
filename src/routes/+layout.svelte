<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
	import { page } from '$app/stores'
</script>

<svelte:head>
	<link rel="canonical" href="{$page.url.origin}{$page.url.pathname}" />
</svelte:head>

<main class="bg-gradient-to-t from-primary-50 to-primary-100 bg-fixed">
	<div
		class="no-repeat pointer-events-none fixed inset-0 z-0 bg-fixed"
		style="background-image: url(/assets/background-patterns/x.svg);"
	/>

	<div class="relative z-10">
		<Header />

		<slot />
	</div>
</main>
