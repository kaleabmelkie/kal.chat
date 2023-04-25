import { writable } from 'svelte/store'

export const latestNewMessageSentAtStore = writable<number | null>(null)
