<script lang="ts">
	import { page } from '$app/stores'

	let lemonSqueezyButtonColor = '#2563EB'
</script>

<header
	class="pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center gap-3 p-4 lg:px-6"
>
	<h1
		class="relative grid h-11 bg-gradient-to-tr from-primary-700/95 to-primary-500/95 bg-clip-text text-2xl font-black text-transparent dark:from-primary-600/95 dark:to-primary-400/95"
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
		{#if !['paid', 'sponsored'].includes(// @ts-ignore (because `.plan` is not using the `EnhancedSession` definition from `app.d.ts`)
			$page.data.session.user?.plan ?? '')}
			<a
				class="lemonsqueezy-button button button-primary pointer-events-auto py-2 text-sm"
				href="https://checkout.kal.chat/checkout/buy/77494bec-e48e-4193-b08d-fb5816326a1f?embed=1&dark=1&button_color={encodeURIComponent(
					lemonSqueezyButtonColor,
				)}&media=0&logo=0&desc=0{$page.data.session.user?.name
					? `&checkout[name]=${encodeURIComponent($page.data.session.user.name)}`
					: ''}{$page.data.session.user?.email
					? `&checkout[email]=${encodeURIComponent($page.data.session.user.email)}`
					: ''}"
				on:click={() =>
					alert(
						`Upgrading to the paid monthly subscription while the app is in the free Early Access period will not get you any special perks.\n\nYou'll be notified by email when launch officially.\n\nUpgrading now would be just a sign of support for the development of the project (which is really appreciated).`,
					)}
			>
				<span class="text-lg">✨</span>
				<span class="pr-2">Upgrade</span>
			</a>
		{/if}
		<a
			class="button pointer-events-auto px-1 py-1 sm:pr-4"
			href="/account"
			title={$page.data.session.user?.email}
		>
			{#if $page.data.session.user?.image}
				<img
					class="h-[2.25rem] w-[2.25rem] rounded-full bg-primary-100 object-cover shadow shadow-primary-900/10 dark:bg-primary-800"
					alt=""
					src={$page.data.session.user?.image ??
						`https://ui-avatars.com/api/?name=${
							$page.data.session.user?.name ?? 'User'
						}&background=random&format=svg`}
				/>
			{/if}

			<div class="pointer-events-auto my-auto hidden sm:grid">
				<div class="text-xs font-normal uppercase text-primary-900/75 dark:text-primary-100/75">
					Logged in as
				</div>
				<div
					class="line-clamp-1 max-w-[8rem] text-sm font-bold text-primary-900 dark:text-primary-100"
					title={$page.data.session.user?.name ?? undefined}
				>
					{$page.data.session.user?.name ?? 'User'}
				</div>
			</div>
		</a>
	{:else if $page.url.pathname !== '/account'}
		<a
			class="button button-primary pointer-events-auto py-2 text-sm"
			href="/account?redirectTo={encodeURIComponent($page.url.pathname)}"
		>
			Login
		</a>
	{/if}
</header>
