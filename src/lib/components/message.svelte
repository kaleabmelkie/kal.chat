<script lang="ts">
	import { clickOutside } from '$lib/actions/click-outside'
	import ClipboardSvg from '$lib/icons/clipboard.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import 'highlight.js/styles/github-dark.css'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: { id: number } & ChatCompletionRequestMessage

	let articleEle: HTMLElement | null = null
	let isOptionsExpanded = false
</script>

<li class="group flex {className}">
	<div
		class="relative grid max-w-screen-md gap-2 {message.role === 'user'
			? 'ml-auto pl-8'
			: 'mr-auto pr-8'}"
		transition:slide|local={{ duration: 150 }}
	>
		<div
			class="text-xs font-semibold uppercase text-primary-600 {message.role === 'user'
				? 'text-right'
				: 'text-left'}"
		>
			{message.role === 'user' ? 'You' : 'Kal'}
		</div>

		<article
			class="match-braces prose relative rounded-[1rem] bg-gradient-to-tr p-[1rem] text-lg shadow-md shadow-primary-600/10 {message.role ===
			'user'
				? 'prose-invert rounded-tr from-primary-700/90 to-primary-500/75 text-white'
				: 'rounded-tl from-white/95 to-white/75 text-black'} {articleClassName}"
			bind:this={articleEle}
		>
			{@html message.content}
		</article>

		{#if message.id !== -1}
			<div use:clickOutside={() => (isOptionsExpanded = false)}>
				<button
					class="absolute top-9 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-primary-900/75 shadow-sm shadow-primary-600/10 transition-all hover:bg-white hover:text-primary-600 hover:shadow focus:bg-primary-50 focus:text-primary-600 focus:opacity-100 focus:shadow active:bg-primary-300 active:text-primary-600 active:opacity-100 active:shadow-none group-hover:opacity-100 group-active:opacity-100 {isOptionsExpanded
						? '!top-6 animate-pulse !bg-primary-200 !shadow-none'
						: 'sm:opacity-0'} {message.role === 'user' ? 'left-0 -ml-2' : 'right-0 -mr-2'}"
					type="button"
					title="Message Options"
					on:click={() => (isOptionsExpanded = !isOptionsExpanded)}
				>
					<MoreVerticalSvg class="h-5 w-5 rotate-90 transition-all" />
				</button>

				{#if isOptionsExpanded}
					<div
						class="absolute top-14 z-10 grid w-max rounded-[1rem] bg-white/90 p-2 shadow-lg shadow-primary-900/20 backdrop-blur-sm {message.role ===
						'user'
							? 'left-0 -ml-2'
							: 'right-0 -mr-2'}"
						transition:slide={{ duration: 150 }}
					>
						<button
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								const text = articleEle?.textContent
								if (text) {
									await navigator.clipboard.writeText(text)
									alert('Copied to clipboard!')
									isOptionsExpanded = false
								} else {
									alert('Failed to copy to clipboard!')
								}
							}}
						>
							<ClipboardSvg class="h-5 w-5 text-primary-600/90" />
							<span>Copy as plain text</span>
						</button>
						<button
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								await navigator.clipboard.writeText(message.content)
								alert('Copied to clipboard!')
								isOptionsExpanded = false
							}}
						>
							<ClipboardSvg class="h-5 w-5 text-primary-600/90" />
							<span>Copy as HTML</span>
						</button>
						<button
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-red-500/95 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								if (!confirm('Are you sure you want to delete this message?')) {
									return
								}

								const response = await fetch(`/message/${message.id}/delete`, {
									method: 'DELETE',
									headers: {
										'Content-Type': 'application/json',
									},
								})
								if (response.ok) {
									alert('Message deleted!')
								} else {
									try {
										const json = await response.json()
										alert(json.message)
									} catch (err) {
										alert('Failed to delete message!')
									}
								}

								isOptionsExpanded = false
							}}
						>
							<TrashSvg class="h-5 w-5" />
							<span>Delete</span>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</li>

<style lang="postcss">
	article {
		@apply w-full max-w-full overflow-x-auto;
	}

	article :global(pre) {
		@apply !rounded-[calc(1rem-1rem/2)] bg-black bg-gradient-to-tr from-primary-600/50 to-primary-400/50 p-[1rem] text-sm leading-6;
	}
</style>
