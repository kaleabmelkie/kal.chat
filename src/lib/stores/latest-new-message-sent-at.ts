import { writable } from 'svelte/store'

export const latestNewMessageSentAt = writable<number | null>(null)
