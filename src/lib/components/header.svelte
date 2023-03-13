<script lang="ts">
	import { page } from '$app/stores'
	import { signIn, signOut } from '@auth/sveltekit/client'
</script>

<header
	class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex items-center justify-center gap-3 bg-gradient-to-t from-sky-100/0 to-sky-100 p-4"
>
	<h1
		class="bg-gradient-to-tr from-sky-700/25 to-sky-500/25 bg-clip-text px-4 text-2xl font-black text-transparent"
	>
		kal.chat
	</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		{#if $page.data.session.user?.image}
			<img
				class="pointer-events-auto h-[2.25rem] w-[2.25rem] rounded-full bg-white/90 object-cover shadow shadow-sky-900/10"
				alt=""
				src={$page.data.session.user?.image ??
					`https://ui-avatars.com/api/?name=${
						$page.data.session.user?.name ?? 'User'
					}&background=random&format=svg`}
			/>
		{/if}

		<div class="pointer-events-auto my-auto hidden pr-4 sm:grid">
			<div class="text-xs uppercase text-sky-900/75">Logged in as</div>
			<div class="text-sm font-bold text-sky-900">
				{$page.data.session.user?.name ?? 'User'}
			</div>
		</div>

		<button
			class="pointer-events-auto rounded-[1.75rem] bg-white/75 py-2 px-4 text-sm font-semibold uppercase text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none"
			on:click={() => signOut()}>Logout</button
		>
	{:else}
		<button
			class="pointer-events-auto rounded-[1.75rem] bg-white/75 py-2 px-4 text-sm font-semibold uppercase text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none"
			type="button"
			on:click={() => signIn('github')}
		>
			Login with GitHub
		</button>
	{/if}
</header>
