<script lang="ts">
	import { page } from '$app/stores'
</script>

<header
	class="pointer-events-none fixed top-0 left-0 right-0 z-30 flex justify-center gap-3 bg-gradient-to-t from-blue-100/0 to-blue-100 p-4 lg:px-6"
>
	<h1
		class="relative grid h-11 bg-gradient-to-tr from-blue-700/95 to-blue-500/95 bg-clip-text text-2xl font-black text-transparent"
	>
		<a class="pointer-events-auto" href="/" title="Go home">kal.chat</a>
		<a
			class="pointer-events-auto absolute -bottom-2 right-0 text-[0.7rem] font-normal text-emerald-600"
			href="/"
			title="BEWARE: THERE WILL BE BUGS! 🤷‍♂️"
		>
			Early Access
		</a>
	</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		<a
			class="pointer-events-auto flex flex-shrink-0 transform-gpu items-center justify-center gap-2 rounded-[1.75rem] bg-white/50 py-2 px-4 text-sm font-semibold text-blue-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-blue-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none sm:backdrop-blur-sm lg:backdrop-blur"
			href="/account/subscribe"
			on:click={(e) => {
				if (
					!confirm(
						`Upgrading to the paid monthly subscription while the app is in the free Early Access period will not get you any special perks.\n\nYou'll be notified by email when launch officially.\n\nUpgrading now would be just a sign of support for the development of the project (which is really appreciated).\n\nDo you still want to continue?`,
					)
				) {
					e.preventDefault()
				}
			}}
		>
			<div class="text-lg">✨</div>
			<div class="pr-2">Upgrade</div>
		</a>
		<a
			class="pointer-events-auto my-auto flex flex-shrink-0 transform-gpu items-center justify-center gap-2 rounded-[1.75rem] bg-white/90 py-1 px-1 text-blue-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-blue-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none sm:pr-4 sm:backdrop-blur-sm lg:backdrop-blur"
			href="/account"
			title={$page.data.session.user?.email}
		>
			{#if $page.data.session.user?.image}
				<img
					class="h-[2.25rem] w-[2.25rem] rounded-full bg-blue-100 object-cover shadow shadow-blue-900/10"
					alt=""
					src={$page.data.session.user?.image ??
						`https://ui-avatars.com/api/?name=${
							$page.data.session.user?.name ?? 'User'
						}&background=random&format=svg`}
				/>
			{/if}

			<div class="pointer-events-auto my-auto hidden sm:grid">
				<div class="text-xs uppercase text-blue-900/75">Logged in as</div>
				<div
					class="max-w-[8rem] text-sm font-bold text-blue-900 line-clamp-1"
					title={$page.data.session.user?.name ?? undefined}
				>
					{$page.data.session.user?.name ?? 'User'}
				</div>
			</div>
		</a>
	{:else if $page.url.pathname !== '/account'}
		<a
			class="pointer-events-auto flex flex-shrink-0 transform-gpu items-center justify-center gap-2 rounded-[1.75rem] bg-white/90 py-2 px-4 text-sm font-semibold uppercase text-blue-600 transition-all duration-150 hover:bg-white/95 hover:shadow hover:shadow-blue-600/10 focus:bg-white/95 active:bg-white/75 active:shadow-none sm:backdrop-blur-sm lg:backdrop-blur"
			href="/account?redirectTo={encodeURIComponent($page.url.pathname)}"
		>
			<div>Login</div>
		</a>
	{/if}
</header>
