export function clickOutside(node: HTMLElement, handler?: () => void) {
	const handleClick = (event: Event) => {
		if (!node.contains(event.target as HTMLElement)) {
			handler?.()
		}
	}

	document.addEventListener('click', handleClick, true)

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true)
		},
	}
}
