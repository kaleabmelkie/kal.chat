import hljs from 'highlight.js'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import { mangle } from 'marked-mangle'
import { markedSmartypants } from 'marked-smartypants'
import sanitize from 'sanitize-html'

const marked = new Marked(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext'
			return hljs.highlight(code, { language }).value
		},
	}),
	mangle(),
	markedSmartypants(),
)

export async function markdownToHtml(content: string) {
	// eslint-disable-next-line no-misleading-character-class
	content = await marked.parse(content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''), {
		breaks: true,
		gfm: true,
		silent: true,
	})

	content = sanitize(content, {
		allowedClasses: {
			pre: [/^language-/],
			code: [/^language-/],
			span: [/^hljs-/],
			div: [/^think/],
		},
	})

	return content
}
