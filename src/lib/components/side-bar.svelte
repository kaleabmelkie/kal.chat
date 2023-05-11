<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import EditSvg from '$lib/icons/edit.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { chatStore, type ChatStoreType } from '$lib/stores/chat-store'
	import { smallScreenThresholdInPx } from '$lib/utils/constants'
	import { dayjs } from '$lib/utils/dayjs'
	import { onDestroy, onMount, tick } from 'svelte'
	import { fade, fly, slide } from 'svelte/transition'

	onMount(() => {
		minuteInterval = setInterval(() => {
			minuteKey = Date.now()
		}, 1000) as unknown as number
	})

	onDestroy(() => {
		if (minuteInterval !== null) {
			clearInterval(minuteInterval)
		}
	})

	let minuteInterval: number | null = null
	let minuteKey = Date.now()

	let optionsExpandedForTopicId: number | null = null

	let topEle: HTMLDivElement | null = null
	let isAtTheTop = true

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

	async function handleGenerateTitle(topicHistory: ChatStoreType['topicsHistory'][number]) {
		await fetch(`/topic/${topicHistory.id}/generate-title?force=true`, {
			method: 'PUT',
		})
			.then(async (r) => {
				if (!$chatStore) {
					return
				}
				if (!r.ok) {
					throw new Error(
						`${r.statusText} (${r.status}): ${(await r.json())?.message ?? 'Unknown'}`,
					)
				}
				const response = await r.json()
				if (typeof response?.title !== 'string') {
					throw new Error(`Expected a title but did not get one.`)
				}
				topicHistory.updatedAt = response.updatedAt
				const topicHistoryIndex = $chatStore.topicsHistory.findIndex(
					(t) => t.id === topicHistory.id,
				)
				if (topicHistoryIndex !== -1) {
					$chatStore.topicsHistory[topicHistoryIndex].title = response.title
					$chatStore.topicsHistory[topicHistoryIndex].updatedAt = response.updatedAt
				}
				scrollToTop()
			})
			.catch((e) => {
				console.error(e)
				alert(
					`The title of the topic (ID: ${topicHistory.id}) could not be auto-generated.\n\n${
						e?.message ?? 'Unknown error.'
					}`,
				)
			})
	}
</script>

<div
	class="relative z-20 h-full min-h-screen w-0 flex-shrink-0 overflow-visible transition-all sm:w-[18rem]"
	transition:slide|local={{
		duration: $chatStore && $chatStore.window.innerWidth < smallScreenThresholdInPx ? 0 : 150,
		axis: 'x',
	}}
