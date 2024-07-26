<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import EditSvg from '$lib/icons/edit.svg.svelte'
	import MoreVerticalSvg from '$lib/icons/more-vertical.svelte'
	import TrashSvg from '$lib/icons/trash.svg.svelte'
	import { chatStore, type ChatStoreType } from '$lib/stores/chat-store'
	import { err } from '$lib/stores/toasts-store'
	import { dayjs } from '$lib/utils/dayjs'
	import { afterUpdate, onDestroy, onMount } from 'svelte'
	import { fade, fly, slide } from 'svelte/transition'

	onMount(() => {
		minuteInterval = setInterval(() => {
			minuteKey = Date.now()
		}, 1000) as unknown as number
	})

	afterUpdate(() => {
		if (shouldScrollToTop) {
			shouldScrollToTop = false
			topEle?.scrollIntoView({ behavior: 'smooth' })
		}
	})

	onDestroy(() => {
		if (minuteInterval !== null) {
			clearInterval(minuteInterval)
		}
	})

	$: topics =
		$chatStore?.topicsHistory?.sort((a, b) =>
			a.updatedAt.toISOString() > b.updatedAt.toISOString() ? -1 : 1,
		) ?? []

	let shouldScrollToTop = false

	let minuteInterval: number | null = null
	let minuteKey = Date.now()

	let optionsExpandedForTopicId: number | null = null

	let topEle: HTMLDivElement | null = null
	let isAtTheTop = true

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

				const topicHistoryIndex = $chatStore.topicsHistory.findIndex(
					(t) => t.id === topicHistory.id,
				)
				if (topicHistoryIndex === -1) {
					throw new Error(`Could not find topic history with ID ${topicHistory.id}.`)
				}

				$chatStore.topicsHistory[topicHistoryIndex].title = response.title
				$chatStore.topicsHistory[topicHistoryIndex].updatedAt = new Date(response.updatedAtStr)
				$chatStore = $chatStore

				shouldScrollToTop = true
			})
			.catch((e) =>
				err(
					`The title of the topic (ID: ${topicHistory.id}) could not be auto-generated.\n\n${
						e?.message ?? 'Unknown error.'
					}`,
				),
			)
	}
</script>

<div
	class="relative z-20 h-full min-h-screen w-0 flex-shrink-0 transform-gpu overflow-visible transition-all sm:w-[18rem]"
	transition:slide={{
		duration: !$chatStore?.browser.isDesktop ? 0 : 150,
		axis: 'x',
	}}
>
	<div
		class="absolute z-20 h-full w-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-white pt-[4.75rem] sm:static sm:w-[18rem] sm:bg-white/25 dark:bg-primary-950 dark:bg-gradient-to-t dark:from-black/5 dark:to-black/60 dark:text-white dark:sm:bg-primary-950/20"
		on:scroll={(e) => (isAtTheTop = e.currentTarget.scrollTop === 0)}
		transition:fly={{ duration: 150, x: -288 }}
	>
		<div class="mt-[-4.75rem]" bind:this={topEle} />

		<div
			class="sticky top-[-4.75rem] z-10 -mt-[4.75rem] h-[4.75rem] bg-gradient-to-b from-primary-100 dark:from-black"
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
					if ($chatStore.browser.isDesktop) {
						$chatStore.sideBar.prefersOpen = false
						await fetch('/account/set-prefers-side-bar-open', {
							method: 'PUT',
							body: JSON.stringify({ prefersSideBarOpen: false }),
						})
					}
				}}
				transition:fade={{ duration: 150 }}
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
			{#each topics ?? [] as topic (topic.id)}
				<li class="relative" title={topic.title ?? undefined} transition:slide={{ duration: 150 }}>
					<a
						class="button group items-start rounded-none shadow-none backdrop-blur-none lg:px-6 {$page
							.url.pathname === `/topic/${topic.id}`
							? 'button-primary'
							: 'bg-transparent'}"
						href="/topic/{topic.id}"
						on:click={() => {
							if (!$chatStore) {
								return
							}
							if (!$chatStore.browser.isDesktop) {
								$chatStore.sideBar.isOpen = false
							}
						}}
					>
						<div class="flex-1">
							<div
								class="line-clamp-2 text-sm saturate-[75%] {!topic.title ? 'italic' : ''} {$page.url
									.pathname === `/topic/${topic.id}`
									? 'font-semibold'
									: 'font-medium'}"
							>
								{topic.title ?? 'New topic'}
							</div>
							{#key minuteKey}
								<div
									class="text-xs font-normal opacity-60"
									title="Last message in this topic was sent on {dayjs(topic.updatedAt).format(
										'MMMM DD, YYYY hh:mm A',
									)}"
								>
									<span>{dayjs(topic.updatedAt).fromNow()}</span>,
									<span title="Messages in this topic plus the system prompt.">
										{topic.messagesCount}
										{topic.messagesCount === 1 ? 'message' : 'messages'}
									</span>
								</div>
							{/key}
						</div>
						<button
							class="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all hover:bg-primary-100/50 dark:hover:bg-primary-900/50 {optionsExpandedForTopicId ===
							topic.id
								? 'animate-pulse !bg-primary-200 dark:!bg-primary-950/50'
								: ''}"
							on:click|preventDefault|stopPropagation={() => (optionsExpandedForTopicId = topic.id)}
						>
							<MoreVerticalSvg class="h-4 w-4" />
						</button>
					</a>
					{#if optionsExpandedForTopicId === topic.id}
						<div
							class="drop-down right-2 top-11 lg:right-4"
							transition:fly={{ duration: 150, y: -16 }}
							use:clickOutside={() => (optionsExpandedForTopicId = null)}
						>
							{#if topic.messagesCount >= 2}
								<button
									class="drop-down-item"
									type="button"
									on:click={async () => {
										if (
											topic.title &&
											!confirm(
												'This topic already has a title. Are you sure you want to auto-regenerate it?',
											)
										) {
											return
										}
										optionsExpandedForTopicId = null
										await handleGenerateTitle(topic)
									}}
								>
									<EditSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
									<span>{topic.title ? 'Regenerate' : 'Generate'} title with AI</span>
								</button>
							{/if}

							<button
								class="drop-down-item"
								type="button"
								on:click={async () => {
									const newTitle = prompt('New topic title:')
									if (!newTitle) {
										err('Cancelled because no title was provided.')
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
													`${r.statusText} (${r.status}): ${
														(await r.json())?.message ?? 'Unknown'
													}`,
												)
											}
											topic.title = newTitle
											return r
										})
										.then(async (r) => {
											const response = await r.json()
											topic.updatedAt = new Date(response.updatedAtStr)
										})
										.catch((e) =>
											err(
												`The title of the topic (ID: ${topic.id}) could not be changed.\n\n${
													e?.message ?? 'Unknown error.'
												}`,
											),
										)
								}}
							>
								<EditSvg class="h-5 w-5 text-primary-600/90 dark:text-primary-400/90" />
								<span>{topic.title ? 'Change' : 'Set'} title</span>
							</button>

							<button
								class="drop-down-item drop-down-item-danger"
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
											$chatStore.topicsHistory = [
												...$chatStore.topicsHistory.filter((t) => t.id !== topic.id),
											]
											$chatStore = $chatStore
											if ($chatStore.activeTopic.id === topic.id) {
												await goto('/topic/latest')
											} else {
												await invalidateAll()
											}
										})
										.catch((e) =>
											err(
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
					Conversations will show up here as they happen.
				</li>
			{/each}
		</ul>
	</div>
</div>
