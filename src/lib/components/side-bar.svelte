<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import EditBoxSvg from '$lib/icons/edit-box.svg.svelte'
	import EditSvg from '$lib/icons/edit.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { latestNewMessageSentAt } from '$lib/stores/latest-new-message-sent-at'
	import { smallScreenThresholdInPx } from '$lib/utils/constants'
	import { dayjs } from '$lib/utils/dayjs'
	import { onDestroy, onMount, tick } from 'svelte'
	import { fly, slide } from 'svelte/transition'
	import type { PageData } from '../../routes/thread/[id]/$types'

	export let data: PageData
	export let innerWidth: number
	export let isOpen: boolean

	onMount(async () => {
		if (browser) {
			minuteInterval = setInterval(() => {
				minuteKey = Date.now()
			}, 1000) as unknown as number

			scrollableEle?.addEventListener('scroll', updateIsAtTheTop)
		}

		latestNewMessageSentAt.subscribe(() => {
			generateTitleForUnnamedAndEligibleThreads(data.threads).catch(console.error)
		})
	})

	onDestroy(() => {
		if (browser) {
			if (minuteInterval) {
				clearInterval(minuteInterval)
			}

			scrollableEle?.removeEventListener('scroll', updateIsAtTheTop)
		}
	})

	let scrollableEle: HTMLDivElement | null = null
	let isAtTheTop = true
	let topEle: HTMLDivElement | null = null
	let optionsExpandedForThreadId: number | null = null
	let minuteInterval: number
	let minuteKey = Date.now()

	async function updateIsAtTheTop() {
		if (!scrollableEle) {
			return
		}
		isAtTheTop = scrollableEle.scrollTop === 0
	}

	async function scrollToTop() {
		if (!topEle) {
			return
		}
		topEle.scrollIntoView({ behavior: 'smooth' })
		await tick()
		setTimeout(() => {
			if (!topEle) {
				return
			}
			topEle.scrollIntoView({ behavior: 'smooth' })
		}, 150)
	}

	async function handleGenerateTitle(thread: PageData['threads'][number], force: boolean) {
		await fetch(`/thread/${thread.id}/generate-title?force=${force}`, {
			method: 'PUT',
		})
			.then(async (r) => {
				if (!r.ok) {
					throw new Error(
						`${r.statusText} (${r.status}): ${(await r.json())?.message ?? 'Unknown'}`,
					)
				}
				const response = await r.json()
				if (typeof response?.title !== 'string') {
					throw new Error(`Expected a title but did not get one.`)
				}
				thread.updatedAt = response.updatedAt
				const threadIndex = data.threads.findIndex((t) => t.id === thread.id)
				if (threadIndex !== -1) {
					data.threads[threadIndex].title = response.title
					data.threads[threadIndex].updatedAt = response.updatedAt
					data.threads.splice(threadIndex, 1)
					data.threads.unshift(thread)
				}
				scrollToTop()
			})
			.catch((e) => {
				if (force) {
					alert(
						`The title of the thread (ID: ${thread.id}) could not be auto-generated.\n\n${
							e?.message ?? 'Unknown error.'
						}`,
					)
				} else {
					console.error(e)
				}
			})
	}

	async function generateTitleForUnnamedAndEligibleThreads(threads: PageData['threads']) {
		for (const thread of threads) {
			if (!thread.title && thread.Message.length > 2) {
				console.log(`Generating title for unnamed thread (ID: ${thread.id})...`)
				await handleGenerateTitle(thread, false)
			}
		}
	}
	generateTitleForUnnamedAndEligibleThreads(data.threads).catch(console.error)
</script>

<div
	class="absolute z-20 h-screen w-full flex-shrink-0 overflow-auto overflow-x-hidden scroll-smooth bg-white pt-[4.75rem] sm:static sm:w-[18rem] sm:bg-white/25"
	transition:fly={{ duration: 150, x: -32 }}
	bind:this={scrollableEle}
