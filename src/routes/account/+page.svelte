<script lang="ts">
	import { page } from '$app/stores'
	import { signIn, signOut } from '@auth/sveltekit/client'

	export let data

	let isActive = false
</script>

<svelte:head>
	<title>My Account | kal.chat — Better Chat Interface for GPT</title>
</svelte:head>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-xs gap-4">
		{#if $page.data.session}
			<h2 class="text-2xl">You're logged in!</h2>
			<p class="grid gap-2">
				<span class="mt-4 text-xs uppercase text-primary-900/75"> Name </span>
				<span class="text-lg font-semibold text-primary-700/90">
					{data.session?.user?.name ?? 'Unknown name'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75"> Email </span>
				<span class="text-lg font-semibold text-primary-700/90">
					{data.session?.user?.email ?? 'Unknown email'}
				</span>

				<span class="mt-4 text-xs uppercase text-primary-900/75"> Usage </span>
				<span class="text-lg font-semibold text-primary-700/90">
					{data.messagesCount ?? 0} messages in {data.threadsCount ?? 0} threads
				</span>
			</p>
			<div />
			<a
				class="pointer-events-auto flex w-full transform-gpu items-center justify-center rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg text-primary-600 transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 sm:backdrop-blur-sm lg:backdrop-blur"
				href="/thread/latest"
			>
				Go chat
			</a>
			<button
				class="pointer-events-auto flex w-full transform-gpu items-center justify-center rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg text-red-500 transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 sm:backdrop-blur-sm lg:backdrop-blur"
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
		{:else}
			<h2 class="text-2xl">Continue with</h2>
			<div />
			{#each data.providers as provider (provider.id)}
				<button
					class="pointer-events-auto flex w-full transform-gpu items-center justify-center gap-4 rounded-[1.75rem] bg-white/90 px-4 py-3 text-lg font-semibold text-primary-600 transition-all hover:bg-white/95 hover:shadow hover:shadow-primary-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none disabled:animate-pulse disabled:bg-white/50 sm:backdrop-blur-sm lg:backdrop-blur"
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
