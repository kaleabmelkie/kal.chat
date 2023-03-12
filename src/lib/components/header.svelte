<script lang="ts">
	import { page } from '$app/stores'
	import { signIn, signOut } from '@auth/sveltekit/client'
</script>

<header
	class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex items-center justify-center gap-3 p-2"
>
	<h1 class="px-4 text-2xl font-black italic text-sky-700/75">kal.chat</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		{#if $page.data.session.user?.image}
			<img
				class="pointer-events-auto h-[2.5rem] w-[2.5rem] rounded-full object-cover"
				alt=""
				src={$page.data.session.user?.image}
			/>
		{/if}

		<div class="pointer-events-auto my-auto hidden pr-4 sm:grid">
			<div class="text-xs uppercase text-sky-900/75">Logged in as</div>
			<div class="text-sm font-semibold text-sky-900">
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
