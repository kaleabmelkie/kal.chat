import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export function encrypt(value: string, key: string) {
	const iv = randomBytes(16)
	const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), iv)
	const encrypted = Buffer.concat([cipher.update(value), cipher.final()])

	return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(value: string, key: string) {
	const [iv, encrypted] = value.split(':')
	const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'))
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(encrypted, 'hex')),
		decipher.final(),
	])

	return decrypted.toString()
}
