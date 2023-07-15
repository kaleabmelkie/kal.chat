<script lang="ts">
	import { navigating } from '$app/stores'
	import XSvg from '$lib/icons/x.svg.svelte'
	import { clearAllToasts, clearToast, toastsStore } from '$lib/stores/toasts-store'
	import { fly } from 'svelte/transition'

	$: {
		if ($navigating !== null) {
			clearAllToasts()
		}
	}

	let timeoutDivRefs: { [key: string]: HTMLDivElement } = {}
</script>

<div class="fixed right-4 top-4 z-50 grid w-full max-w-sm gap-3 pl-8">
	{#each $toastsStore as toast (toast)}
		<div
			transition:fly={{ y: -16 }}
			class="relative flex transform-gpu overflow-hidden rounded shadow-xl ring-4 backdrop-blur {toast.type ===
			'info'
				? 'bg-primary-200/75 text-primary-900 shadow-primary-600/10 ring-primary-400/50'
				: toast.type === 'error'
				? 'bg-red-200/75 text-red-900 shadow-red-600/10 ring-red-400/50'
				: ''}"
		>
			<pre
				class="sm:text-h3 my-auto flex-1 whitespace-pre-wrap break-all px-4 py-3 font-sans">{toast.message}</pre>

			<button
				class="w-max flex-shrink-0 select-none rounded px-4 py-3 text-xl text-slate-900/50 transition-all hover:text-red-600"
				type="button"
				on:click={() => clearToast(toast.id)}
			>
				<XSvg class="h-3 w-3" />
			</button>

			{#if toast.timeout}
				<div
					bind:this={timeoutDivRefs[toast.id]}
					class="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full transform-gpu rounded-l transition-all ease-linear {toast.type ===
					'info'
						? 'bg-primary-400'
						: toast.type === 'error'
						? 'bg-red-400'
						: ''}"
					style="transition-duration: {(() => {
						setTimeout(() => {
							if (timeoutDivRefs[toast.id]) {
								timeoutDivRefs[toast.id].style.width = '0%'
							}
						}, 0)
						return toast.timeout
					})()}ms"
				/>
			{/if}
		</div>
	{/each}
</div>
