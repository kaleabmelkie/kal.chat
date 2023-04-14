<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Error {$page.status} | kal.chat — Better Chat Interface for GPT</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-xs gap-4 overflow-auto">
		<h2 class="text-2xl text-red-500">Error {$page.status}</h2>
		<pre class="whitespace-pre-wrap">{$page.error?.message ?? 'Unknown error'}</pre>
		<div />
		<a
			class="pointer-events-auto flex w-full transform-gpu items-center justify-center rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg text-primary-600 transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 dark:bg-primary-950/90 dark:text-primary-400 dark:hover:bg-primary-950/95 dark:focus:bg-primary-950/95 dark:active:bg-primary-950/75 dark:disabled:bg-primary-950/50 sm:backdrop-blur lg:backdrop-blur"
			href="/"
		>
			Go home
		</a>
	</div>
</div>
