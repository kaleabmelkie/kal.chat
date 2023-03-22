<script lang="ts">
	import { browser } from '$app/environment'
	import { page } from '$app/stores'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import { dayjs } from '$lib/utils/dayjs'
	import { smallScreenThresholdInPx } from '$lib/utils/small-screen-threshold-in-px'
	import { onDestroy, onMount } from 'svelte'
	import { fly } from 'svelte/transition'
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
		{#each data.topics as topic (topic.id)}
			<li title={topic.title ?? undefined}>
				<a
					class="group block py-3 px-4 transition-all hover:bg-white/95 focus:bg-white/95 active:bg-blue-500/5 lg:px-6 {$page
						.url.pathname === `/thread/${topic.id}`
						? 'bg-white/50'
						: ''}"
					href="/thread/{topic.id}"
					on:click={() => {
						if (innerWidth < smallScreenThresholdInPx) {
							isOpen = false
						}
					}}
				>
					<div
						class="text-sm group-hover:text-blue-600 group-focus:text-blue-600 {$page.url
							.pathname === `/thread/${topic.id}`
							? 'font-semibold text-blue-600'
							: 'text-blue-900/90'}"
					>
						{topic.title ?? 'Untitled thread'}
					</div>
					{#key minuteKey}
						<div
							class="text-xs text-blue-900/50"
							title="Last message in this thread was sent on {dayjs(topic.updatedAt).format(
								'MMMM DD, YYYY hh:mm A',
							)}"
						>
							{dayjs(topic.updatedAt).fromNow()}
						</div>
					{/key}
				</a>
			</li>
		{:else}
			<li class="p-4 text-sm text-blue-900/75 lg:p-6">
				Start a new conversation and they will appear here.
			</li>
		{/each}
	</ul>
</div>
