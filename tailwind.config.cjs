const colors = require('tailwindcss/colors')

const config = {
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

	plugins: [require('@tailwindcss/typography'), require('@tailwindcss/line-clamp')],
}

module.exports = config