>
	<div class="-mt-[4.75rem] mb-[4.75rem]" bind:this={topEle} />

	<div class="pointer-events-none sticky top-0 z-10 flex items-center p-4 lg:px-6">
		<h2 class="text-primary-600/50 transition-all {isAtTheTop ? 'opacity-100' : 'opacity-0'}">
			Threads
		</h2>
		<span class="flex-1" />
		<button
			class="group pointer-events-auto absolute -right-2 flex h-14 w-20 transform-gpu items-center justify-center rounded-l-full bg-white/50 p-4 text-primary-900 transition-all hover:w-32 hover:bg-white/95 hover:text-primary-600 focus:w-32 focus:bg-white/95 focus:text-primary-600 active:w-32 active:bg-primary-500/5 sm:backdrop-blur-sm lg:pr-6 lg:backdrop-blur"
			type="button"
			on:click={() => (isOpen = false)}
		>
			<ArrowRightSvg
				class="mr-2 !h-5 !w-5 rotate-180 transition-all group-hover:mr-0 group-focus:mr-0 group-active:mr-0"
			/>
			<span class="hidden flex-1 text-center transition-all group-hover:block group-focus:block">
				Hide
			</span>
		</button>
	</div>

	<ul>
		{#each data.threads as thread (thread.id)}
			<li
				class="relative"
				title={thread.title ?? undefined}
				transition:slide|local={{ duration: 150 }}
			>
				<a
					class="group flex gap-1 px-4 py-3 transition-all hover:bg-white/95 focus:bg-white/95 active:bg-primary-500/5 lg:px-6 {$page
						.url.pathname === `/thread/${thread.id}`
						? 'bg-white/50'
						: ''}"
					href="/thread/{thread.id}"
					on:click={() => {
						if (innerWidth < smallScreenThresholdInPx) {
							isOpen = false
						}
					}}
				>
					<div class="flex-1">
						<div
							class="line-clamp-2 text-sm group-hover:text-primary-600 group-focus:text-primary-600 {!thread.title
								? 'italic'
								: ''} {$page.url.pathname === `/thread/${thread.id}`
								? 'font-semibold text-primary-600'
								: 'text-primary-900/90'}"
						>
							{thread.title ?? 'Untitled thread'}
						</div>
						{#key minuteKey}
							<div
								class="text-xs text-primary-900/50"
								title="Last message in this thread was sent on {dayjs(thread.updatedAt).format(
									'MMMM DD, YYYY hh:mm A',
								)}"
							>
								<span>{dayjs(thread.updatedAt).fromNow()}</span>,
								<span title="Messages in this thread plus the system prompt."
									>{thread.Message.length}
									{thread.Message.length === 1 ? 'message' : 'messages'}</span
								>
							</div>
						{/key}
					</div>
					<button
						class="-mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-primary-100/50 {optionsExpandedForThreadId ===
						thread.id
							? 'bg-primary-100/50'
							: ''}"
						on:click|preventDefault|stopPropagation={() => (optionsExpandedForThreadId = thread.id)}
					>
						<MoreVerticalSvg class="h-4 w-4 text-primary-900/50" />
					</button>
				</a>
				{#if optionsExpandedForThreadId === thread.id}
					<div
						class="absolute right-4 top-12 z-30 flex flex-col rounded bg-white/90 p-1 shadow-lg shadow-primary-600/10 backdrop-blur-sm"
						transition:slide={{ duration: 150 }}
						use:clickOutside={() => (optionsExpandedForThreadId = null)}
					>
						<button
							class="flex items-center gap-2 rounded py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={() => {
								if (
									thread.title &&
									!confirm(
										'This thread already has a title. Are you sure you want to auto-regenerate it?',
									)
								) {
									return
								}
								optionsExpandedForThreadId = null
								handleGenerateTitle(thread, true)
							}}
						>
							<EditSvg class="h-4 w-4 text-primary-500/95" />
							<span>{thread.title ? 'Regenerate' : 'Generate'} title</span>
						</button>

						<button
							class="flex items-center gap-2 rounded py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								const newTitle = prompt('New thread title:')
								if (!newTitle) {
									alert('Cancelled because no title was provided.')
									return
								}
								optionsExpandedForThreadId = null
								await fetch(`/thread/${thread.id}/change-title`, {
									method: 'PUT',
									body: JSON.stringify({
										title: newTitle,
									}),
								})
									.then(async (r) => {
										if (!r.ok) {
											throw new Error(
												`${r.statusText} (${r.status}): ${(await r.json())?.message ?? 'Unknown'}`,
											)
										}
										thread.title = newTitle
									})
									.catch((e) =>
										alert(
											`The title of the thread (ID: ${thread.id}) could not be changed.\n\n${
												e?.message ?? 'Unknown error.'
											}`,
										),
									)
							}}
						>
							<EditBoxSvg class="h-4 w-4 text-primary-500/95" />
							<span>Change title</span>
						</button>

						<button
							class="flex items-center gap-2 rounded py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								if (!confirm('Are you sure you want to delete this thread?')) {
									return
								}
								optionsExpandedForThreadId = null
								await fetch(`/thread/${thread.id}/delete`, {
									method: 'DELETE',
								})
									.then(async (r) => {
										if (!r.ok) {
											throw new Error(
												`${r.statusText} (${r.status}): ${(await r.json())?.message ?? 'Unknown'}`,
											)
										}
										data.threads = data.threads.filter((t) => t.id !== thread.id)
										if (data.thread.id === thread.id) {
											await goto('/thread/latest')
										}
									})
									.catch((e) =>
										alert(
											`Thread (ID: ${thread.id}) could not be deleted.\n\n${
												e?.message ?? 'Unknown error.'
											}`,
										),
									)
							}}
						>
							<TrashSvg class="h-4 w-4 text-red-500/95" />
							<span>Delete</span>
						</button>
					</div>
				{/if}
			</li>
		{:else}
			<li class="p-4 text-sm text-primary-900/75 lg:p-6">
				Start a new conversation and they will appear here.
			</li>
		{/each}
	</ul>
</div>