>
	<div
		class="overflow-y-overlay absolute z-20 h-full w-screen overflow-x-hidden scroll-smooth bg-white pt-[4.75rem] dark:bg-primary-950 dark:bg-gradient-to-t dark:from-black/5 dark:to-black/60 dark:text-white sm:static sm:w-[18rem] sm:bg-white/25 dark:sm:bg-primary-950/20"
		on:scroll={(e) => (isAtTheTop = e.currentTarget.scrollTop === 0)}
		transition:fly|local={{ duration: 150, x: -32 }}
	>
		<div
			class="sticky top-[-4.75rem] z-10 -mt-[4.75rem] h-[4.75rem] bg-gradient-to-b from-primary-100 dark:from-black"
			bind:this={topEle}
		/>

		<div class="pointer-events-none sticky top-0 z-10 flex items-center p-4 lg:px-6">
			<h2
				class="text-primary-600/75 transition-all duration-300 dark:text-primary-300/75 {isAtTheTop
					? 'opacity-100'
					: 'opacity-0'}"
			>
				Topics
			</h2>
			<span class="flex-1" />
			<button
				class="button group pointer-events-auto absolute -right-2 h-14 w-[5rem] gap-0 rounded-l-full p-4 hover:w-[8rem] focus:w-[8rem] active:w-[8rem]"
				type="button"
				on:click={async () => {
					if (!$chatStore) {
						return
					}
					$chatStore.sideBar.isOpen = false
					if ($chatStore.window.innerWidth >= smallScreenThresholdInPx) {
						$chatStore.sideBar.prefersOpen = false
						await fetch('/account/set-prefers-side-bar-open', {
							method: 'PUT',
							body: JSON.stringify({ prefersSideBarOpen: false }),
						})
					}
				}}
				transition:fade|local={{ duration: 150 }}
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
			{#each $chatStore?.topicsHistory ?? [] as topicHistory (topicHistory.id)}
				<li
					class="relative"
					title={topicHistory.title ?? undefined}
					transition:slide|local={{ duration: 150 }}
				>
					<a
						class="button group items-start rounded-none !shadow-none backdrop-blur-none lg:px-6 {$page
							.url.pathname === `/topic/${topicHistory.id}`
							? 'button-primary'
							: 'bg-transparent'}"
						href="/topic/{topicHistory.id}"
						on:click={() => {
							if (!$chatStore) {
								return
							}
							if ($chatStore.window.innerWidth < smallScreenThresholdInPx) {
								$chatStore.sideBar.isOpen = false
							}
						}}
					>
						<div class="flex-1">
							<div
								class="line-clamp-2 text-sm saturate-[75%] {!topicHistory.title
									? 'italic'
									: ''} {$page.url.pathname === `/topic/${topicHistory.id}`
									? 'font-semibold'
									: 'font-normal'}"
							>
								{topicHistory.title ?? 'New topic'}
							</div>
							{#key minuteKey}
								<div
									class="text-xs font-normal opacity-60"
									title="Last message in this topic was sent on {dayjs(
										topicHistory.updatedAt,
									).format('MMMM DD, YYYY hh:mm A')}"
								>
									<span>{dayjs(topicHistory.updatedAt).fromNow()}</span>,
									<span title="Messages in this topic plus the system prompt.">
										{topicHistory.messagesCount}
										{topicHistory.messagesCount === 1 ? 'message' : 'messages'}
									</span>
								</div>
							{/key}
						</div>
						<button
							class="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-primary-100/50 dark:hover:bg-primary-900/50 {optionsExpandedForTopicId ===
							topicHistory.id
								? '-mt-2 animate-pulse !bg-primary-200 dark:!bg-primary-950/50'
								: ''}"
							on:click|preventDefault|stopPropagation={() =>
								(optionsExpandedForTopicId = topicHistory.id)}
						>
							<MoreVerticalSvg class="h-4 w-4" />
						</button>
					</a>
					{#if optionsExpandedForTopicId === topicHistory.id}
						<div
							class="absolute right-4 top-9 z-50 flex transform-gpu flex-col rounded-2xl bg-white/95 p-2 shadow-lg shadow-primary-600/10 backdrop-blur dark:bg-primary-950/95 dark:shadow-black/30"
							transition:fly|local={{ duration: 150, y: -16 }}
							use:clickOutside={() => (optionsExpandedForTopicId = null)}
						>
							{#if topicHistory.messagesCount > 2}
								<button
									class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:text-white/75 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
									type="button"
									on:click={() => {
										if (
											topicHistory.title &&
											!confirm(
												'This topic already has a title. Are you sure you want to auto-regenerate it?',
											)
										) {
											return
										}
										optionsExpandedForTopicId = null
										handleGenerateTitle(topicHistory)
									}}
								>
									<EditSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
									<span>{topicHistory.title ? 'Regenerate' : 'Generate'} title with AI</span>
								</button>
							{/if}

							<button
								class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-black/75 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:text-white/75 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
								type="button"
								on:click={async () => {
									const newTitle = prompt('New topic title:')
									if (!newTitle) {
										alert('Cancelled because no title was provided.')
										return
									}
									optionsExpandedForTopicId = null
									await fetch(`/topic/${topicHistory.id}/change-title`, {
										method: 'PUT',
										body: JSON.stringify({
											title: newTitle,
										}),
									})
										.then(async (r) => {
											if (!r.ok) {
												throw new Error(
													`${r.statusText} (${r.status}): ${
														(await r.json())?.message ?? 'Unknown'
													}`,
												)
											}
											topicHistory.title = newTitle
										})
										.catch((e) =>
											alert(
												`The title of the topic (ID: ${topicHistory.id}) could not be changed.\n\n${
													e?.message ?? 'Unknown error.'
												}`,
											),
										)
								}}
							>
								<EditSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
								<span>{topicHistory.title ? 'Change' : 'Set'} title</span>
							</button>

							<button
								class="flex items-center gap-3 rounded-xl py-3 pl-3 pr-6 text-sm font-medium text-red-500/95 transition-all hover:bg-primary-100/50 focus:bg-primary-100/50 active:bg-primary-100 dark:hover:bg-primary-900/50 dark:focus:bg-primary-900/50 dark:active:bg-primary-900"
								type="button"
								on:click={async () => {
									if (!confirm('Are you sure you want to delete this topic?')) {
										return
									}
									optionsExpandedForTopicId = null
									await fetch(`/topic/${topicHistory.id}/delete`, {
										method: 'DELETE',
									})
										.then(async (r) => {
											if (!$chatStore) {
												return
											}
											if (!r.ok) {
												throw new Error(
													`${r.statusText} (${r.status}): ${
														(await r.json())?.message ?? 'Unknown'
													}`,
												)
											}
											$chatStore.topicsHistory = $chatStore.topicsHistory.filter(
												(t) => t.id !== topicHistory.id,
											)
											if ($chatStore.activeTopic.id === topicHistory.id) {
												await goto('/topic/latest')
											}
										})
										.catch((e) =>
											alert(
												`Topic (ID: ${topicHistory.id}) could not be deleted.\n\n${
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
					Conversations will show up here as they happen.
				</li>
			{/each}
		</ul>
	</div>
</div>
