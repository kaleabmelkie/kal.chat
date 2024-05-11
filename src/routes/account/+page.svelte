<script lang="ts">
	import ChevronRightSvg from '$lib/icons/chevron-right.svg.svelte'
	import { err, toast } from '$lib/stores/toasts-store.js'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import { slide } from 'svelte/transition'

	export let data

	let isActive = false
	let isAdvancedSettingsOpen = false
</script>

<svelte:head>
	<title>My Account | kal.chat — Fast AI Assistant</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-sm gap-4">
		{#if data.session?.user}
			<h2 class="text-2xl">Your Account</h2>

			<div class="grid gap-2">
				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Name
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.session.user.name ?? 'Unknown name'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Email
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.session.user.email ?? 'Unknown email'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Plan
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{@html data.session.user.plan === 'free'
						? '<strong>Free</strong> user (Llama 3 8B only) &nbsp;👀'
						: data.session.user.plan === 'paid'
							? '<strong>Pro</strong> user (Llama 3 8B & 70B) &nbsp;🎉'
							: data.session.user.plan === 'grace'
								? '<strong>Grace</strong> period (Llama 3 8B & 70B)<br/>Downgrading to free user soon &nbsp;🫤'
								: data.session.user.plan === 'sponsored'
									? '<strong>Sponsored</strong> user (Llama 3 8B & 70B)<br/>Paid for by Kaleab &nbsp;🎁'
									: data.session.user.plan}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75 dark:text-primary-100/75">
					Stats
				</span>
				<span class="text-lg font-semibold text-primary-700/90 dark:text-primary-300/90">
					{data.messagesCount ?? 0} active
					{data.messagesCount === 1 ? 'message' : 'messages'} in {data.topicsCount ?? 0}
					{data.topicsCount === 1 ? 'topic' : 'topics'}
				</span>
			</div>

			<div />

			<a
				class="button button-primary pointer-events-auto"
				href="/topic/latest"
				data-sveltekit-preload-data="tap"
			>
				Go chat
			</a>
			<button
				class="button pointer-events-auto {isActive ? 'button-loading' : ''}"
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
						await err(`Sign out error: ${e?.message}`)
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
				<div class="grid gap-4" transition:slide={{ duration: 150 }}>
					<!--
					// TODO: Replace with Own GroqCloud API Key
					<button
						class="button pointer-events-auto {isActive ? 'button-loading' : ''}"
						type="button"
						disabled={isActive}
						on:click={async () => {
							if (!data?.session) {
								err('No session found. Own OpenAI API key update cancelled.')
								return
							}
							const ownOpenaiApiKey = prompt('Please enter your OpenAI API key:')
							if (!ownOpenaiApiKey) {
								err('No API key entered. Own OpenAI API key update cancelled.')
								return
							}
							isActive = true
							try {
								const response = await fetch('/account/set-own-openai-api-key', {
									method: 'PUT',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({
										ownOpenaiApiKey,
									}),
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

								data.session.user.ownOpenaiApiKey = ownOpenaiApiKey

								await toast('Now, using your own OpenAI API key.')
							} catch (e) {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								await err(`Set own OpenAI API key error: ${e?.message}`)
							} finally {
								isActive = false
							}
						}}
					>
						{!data.session.user.ownOpenaiApiKey
							? 'Use your own OpenAI API key'
							: 'Update your own OpenAI API key'}
					</button>
					-->

					{#if data.session.user.ownOpenaiApiKey}
						<button
							class="button button-danger pointer-events-auto {isActive ? 'button-loading' : ''}"
							type="button"
							disabled={isActive}
							on:click={async () => {
								if (!data?.session) {
									err('No session found. Own OpenAI API key deletion cancelled.')
									return
								}
								if (
									!confirm(
										`Are you sure you want to delete your own OpenAI API key?\n\nYou won't be able to access GPT-4 if you're on the free plan without your own OpenAI API key.`,
									)
								) {
									return
								}
								isActive = true
								try {
									const response = await fetch('/account/set-own-openai-api-key', {
										method: 'PUT',
										headers: {
											'Content-Type': 'application/json',
										},
										body: JSON.stringify({
											ownOpenaiApiKey: null,
										}),
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

									data.session.user.ownOpenaiApiKey = null

									await toast(
										`Deleted your own OpenAI API key. Now, using kal.chat's built-in key.`,
									)
								} catch (e) {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									await err(`Delete own OpenAI API key error: ${e?.message}`)
								} finally {
									isActive = false
								}
							}}
							transition:slide={{ duration: 150 }}
						>
							Delete your own OpenAI API key
						</button>
					{/if}

					<div />

					<button
						class="button button-danger pointer-events-auto {isActive ? 'button-loading' : ''}"
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
								err('Wrong confirmation input. Account deletion cancelled.')
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

								await toast('Account deleted successfully.')
							} catch (e) {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								err(`Account deletion error: ${e?.message}`)
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
								await err(`Sign out error: ${e?.message}`)
							} finally {
								isActive = false
							}
						}}
					>
						Delete account
					</button>
				</div>
			{/if}
		{:else}
			<h2 class="text-2xl">Continue with</h2>
			<div />
			{#each data.providers as provider (provider.id)}
				<button
					class="pointer-events-auto flex w-full transform-gpu items-center justify-center gap-4 rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg font-semibold text-primary-600 backdrop-blur transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 dark:bg-primary-950/90 dark:text-primary-400 dark:hover:bg-primary-950/95 dark:focus:bg-primary-950/95 dark:active:bg-primary-950/75 dark:disabled:bg-primary-950/50"
					style={provider.style?.bg && provider.style.text
						? `background-color: ${provider.style.bg}; color: ${provider.style.text};`
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
							err(`Sign in error: ${e?.message}`)
							isActive = false
						}
					}}
				>
					{#if provider.style?.logo}
						<img
							class="block h-6 w-6 {provider.style.bg !== '#fff' ? 'invert' : ''}"
							src="/assets/social-login-provider-icons{provider.style.logo}"
							alt={provider.name}
						/>
					{/if}
					<div class="flex-1 text-center {provider.style?.logo ? 'pr-10' : ''}">
						{provider.name}
					</div>
				</button>
			{/each}
			<div />
			<div />
			<p class="text-sm opacity-75 transition-all hover:opacity-100">
				Need help? Contact <a
					class="font-semibold text-primary-700 hover:underline dark:text-primary-400"
					href="mailto:support@kal.chat"
					target="_blank">support@kal.chat</a
				>
			</p>
		{/if}
	</div>
</div>
