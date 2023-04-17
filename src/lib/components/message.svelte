<script lang="ts">
	import { invalidate } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ClipboardSvg from '$lib/icons/clipboard.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import 'highlight.js/styles/github-dark.css'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { slide } from 'svelte/transition'
	import type { PageData } from '../../routes/topic/[id]/$types'

	let className = ''
	export { className as class }
	export let data: PageData
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
			class="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 {message.role ===
			'user'
				? 'text-right'
				: 'text-left'}"
		>
			{message.role === 'user' ? 'You' : 'Kal'}
		</div>

		<article
			class="match-braces prose relative rounded-2xl bg-gradient-to-tr p-4 text-lg shadow-md shadow-primary-600/10 dark:shadow-black/10 {message.role ===
			'user'
				? 'prose-invert rounded-tr from-primary-700/90 to-primary-500/75 text-white dark:from-primary-900/90 dark:to-primary-600/90'
				: 'rounded-tl from-white/95 to-white/75 text-black dark:prose-invert dark:bg-primary-500 dark:from-black/75 dark:to-black/60 dark:text-white'} {articleClassName}"
			bind:this={articleEle}
		>
			{@html message.content}
		</article>

		{#if message.id !== -1}
			<div use:clickOutside={() => (isOptionsExpanded = false)}>
				<button
					class="absolute top-9 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-primary-900/75 shadow-sm shadow-primary-600/10 transition-all hover:bg-white hover:text-primary-600 hover:shadow focus:bg-primary-50 focus:text-primary-600 focus:opacity-100 focus:shadow active:bg-primary-300 active:text-primary-600 active:opacity-100 active:shadow-none group-hover:opacity-100 group-active:opacity-100 dark:bg-primary-950/50 dark:text-primary-200/50 dark:shadow-black/20 dark:hover:bg-primary-950 dark:hover:text-primary-300 dark:focus:bg-primary-900 dark:active:bg-primary-800 dark:active:text-primary-400 {isOptionsExpanded
						? '!top-6 animate-pulse !bg-primary-200/50 !shadow-none dark:!bg-primary-950/50'
						: 'sm:opacity-0'} {message.role === 'user' ? 'left-0 -ml-2' : 'right-0 -mr-2'}"
					type="button"
					title="Message Options"
					on:click={() => (isOptionsExpanded = !isOptionsExpanded)}
				>
					<MoreVerticalSvg class="h-5 w-5 rotate-90" />
				</button>

				{#if isOptionsExpanded}
					<div
						class="absolute top-14 z-50 grid w-max rounded-[1rem] bg-white/90 p-2 shadow-lg shadow-primary-900/20 backdrop-blur-sm dark:bg-primary-950/90 dark:shadow-black/30 {message.role ===
						'user'
							? 'left-0 -ml-2'
							: 'right-0 -mr-2'}"
						transition:slide={{ duration: 150 }}
					>
						<button
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:text-white/75 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
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
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:text-white/75 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
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
							class="flex items-center gap-3 rounded-[calc(1rem-0.5rem/2)] py-3 pl-3 pr-6 text-left text-sm font-medium text-red-500/95 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
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
									data.topic.Message = data.topic.Message.filter((msg) => msg.id !== message.id)
									for (let i = 0; i < data.topics.length; i++) {
										const isMessageInThread = data.topics[i].Message.find(
											(msg) => msg.id === message.id,
										)
										if (isMessageInThread) {
											data.topics[i].Message = data.topics[i].Message.filter(
												(msg) => msg.id !== message.id,
											)
											break
										}
										data = data
										await invalidate($page.url)
									}
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
		@apply !rounded-xl bg-black bg-gradient-to-tr from-primary-600/50 to-primary-400/50 p-[1rem] text-sm leading-6 dark:bg-primary-950 dark:from-black/75 dark:to-black/50;
	}
</style>
