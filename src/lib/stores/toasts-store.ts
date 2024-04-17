import { writable } from 'svelte/store'

type ToastType = {
	id: string
	type: 'info' | 'error'
	message: string
	timeout?: number | null
}

export const toastsStore = writable<ToastType[]>([])

let timeouts: { [id: string]: NodeJS.Timeout } = {}

export async function clearAllToasts() {
	for (const id in timeouts) {
		clearTimeout(timeouts[id])
	}
	timeouts = {}

	toastsStore.set([])
}

export async function clearToast(id: string) {
	clearTimeout(timeouts[id])
	delete timeouts[id]

	toastsStore.update((ts) => ts.filter((t) => t.id !== id))
}

export async function toast(
	message: ToastType['message'],
	type: ToastType['type'] = 'info',
	timeout?: number | null,
) {
	if (timeout === undefined) {
		timeout = type === 'info' ? 5000 : type === 'error' ? 30000 : null
	}

	toastsStore.update((ts) => {
		const id = Math.random().toString(36).slice(2)
		if (timeout) {
			timeouts[id] = setTimeout(() => clearToast(id), timeout)
		}
		return [...ts, { id, type, message, timeout }]
	})
}

export async function err(e?: Error | string, timeout?: number | null) {
	if (typeof e === 'string') {
		e = new Error(e)
	}

	console.error(e)

	return toast(
		Array.isArray(e)
			? e.map((i) => i?.message ?? 'Unknown error').join('\n')
			: e?.message ?? 'Unknown error',
		'error',
		timeout,
	)
}
