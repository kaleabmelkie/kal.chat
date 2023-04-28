<script lang="ts">
	import { page } from '$app/stores'
	import ChevronRightSvg from '$lib/icons/chevron-right.svg.svelte'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import { slide } from 'svelte/transition'

	export let data

	let isActive = false
	let isAdvancedSettingsOpen = false
</script>

<svelte:head>
	<title>My Account | kal.chat — Better Chat Interface for GPT</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-xs gap-4">
		{#if $page.data.session}
			<h2 class="text-2xl">Your Account</h2>

			<p class="grid gap-2">
				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Name
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.session?.user?.name ?? 'Unknown name'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Email
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.session?.user?.email ?? 'Unknown email'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Stats
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.messagesCount ?? 0}
					{data.messagesCount === 1 ? 'message' : 'messages'} in {data.topicsCount ?? 0}
					{data.topicsCount === 1 ? 'topic' : 'topics'}
				</span>
			</p>

			<div />

			<a
				class="button button-primary pointer-events-auto"
				href="/topic/latest"
				data-sveltekit-preload-data="tap"
			>
				Go chat
			</a>
			<button
				class="button pointer-events-auto"
				type="button"
				disabled={isActive}
				on:click={async () => {
					if (!confirm('Are you sure you want to log out?')) {
						return
					}
					isActive = true
					try {
						await signOut({
							callbackUrl: data.redirectTo,
						})
					} catch (e) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						alert(`Sign out error: ${e?.message}`)
					} finally {
						isActive = false
					}
				}}
			>
				Logout
			</button>

			<div />

			<button
				class="flex items-center gap-2 text-left text-primary-900/75 dark:text-primary-100/75"
				type="button"
				on:click={() => (isAdvancedSettingsOpen = !isAdvancedSettingsOpen)}
			>
				<ChevronRightSvg
					class="h-5 w-5 transition-all {isAdvancedSettingsOpen ? 'rotate-90' : ''}"
				/>
				<span>Advanced Settings</span>
			</button>

			{#if isAdvancedSettingsOpen}
				<div class="overflow-visible" transition:slide>
					<div class="grid min-h-max gap-4">
						<button
							class="button button-danger pointer-events-auto"
							type="button"
							disabled={isActive}
							on:click={async () => {
								if (
									!confirm(
										'This deletes all your messages and topics and anything related to your account.\n\nAre you sure you want to continue?\n\nThis action cannot be undone.',
									)
								) {
									return
								}
								if (
									prompt(
										'Please type "DELETE ACCOUNT" to confirm account deletion.',
									)?.toUpperCase() !== 'DELETE ACCOUNT'
								) {
									alert('Wrong confirmation input. Account deletion cancelled.')
									return
								}
								isActive = true
								try {
									const response = await fetch('/account/delete', {
										method: 'DELETE',
										headers: {
											'Content-Type': 'application/json',
										},
									})
									if (!response.ok) {
										let message = 'Unknown error.'
										try {
											message = (await response.json())?.message ?? message
											console.error(message)
										} catch {
											console.error(response)
										}
										throw new Error(message)
									}

									alert('Account deleted successfully.')
								} catch (e) {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									alert(`Account deletion error: ${e?.message}`)
									isActive = false
									return
								}
								try {
									await signOut({
										callbackUrl: data.redirectTo,
									})
								} catch (e) {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									alert(`Sign out error: ${e?.message}`)
								} finally {
									isActive = false
								}
							}}
						>
							Delete account
						</button>
					</div>
				</div>
			{/if}
		{:else}
			<h2 class="text-2xl">Continue with</h2>
			<div />
			{#each data.providers as provider (provider.id)}
				<button
					class="pointer-events-auto flex w-full transform-gpu items-center justify-center gap-4 rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg font-semibold text-primary-600 backdrop-blur transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 dark:bg-primary-950/90 dark:text-primary-400 dark:hover:bg-primary-950/95 dark:focus:bg-primary-950/95 dark:active:bg-primary-950/75 dark:disabled:bg-primary-950/50"
					style={provider.style?.bgDark && provider.style.textDark
						? `background-color: ${provider.style.bgDark}; color: ${provider.style.textDark};`
						: ''}
					type="button"
					disabled={isActive}
					on:click={async () => {
						isActive = true
						try {
							await signIn(provider.id, {
								callbackUrl: data.redirectTo,
							})
						} catch (e) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							alert(`Sign in error: ${e?.message}`)
							isActive = false
						}
					}}
				>
					{#if provider.style?.logo}
						<img
							class="block h-6 w-6 {provider.style.bgDark !== '#fff' ? 'invert' : ''}"
							src="/assets/social-login-provider-icons{provider.style.logo}"
							alt={provider.name}
						/>
					{/if}
					<div class="flex-1 pr-10 text-center">{provider.name}</div>
				</button>
			{/each}
		{/if}
	</div>
</div>
