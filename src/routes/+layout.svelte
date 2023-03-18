<script>
	import '../app.postcss'

	import Header from '$lib/components/header.svelte'
</script>

<main class="bg-gradient-to-t from-blue-50 to-blue-100 bg-fixed">
	<div class="no-repeat bg-fixed" style="background-image: url(/assets/background-patterns/x.svg);">
		<Header />

		<slot />

		<a
			class="pointer-events-auto fixed left-4 bottom-4 text-sm text-blue-900/50 underline-offset-2 hover:underline lg:left-6"
			href="mailto:support@kal.chat"
			target="_blank"
			title="Send feedback to feedback@kal.chat"
		>
			Give Feedback
		</a>
	</div>
</main>
