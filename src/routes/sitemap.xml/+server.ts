import { version } from '$app/environment'

export async function GET() {
	return new Response(
		`
<?xml version="1.0" encoding="UTF-8" ?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kal.chat/account?redirectTo=%2Ftopic%2Flatest</loc>
    <lastmod>${new Date(Number(version)).toISOString()}</lastmod>
  </url>
</urlset>
`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml',
			},
		},
	)
}
