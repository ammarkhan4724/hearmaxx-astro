import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isNoindex = import.meta.env.PUBLIC_NOINDEX === 'true';

  if (isNoindex) {
    return new Response(
      `User-agent: *\nDisallow: /\n`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const sitemapUrl = new URL('sitemap-index.xml', site ?? 'https://hearmaxx.ca/').href;

  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
