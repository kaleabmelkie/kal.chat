<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import EditSvg from '$lib/icons/edit.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { dayjs } from '$lib/utils/dayjs'
	import { smallScreenThresholdInPx } from '$lib/utils/small-screen-threshold-in-px'
	import { onDestroy, onMount } from 'svelte'
	import { fly, slide } from 'svelte/transition'
	import type { PageData } from '../../routes/thread/[id]/$types'

	export let data: PageData
	export let innerWidth: number
	export let isOpen: boolean

	onMount(async () => {
		if (browser) {
			minuteInterval = setInterval(() => {
				minuteKey = Date.now()
			}, 1000)

			scrollableEle?.addEventListener('scroll', updateIsAtTheTop)
		}
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
	let optionsExpandedForThreadId: number | null = null
	let minuteInterval: NodeJS.Timer
	let minuteKey = Date.now()

	async function updateIsAtTheTop() {
		if (!scrollableEle) {
			return
		}
		isAtTheTop = scrollableEle.scrollTop === 0
	}
</script>

<div
	class="absolute z-20 h-screen w-full flex-shrink-0 overflow-auto overflow-x-hidden scroll-smooth bg-white pt-[4.75rem] sm:static sm:w-[16rem] sm:bg-white/25"
	transition:fly={{ duration: 150, x: -32 }}
	bind:this={scrollableEle}
>
	<div class="pointer-events-none sticky top-0 flex items-center p-4 lg:px-6">
		<h2 class="text-blue-600/50 transition-all {isAtTheTop ? 'opacity-100' : 'opacity-0'}">
			Threads
		</h2>
		<span class="flex-1" />
		<button
			class="group pointer-events-auto absolute -right-2 flex h-14 w-20 transform-gpu items-center gap-2 rounded-l-full bg-white/50 p-4 text-blue-900 transition-all hover:w-36 hover:bg-white/95 hover:text-blue-600 focus:w-36 focus:bg-white/95 focus:text-blue-600 active:bg-blue-500/5 sm:backdrop-blur-sm lg:right-4 lg:-m-6 lg:p-6 lg:backdrop-blur"
			type="button"
			on:click={() => (isOpen = false)}
		>
			<ArrowRightSvg class="!h-5 !w-5 rotate-180 transition-all" />
			<span
				class="hidden flex-1 pr-4 text-center transition-all group-hover:block group-focus:block"
			>
				Hide
			</span>
		</button>
	</div>

	<ul>
		{#each data.threads as thread (thread.id)}
			<li class="relative" title={thread.title ?? undefined}>
				<a
					class="group flex py-3 px-4 transition-all hover:bg-white/95 focus:bg-white/95 active:bg-blue-500/5 lg:px-6 {$page
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
							class="text-sm line-clamp-2 group-hover:text-blue-600 group-focus:text-blue-600 {$page
								.url.pathname === `/thread/${thread.id}`
								? 'font-semibold text-blue-600'
								: 'text-blue-900/90'}"
						>
							{thread.title ?? 'Untitled thread'}
						</div>
						{#key minuteKey}
							<div
								class="text-xs text-blue-900/50"
								title="Last message in this thread was sent on {dayjs(thread.updatedAt).format(
									'MMMM DD, YYYY hh:mm A',
								)}"
							>
								{dayjs(thread.updatedAt).fromNow()}
							</div>
						{/key}
					</div>
					<button
						class="-mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-blue-100/50 {optionsExpandedForThreadId ===
						thread.id
							? 'bg-blue-100/50'
							: ''}"
						on:click|preventDefault|stopPropagation={() => (optionsExpandedForThreadId = thread.id)}
					>
						<MoreVerticalSvg class="h-4 w-4 text-blue-900/50" />
					</button>
				</a>
				{#if optionsExpandedForThreadId === thread.id}
					<div
						class="shadow-blur-900/25 absolute top-12 right-4 z-30 flex flex-col gap-2 rounded bg-white/75 p-1 shadow-lg backdrop-blur-sm"
						transition:slide={{ duration: 150 }}
						use:clickOutside={() => (optionsExpandedForThreadId = null)}
					>
						<button
							class="flex items-center gap-2 rounded py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-blue-100/50 focus:bg-blue-100/50 active:bg-blue-100"
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
							<EditSvg class="h-4 w-4 text-blue-500/95" />
							<span>Change title</span>
						</button>

						<button
							class="flex items-center gap-2 rounded py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-blue-100/50 focus:bg-blue-100/50 active:bg-blue-100"
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
			<li class="p-4 text-sm text-blue-900/75 lg:p-6">
				Start a new conversation and they will appear here.
			</li>
		{/each}
	</ul>
</div>
