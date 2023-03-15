import { LEMON_SQUEEZY_API_KEY } from '$env/static/private'
import { LemonsqueezyClient } from 'lemonsqueezy.ts'

export const lemonSqueezy = new LemonsqueezyClient(LEMON_SQUEEZY_API_KEY)
