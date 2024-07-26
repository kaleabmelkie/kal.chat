<script lang="ts">
	import { clickOutside } from '$lib/actions/click-outside'
	import ClipboardSvg from '$lib/icons/clipboard.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { chatStore, type ChatStoreType } from '$lib/stores/chat-store'
	import { err, toast } from '$lib/stores/toasts-store'
	import 'highlight.js/styles/github-dark.css'
	import { fly, slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: ChatStoreType['activeTopic']['messages'][number]
	export let isInContextWindow: boolean

	let articleEle: HTMLElement | null = null
	let isOptionsExpanded = false
</script>

<li class="group flex {className}" transition:slide={{ duration: 150 }}>
	<div
		class="relative grid justify-items-start gap-2 {message.role === 'user'
			? 'ml-auto pl-8'
			: 'pr-8'}"
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
			class="match-braces prose relative max-w-full overflow-x-auto overflow-y-hidden text-lg {isInContextWindow
				? ''
				: 'opacity-50'} {message.role === 'user'
				? `prose-invert rounded-2xl rounded-tl bg-gradient-to-tr from-primary-700/90 to-primary-500/75 p-4 text-white shadow-primary-600/10 dark:from-primary-950/90 dark:to-primary-700/75 dark:shadow-black/10 ${isInContextWindow ? 'shadow' : 'text-black'}`
				: 'pb-4 pr-4 pt-2 dark:prose-invert'} {articleClassName}"
			title={isInContextWindow ? undefined : 'This message is outside the context window'}
			bind:this={articleEle}
		>
			{@html message.content}
		</article>

		{#if message.id !== -1}
			<div use:clickOutside={() => (isOptionsExpanded = false)}>
				<button
					class="absolute top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-primary-900/75 shadow-sm shadow-primary-600/10 transition-all hover:bg-white hover:text-primary-600 hover:shadow focus:bg-primary-50 focus:text-primary-600 focus:opacity-100 focus:shadow active:bg-primary-300 active:text-primary-600 active:opacity-100 active:shadow-none group-hover:opacity-100 group-active:opacity-100 dark:bg-primary-950/50 dark:text-primary-200/50 dark:shadow-black/20 dark:hover:bg-primary-950 dark:hover:text-primary-300 dark:focus:bg-primary-900 dark:active:bg-primary-800 dark:active:text-primary-400 {isOptionsExpanded
						? 'animate-pulse !bg-primary-200/50 !shadow-none dark:!bg-primary-950/50'
						: 'sm:opacity-0'} {message.role === 'user' ? 'left-0 -ml-2' : 'right-0 -mr-2'}"
					type="button"
					title="Message Options"
					on:click={() => (isOptionsExpanded = !isOptionsExpanded)}
				>
					<MoreVerticalSvg class="h-5 w-5 rotate-90" />
				</button>

				{#if isOptionsExpanded}
					<div
						class="drop-down top-14 {message.role === 'user' ? 'left-0 -ml-2' : 'right-0 -mr-2'}"
						transition:fly={{ duration: 150, y: -16 }}
					>
						<button
							class="drop-down-item"
							type="button"
							on:click={async () => {
								const text = articleEle?.textContent
								if (text) {
									await navigator.clipboard.writeText(text.trim())
									toast('Copied to clipboard!')
									isOptionsExpanded = false
								} else {
									err('Failed to copy to clipboard!')
								}
							}}
						>
							<ClipboardSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
							<span>Copy as plain text</span>
						</button>

						<button
							class="drop-down-item"
							type="button"
							on:click={async () => {
								await navigator.clipboard.writeText(message.content.trim())
								toast('Copied to clipboard!')
								isOptionsExpanded = false
							}}
						>
							<ClipboardSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
							<span>Copy as HTML</span>
						</button>

						<button
							class="drop-down-item drop-down-item-danger"
							type="button"
							on:click={async () => {
								if (!$chatStore) {
									return
								}
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
									$chatStore.activeTopic.messages = $chatStore.activeTopic.messages.filter(
										(m) => m.id !== message.id,
									)
									const currentHistoryIndex = $chatStore.topicsHistory.findIndex(
										(t) => t.id === $chatStore?.activeTopic.id,
									)
									if (currentHistoryIndex >= 0) {
										$chatStore.topicsHistory[currentHistoryIndex].messagesCount -= 1
									}
								} else {
									try {
										const json = await response.json()
										err(json.message)
									} catch {
										err('Failed to delete message!')
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
	article :global(pre) {
		@apply overflow-y-hidden !rounded-xl bg-black bg-gradient-to-tr from-primary-600/10 to-primary-400/30 p-[1rem] text-sm leading-6 dark:bg-primary-950 dark:from-black/75 dark:to-black/50;

		overflow-x: overlay;
		scrollbar-color: rgb(255 255 255 / 0.1) transparent;
	}
	article :global(pre::-webkit-scrollbar-thumb) {
		box-shadow: 12px 0 0 12px rgb(255 255 255 / 0.1) inset;
	}
</style>
