export async function GET() {
	return new Response(
		`
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
	<ShortName>kal.chat</ShortName>
	<Description>Start a new topic on kal.chat</Description>
	<InputEncoding>UTF-8</InputEncoding>
	<Image width="16" height="16" type="image/x-icon">https://kal.chat/favicon.ico</Image>
	<Url type="text/html" template="https://kal.chat/topic/new?q={searchTerms}" />
	<Url type="application/opensearchdescription+xml" rel="self" template="https://kal.chat/opensearch.xml" />
	<Query role="example" searchTerms="What%20is%20the%20answer%20to%20life%2C%20the%20universe%2C%20and%20everything%3F" />
</OpenSearchDescription>
`.trim(),
		{
			headers: {
				'Content-Type': 'application/opensearchdescription+xml',
			},
		},
	)
}
