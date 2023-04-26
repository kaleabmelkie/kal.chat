<script>
	import '../app.postcss'

	import { dev } from '$app/environment'
	import { page, updated } from '$app/stores'
	import Header from '$lib/components/header.svelte'
</script>

<svelte:head>
	<link rel="canonical" href="{$page.url.origin}{$page.url.pathname}" />

	{#if !dev}
		<script type="text/partytown">
			// prettier-ignore
			(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-T4J9SKX');
		</script>
	{/if}
</svelte:head>

<main
	class="bg-gradient-to-t from-primary-50 to-primary-100 bg-fixed dark:from-primary-950/20 dark:to-primary-950/40"
	data-sveltekit-reload={$updated ? '' : 'off'}
>
	<div
		class="no-repeat pointer-events-none fixed inset-0 z-0 block bg-fixed dark:hidden"
		style="background-image: url(/assets/background-patterns/x.svg);"
	/>
	<div
		class="no-repeat pointer-events-none fixed inset-0 z-0 hidden bg-fixed dark:block"
		style="background-image: url(/assets/background-patterns/x-dark.svg);"
	/>

	<div class="relative z-10">
		<Header />

		<slot />
	</div>
</main>
