import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: colors.blue,
			},

			transitionDuration: {
				DEFAULT: '150ms',
			},
		},
	},

	plugins: [forms, typography],
} satisfies Config
