import { browser } from '$app/environment'

export function unsavedChangesWarning(_node: HTMLElement, isDirty = false) {
	const handleBeforeUnload = (event: Event) => {
		if (browser && isDirty) {
			event.preventDefault()
			event.stopPropagation()
			return ((event as unknown as { returnValue: string }).returnValue =
				'You may have unsaved changes. Are you sure you want to leave?')
		}
	}

	window.addEventListener('beforeunload', handleBeforeUnload, { capture: true })

	return {
		update(newIdDirty: boolean) {
			isDirty = newIdDirty
		},
		destroy() {
			window.removeEventListener('beforeunload', handleBeforeUnload, {
				capture: true,
			})
		},
	}
}
