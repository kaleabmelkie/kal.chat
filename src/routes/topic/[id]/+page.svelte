<script lang="ts">
	import MessageBox from '$lib/components/message-box.svelte'
	import MessageList from '$lib/components/message-list.svelte'
	import SideBar from '$lib/components/side-bar.svelte'
	import ArrowRight from '$lib/icons/arrow-right.svg.svelte'
	import ClockSvg from '$lib/icons/clock.svg.svelte'
	import { chatStore } from '$lib/stores/chat-store'
	import { smallScreenThresholdInPx } from '$lib/utils/constants'
	import { countTokens } from '$lib/utils/count-tokens'
	import { onDestroy, onMount, tick } from 'svelte'
	import { fly } from 'svelte/transition'

	export let data

	$: $chatStore = {
		...data,
		sideBar: {
			...data.sideBar,
			isOpen: $chatStore?.sideBar.isOpen ?? data.sideBar.isOpen,
		},
	}

	onMount(async () => {
		await handleDataChange()
	})

	onDestroy(() => {
		$chatStore = null
	})

	async function handleDataChange() {
		await tick()

		if (!$chatStore) {
			return
		}

		scrollToBottom()

		if (
			!$chatStore.sideBar.isOpen &&
			$chatStore.sideBar.prefersOpen &&
			$chatStore.window.innerWidth >= smallScreenThresholdInPx
		) {
			$chatStore.sideBar.isOpen = true
		}
	}

	$: {
		;[data] // deps
		handleDataChange()
	}

	let innerWidth: number
	let innerHeight: number

	function updateInnerWidthAndHeight() {
		if (!$chatStore) {
			return
		}
		$chatStore.window.innerWidth = innerWidth
		$chatStore.window.innerHeight = innerHeight
	}
	$: {
		;[innerWidth, innerHeight, data] // deps
		updateInnerWidthAndHeight()
	}

	let bottomEle: HTMLSpanElement | null = null

	async function triggerTokenCount() {
		await tick()
		if (!$chatStore) {
			return
		}
		const count = await countTokens(
			[
				...($chatStore.activeTopic.messages ?? [])
					.slice(-1 * $chatStore.activeTopic.messagesCountInContext)
					.map((m) => m.content),
				...$chatStore.activeTopic.newMessage.queue,
				$chatStore.activeTopic.newMessage.content,
			].join(' '),
		)
		await tick()
		if (!$chatStore) {
			return
		}
		$chatStore.activeTopic.tokensCountInContext =
			$chatStore.activeTopic.systemPromptTokensCount + count
	}
	$: activeTopicMessagesCount = $chatStore?.activeTopic.messages?.length ?? 0
	$: newMessageContent = $chatStore?.activeTopic.newMessage.content
	$: {
		;[activeTopicMessagesCount, newMessageContent] // deps
		triggerTokenCount()
	}

	async function scrollToBottom(repeat = true) {
		if (!bottomEle) {
			return
		}
		bottomEle.scrollIntoView({ behavior: 'smooth' })
		await tick()
		if (repeat) {
			setTimeout(() => scrollToBottom(false), 150)
		}
	}

	$: topicTitle =
		$chatStore?.topicsHistory.find((t) => t.id === $chatStore?.activeTopic.id)?.title ?? null
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<svelte:head>
	<title>
		{topicTitle
			? `${topicTitle} | kal.chat`
			: 'New topic | kal.chat — Better Chat Interface for GPT'}
	</title>
</svelte:head>

<div class="flex h-screen">
	{#if !$chatStore ? data.sideBar.isOpen : $chatStore.sideBar.isOpen}
		<SideBar />
	{:else}
		<button
			class="button button-primary group fixed left-0 top-[4.75rem] z-30 h-14 w-[3.75rem] gap-0 rounded-r-full p-4 hover:w-[7.5rem] focus:w-[7.5rem] focus:shadow active:w-[7.5rem] lg:w-[4.5rem] lg:pl-6"
			type="button"
			on:click={async () => {
				if (!$chatStore) {
					return
				}
				$chatStore.sideBar.isOpen = true
				if ($chatStore.window.innerWidth >= smallScreenThresholdInPx) {
					$chatStore.sideBar.prefersOpen = true
					await fetch('/account/set-prefers-side-bar-open', {
						method: 'PUT',
						body: JSON.stringify({ prefersSideBarOpen: true }),
					})
				}
			}}
			transition:fly={{ duration: 150, x: -32 }}
		>
			<ClockSvg
				class="block h-5 w-5 transition-all group-hover:w-0 group-hover:opacity-0 group-focus:w-0 group-focus:opacity-0"
			/>
			<span
				class="block w-0 flex-1 overflow-hidden pr-1 text-center font-semibold opacity-0 transition-all group-hover:w-auto group-hover:opacity-100 group-focus:w-auto group-focus:opacity-100"
			>
				Topics
			</span>
			<ArrowRight
				class="h-5 w-0 opacity-0 transition-all group-hover:w-5 group-hover:opacity-100 group-focus:w-5 group-focus:opacity-100"
			/>
		</button>
	{/if}

	<div class="relative h-screen flex-1 overflow-auto">
		<MessageList />

		<MessageBox on:scrollToBottom={() => scrollToBottom()} />

		<div bind:this={bottomEle} />
	</div>
</div>
