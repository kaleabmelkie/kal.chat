<script lang="ts">
	import { page } from '$app/stores'
	import Logo from '$lib/icons/logo.svg.svelte'

	let lemonSqueezyButtonColor = '#2563EB'
</script>

<header
	class="pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center gap-3 p-4 lg:px-6"
>
	<h1 class="relative grid h-11 items-center">
		<a class="pointer-events-auto flex items-center" href="/" title="Go home">
			<span class="sr-only">kal.chat</span>
			<Logo class="h-11 w-auto" />
		</a>
	</h1>

	<div class="flex-1" />

	{#if $page.data.session}
		{@const plan = $page.data.session.user.plan}
		{#if !['paid'].includes(plan)}
			<a
				class="lemonsqueezy-button button button-primary pointer-events-auto py-2 text-sm"
				href="https://checkout.kal.chat/checkout/buy/77494bec-e48e-4193-b08d-fb5816326a1f?embed=1&dark=1&button_color={encodeURIComponent(
					lemonSqueezyButtonColor,
				)}&media=0&logo=0&desc=0{$page.data.session.user?.name
					? `&checkout[name]=${encodeURIComponent($page.data.session.user.name)}`
					: ''}{$page.data.session.user?.email
					? `&checkout[email]=${encodeURIComponent($page.data.session.user.email)}`
					: ''}"
				title="Upgrading to Pro gives you the options to get better responses  🎉"
			>
				<span class="text-lg">✨</span>
				<span class="pr-2">Upgrade to Pro</span>
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
				<div class="text-xs font-medium uppercase text-primary-900/75 dark:text-primary-100/75">
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
