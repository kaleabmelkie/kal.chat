<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Error ${$page.status} | kal.chat — Better Chat Interface for GPT</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-xs gap-4 overflow-auto">
		<h2 class="text-2xl text-red-500">Error {$page.status}</h2>
		<pre class="whitespace-pre-wrap">{$page.error?.message ?? 'Unknown error'}</pre>
		<div />
		<a
			class="pointer-events-auto flex w-full items-center justify-center rounded-[1.75rem] bg-white/90 py-3 px-4 text-lg text-blue-600 transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-blue-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50"
			href="/"
		>
			Go home
		</a>
	</div>
</div>
