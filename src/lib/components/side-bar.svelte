<script lang="ts">
	export let isOpen: boolean
</script>

<div
	class="absolute z-20 h-screen w-full flex-shrink-0 overflow-auto bg-white sm:static sm:w-[16rem] sm:bg-white/40"
>
	<h2 class="p-4 pt-[calc(4.75rem+1rem)] lg:px-6">
		// TODO: New Thread, Search, & Thread History Thread, Close Side Bar

		<br />

		<button on:click={() => (isOpen = false)}>Close</button>
	</h2>
</div>
