import hljs from 'highlight.js'
import { marked } from 'marked'
import sanitize from 'sanitize-html'

export async function transformMessage(content: string) {
	content = marked(content, {
		highlight: (code) => hljs.highlightAuto(code).value,
		breaks: true,
		gfm: true,
		mangle: false,
		silent: true,
		smartLists: true,
		smartypants: true,
	})

	content = sanitize(content, {
		allowedClasses: {
			pre: [/^language-/],
			code: [/^language-/],
			span: [/^hljs-/],
		},
	})

	return content
}
