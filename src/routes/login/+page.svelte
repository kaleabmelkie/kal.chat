<script lang="ts">
	import { page } from '$app/stores'
	import { signIn, signOut } from '@auth/sveltekit/client'

	export let data

	let isActive = false
</script>

<div class="mx-auto flex min-h-screen items-center justify-center px-4 py-32">
	<div class="grid w-full max-w-xs gap-4">
		{#if $page.data.session}
			<h2 class="text-2xl">You're logged in!</h2>
			<p class="grid gap-2">
				<span class="mt-4 text-xs uppercase text-sky-900/75"> Name </span>
				<span class="text-lg font-semibold text-sky-700/90">
					{data.session?.user?.name ?? 'Unknown name'}
				</span>

				<span class="mt-4 text-xs uppercase text-sky-900/75"> Email </span>
				<span class="text-lg font-semibold text-sky-700/90">
					{data.session?.user?.email ?? 'Unknown email'}
				</span>

				<span class="mt-4 text-xs uppercase text-sky-900/75"> Usage </span>
				<span class="text-lg font-semibold text-sky-700/90">
					{data.messagesCount ?? 0} messages in {data.threadsCount ?? 0} threads
				</span>
			</p>
			<div />
			<a
				class="pointer-events-auto flex w-full items-center justify-center rounded-[1.75rem] bg-white/75 py-3 px-4 text-lg text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none disabled:animate-pulse disabled:bg-white/25"
				href="/"
			>
				Go home
			</a>
			<button
				class="pointer-events-auto flex w-full items-center justify-center rounded-[1.75rem] bg-white/75 py-3 px-4 text-lg text-red-500 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none disabled:animate-pulse disabled:bg-white/25"
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
					class="pointer-events-auto flex w-full items-center justify-center rounded-[1.75rem] bg-white/75 py-3 px-4 text-lg text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none disabled:animate-pulse disabled:bg-white/25"
					type="button"
					disabled={isActive}
					on:click={async () => {
						isActive = true
						try {
							await signIn(provider.id, {
								callbackUrl: data.redirectTo,
							})
						} catch (e) {
							// @ts-ignore
							alert(`Sign in error: ${e?.message}`)
						} finally {
							isActive = false
						}
					}}
				>
					{provider.name}
				</button>
			{/each}
		{/if}
	</div>
</div>
