<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>Error {$page.status} | kal.chat — Better Chat Interface for GPT</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center p-4 pb-64">
	<div class="grid w-full max-w-[54rem] justify-items-start gap-4">
		<h2 class="text-2xl font-semibold text-red-500">Error {$page.status}</h2>
		<pre class="w-full overflow-x-auto whitespace-pre-wrap break-words">{$page.error?.message ??
				'Unknown error'}</pre>
		<div />
		<a class="button pointer-events-auto" href="/"> Go home </a>
	</div>
</div>
