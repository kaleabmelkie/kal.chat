<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<!-- TODO: have a unique title per page -->
	<title>kal.chat</title>
</svelte:head>

<header
	class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex justify-center gap-3 bg-gradient-to-t from-sky-100/0 to-sky-100 p-4"
>
	<h1
		class="relative grid h-11 bg-sky-600 bg-gradient-to-tr from-sky-700 to-sky-500 bg-clip-text px-2 text-2xl font-black text-transparent"
	>
		<a class="pointer-events-auto" href="/">kal.chat</a>
		<a
			class="pointer-events-auto absolute -bottom-2 right-2 text-[0.7rem] font-normal text-emerald-600"
			href="/"
		>
			Early Access
		</a>
	</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		<a
			class="pointer-events-auto flex flex-shrink-0 items-center justify-center gap-2 rounded-[1.75rem] bg-white/90 py-2 px-4 text-sm font-semibold uppercase text-sky-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-sky-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none"
			href="https://kal-chat.lemonsqueezy.com/checkout/buy/53c40b0d-973a-4437-8868-a489dbf8eb8f"
		>
			<div>🎁</div>
			<div class="pr-2">Subscribe</div>
			<!--
				// TODO: change to above to the below after fully integrating with Lemon Squeezy 
				<div>✨</div>
				<div class="pr-2">Upgrade</div>
			-->
		</a>
		<a
			class="pointer-events-auto my-auto flex flex-shrink-0 items-center justify-center gap-2 rounded-[1.75rem] bg-white/90 py-1 px-1 text-sky-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-sky-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none sm:pr-4"
			href="/account"
			title={$page.data.session.user?.email}
		>
			{#if $page.data.session.user?.image}
				<img
					class="h-[2.25rem] w-[2.25rem] rounded-full bg-white/90 object-cover shadow shadow-sky-900/10"
					alt=""
					src={$page.data.session.user?.image ??
						`https://ui-avatars.com/api/?name=${
							$page.data.session.user?.name ?? 'User'
						}&background=random&format=svg`}
				/>
			{/if}

			<div class="pointer-events-auto my-auto hidden sm:grid">
				<div class="text-xs uppercase text-sky-900/75">Logged in as</div>
				<div class="text-sm font-bold text-sky-900">
					{$page.data.session.user?.name ?? 'User'}
				</div>
			</div>
		</a>
	{:else if $page.url.pathname !== '/account'}
		<a
			class="pointer-events-auto flex flex-shrink-0 items-center justify-center gap-2 rounded-[1.75rem] bg-white/90 py-2 px-4 text-sm font-semibold uppercase text-sky-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-sky-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none"
			href="/account?redirectTo={encodeURIComponent($page.url.pathname)}"
		>
			<div>Login</div>
		</a>
	{/if}
</header>
