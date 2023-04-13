<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import EditSvg from '$lib/icons/edit.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { latestNewMessageSentAt } from '$lib/stores/latest-new-message-sent-at'
	import { smallScreenThresholdInPx } from '$lib/utils/constants'
	import { dayjs } from '$lib/utils/dayjs'
	import { onDestroy, onMount, tick } from 'svelte'
	import { fly, slide } from 'svelte/transition'
	import type { PageData } from '../../routes/topic/[id]/$types'

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
			generateTitleForUnnamedAndEligibleTopics(data.topics).catch(console.error)
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
	let optionsExpandedForTopicId: number | null = null
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

	async function handleGenerateTitle(topic: PageData['topics'][number], force: boolean) {
		await fetch(`/topic/${topic.id}/generate-title?force=${force}`, {
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
				topic.updatedAt = response.updatedAt
				const topicIndex = data.topics.findIndex((t) => t.id === topic.id)
				if (topicIndex !== -1) {
					data.topics[topicIndex].title = response.title
					data.topics[topicIndex].updatedAt = response.updatedAt
					data.topics.splice(topicIndex, 1)
					data.topics.unshift(topic)
				}
				scrollToTop()
			})
			.catch((e) => {
				if (force) {
					alert(
						`The title of the topic (ID: ${topic.id}) could not be auto-generated.\n\n${
							e?.message ?? 'Unknown error.'
						}`,
					)
				} else {
					console.error(e)
				}
			})
	}

	async function generateTitleForUnnamedAndEligibleTopics(topics: PageData['topics']) {
		for (const topic of topics) {
			if (!topic.title && topic.Message.length > 2) {
				console.log(`Generating title for unnamed topic (ID: ${topic.id})...`)
				await handleGenerateTitle(topic, false)
			}
		}
	}
	generateTitleForUnnamedAndEligibleTopics(data.topics).catch(console.error)
</script>

<div
	class="absolute z-20 h-screen w-full flex-shrink-0 overflow-auto overflow-x-hidden scroll-smooth bg-white pt-[4.75rem] sm:static sm:w-[18rem] sm:bg-white/25"
	transition:fly={{ duration: 150, x: -32 }}
	bind:this={scrollableEle}
>
	<div class="-mt-[4.75rem] mb-[4.75rem]" bind:this={topEle} />

	<div class="pointer-events-none sticky top-0 z-10 flex items-center p-4 lg:px-6">
		<h2 class="text-primary-600/50 transition-all {isAtTheTop ? 'opacity-100' : 'opacity-0'}">
			Topics
		</h2>
		<span class="flex-1" />
		<button
			class="group pointer-events-auto absolute -right-2 flex h-14 w-20 transform-gpu items-center justify-center rounded-l-full bg-white/50 p-4 text-primary-900 transition-all hover:w-32 hover:bg-white/95 hover:text-primary-600 focus:w-32 focus:bg-white/95 focus:text-primary-600 active:w-32 active:bg-primary-500/5 sm:backdrop-blur-sm lg:pr-6 lg:backdrop-blur"
			type="button"
			on:click={async () => {
				isOpen = false
				if (innerWidth >= smallScreenThresholdInPx) {
					await fetch('/account/set-prefers-side-bar-open', {
						method: 'PUT',
						body: JSON.stringify({ prefersSideBarOpen: false }),
					})
				}
			}}
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
		{#each data.topics as topic (topic.id)}
			<li
				class="relative"
				title={topic.title ?? undefined}
				transition:slide|local={{ duration: 150 }}
			>
				<a
					class="group flex gap-1 px-4 py-3 transition-all hover:bg-white/95 focus:bg-white/95 active:bg-primary-500/5 lg:px-6 {$page
						.url.pathname === `/topic/${topic.id}`
						? 'bg-white/50'
						: ''}"
					href="/topic/{topic.id}"
					on:click={() => {
						if (innerWidth < smallScreenThresholdInPx) {
							isOpen = false
						}
					}}
				>
					<div class="flex-1">
						<div
							class="line-clamp-2 text-sm group-hover:text-primary-600 group-focus:text-primary-600 {!topic.title
								? 'italic'
								: ''} {$page.url.pathname === `/topic/${topic.id}`
								? 'font-semibold text-primary-600'
								: 'text-primary-900/90'}"
						>
							{topic.title ?? 'New topic'}
						</div>
						{#key minuteKey}
							<div
								class="text-xs text-primary-900/50"
								title="Last message in this topic was sent on {dayjs(topic.updatedAt).format(
									'MMMM DD, YYYY hh:mm A',
								)}"
							>
								<span>{dayjs(topic.updatedAt).fromNow()}</span>,
								<span title="Messages in this topic plus the system prompt."
									>{topic.Message.length}
									{topic.Message.length === 1 ? 'message' : 'messages'}</span
								>
							</div>
						{/key}
					</div>
					<button
						class="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-primary-100/50 {optionsExpandedForTopicId ===
						topic.id
							? '-mt-2 animate-pulse !bg-primary-200'
							: ''}"
						on:click|preventDefault|stopPropagation={() => (optionsExpandedForTopicId = topic.id)}
					>
						<MoreVerticalSvg class="h-4 w-4 text-primary-900/50" />
					</button>
				</a>
				{#if optionsExpandedForTopicId === topic.id}
					<div
						class="absolute right-4 top-9 z-50 flex flex-col rounded-2xl bg-white/90 p-2 shadow-lg shadow-primary-600/10 backdrop-blur-sm"
						transition:slide={{ duration: 150 }}
						use:clickOutside={() => (optionsExpandedForTopicId = null)}
					>
						<button
							class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={() => {
								if (
									topic.title &&
									!confirm(
										'This topic already has a title. Are you sure you want to auto-regenerate it?',
									)
								) {
									return
								}
								optionsExpandedForTopicId = null
								handleGenerateTitle(topic, true)
							}}
						>
							<EditSvg class="h-5 w-5 text-primary-600/90" />
							<span>{topic.title ? 'Regenerate' : 'Generate'} title with AI</span>
						</button>

						<button
							class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								const newTitle = prompt('New topic title:')
								if (!newTitle) {
									alert('Cancelled because no title was provided.')
									return
								}
								optionsExpandedForTopicId = null
								await fetch(`/topic/${topic.id}/change-title`, {
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
										topic.title = newTitle
									})
									.catch((e) =>
										alert(
											`The title of the topic (ID: ${topic.id}) could not be changed.\n\n${
												e?.message ?? 'Unknown error.'
											}`,
										),
									)
							}}
						>
							<EditSvg class="h-5 w-5 text-primary-600/90" />
							<span>Change title</span>
						</button>

						<button
							class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-red-500/95 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100"
							type="button"
							on:click={async () => {
								if (!confirm('Are you sure you want to delete this topic?')) {
									return
								}
								optionsExpandedForTopicId = null
								await fetch(`/topic/${topic.id}/delete`, {
									method: 'DELETE',
								})
									.then(async (r) => {
										if (!r.ok) {
											throw new Error(
												`${r.statusText} (${r.status}): ${(await r.json())?.message ?? 'Unknown'}`,
											)
										}
										data.topics = data.topics.filter((t) => t.id !== topic.id)
										if (data.topic.id === topic.id) {
											await goto('/topic/latest')
										}
									})
									.catch((e) =>
										alert(
											`Topic (ID: ${topic.id}) could not be deleted.\n\n${
												e?.message ?? 'Unknown error.'
											}`,
										),
									)
							}}
						>
							<TrashSvg class="h-5 w-5 text-red-500/95" />
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
