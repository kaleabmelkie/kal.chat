<script lang="ts">
	import { page } from '$app/stores'
</script>

<header
	class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex items-center justify-center gap-3 bg-gradient-to-t from-sky-100/0 to-sky-100 p-4"
>
	<h1
		class="bg-sky-600 bg-gradient-to-tr from-sky-700 to-sky-500 bg-clip-text px-4 text-2xl font-black text-transparent"
	>
		<a class="pointer-events-auto" href="/">kal.chat</a>
	</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		<a
			class="pointer-events-auto my-auto flex flex-shrink-0 gap-3 rounded-[1.75rem] bg-white/75 py-1 pr-4 pl-1 text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none"
			href="/login"
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
	{:else}
		<a
			class="pointer-events-auto rounded-[1.75rem] bg-white/75 py-2 px-4 text-sm font-semibold uppercase text-sky-600 backdrop-blur transition-all duration-150 hover:bg-white/90 hover:shadow hover:shadow-sky-600/10 focus:bg-white/90 active:bg-white/50 active:shadow-none"
			href="/login?redirectTo={encodeURIComponent(
				$page.url.pathname === '/login' ? '/' : $page.url.pathname,
			)}"
		>
			Login
		</a>
	{/if}
</header>
