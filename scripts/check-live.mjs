import * as cheerio from 'cheerio';

const defaultBaseUrl = 'https://pink-kingfisher-948450.hostingersite.com';
const targetBaseUrl = (process.argv[2] || defaultBaseUrl).replace(/\/+$/, '');

const routes = [
  { name: 'Home', path: '/' },
  { name: 'Explore Hearing Solutions', path: '/explore-hearing-solutions/' },
  { name: 'Our Services', path: '/our-services/' },
  { name: 'About Us', path: '/about-us/' },
  { name: 'Contact Us', path: '/contact-us/' },
  { name: 'Appointment Form', path: '/appointment-form/' },
  { name: 'Find Our Clinics', path: '/find-our-clinics/' },
  { name: 'Get Expert Advice', path: '/get-expert-advice/' },
  { name: 'Impact of Untreated Hearing Loss', path: '/the-impact-of-untreated-hearing-loss/' },
  { name: 'Signs of Hearing Loss', path: '/signs-you-may-have-hearing-loss/' },
  { name: 'What is Tinnitus', path: '/what-is-tinnitus/' },
  { name: 'Ear Infections & Conditions', path: '/ear-infections-conditions/' },
  { name: '404 Not Found', path: '/404' }
];

const wpRegex = /(wp-content|wp-includes|wp-json|elementor|wp-block|wp-image|\/wp-admin|xmlrpc)/i;

async function checkUrl(route) {
  const fullUrl = `${targetBaseUrl}${route.path}`;
  try {
    const res = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'HearMaxx-Audit/1.0 (Mozilla/5.0 compatible)'
      },
      redirect: 'follow'
    });

    const status = res.status;
    const bodyText = await res.text();
    const $ = cheerio.load(bodyText);

    // Detect WordPress / Elementor traces
    const hasWpTraces = wpRegex.test(bodyText);
    const wpMatches = [...bodyText.matchAll(new RegExp(wpRegex.source, 'gi'))].map(m => m[0].toLowerCase());
    const uniqueWpTraces = [...new Set(wpMatches)].slice(0, 3).join(', ');

    // Detect Generator meta
    const generator = $('meta[name="generator"]').attr('content') || 'None';
    const hasAstro = generator.toLowerCase().includes('astro');

    // Detect Canonical
    const canonical = $('link[rel="canonical"]').attr('href') || 'None';
    let canonicalDomain = 'None';
    if (canonical !== 'None') {
      try {
        canonicalDomain = new URL(canonical).hostname;
      } catch {
        canonicalDomain = canonical;
      }
    }

    // Detect Robots meta
    const robots = $('meta[name="robots"]').attr('content') || 'None';

    return {
      name: route.name,
      path: route.path,
      status,
      wpTraces: hasWpTraces ? `YES (${uniqueWpTraces})` : 'NO (Clean)',
      generator,
      isAstro: hasAstro ? 'YES' : 'NO',
      canonicalDomain,
      robots
    };
  } catch (err) {
    return {
      name: route.name,
      path: route.path,
      status: `ERR: ${err.message}`,
      wpTraces: 'UNKNOWN',
      generator: 'UNKNOWN',
      isAstro: 'NO',
      canonicalDomain: 'UNKNOWN',
      robots: 'UNKNOWN'
    };
  }
}

async function run() {
  console.log('========================================================================');
  console.log(`HEAR MAXX LIVE / STAGING READINESS AUDITOR`);
  console.log(`Target Base URL: ${targetBaseUrl}`);
  console.log('========================================================================\n');

  // Check robots.txt and sitemap
  try {
    const robotsRes = await fetch(`${targetBaseUrl}/robots.txt`);
    const robotsText = await robotsRes.text();
    console.log(`[robots.txt] HTTP ${robotsRes.status}:`);
    console.log(robotsText.split('\n').map(l => '  ' + l).join('\n'));
  } catch (err) {
    console.log(`[robots.txt] Failed to fetch: ${err.message}`);
  }

  try {
    const sitemapRes = await fetch(`${targetBaseUrl}/sitemap-index.xml`);
    console.log(`\n[sitemap-index.xml] HTTP ${sitemapRes.status}`);
  } catch (err) {
    console.log(`\n[sitemap-index.xml] Failed to fetch: ${err.message}`);
  }

  console.log('\nAuditing 12 core pages + 404 handler...\n');
  const results = [];
  for (const route of routes) {
    const result = await checkUrl(route);
    results.push(result);
  }

  console.table(results.map(r => ({
    Page: r.name,
    Path: r.path,
    HTTP: r.status,
    'WordPress Traces': r.wpTraces,
    'Astro Tag': r.isAstro,
    'Generator': r.generator,
    'Canonical Domain': r.canonicalDomain,
    'Robots Meta': r.robots
  })));

  const wpPageCount = results.filter(r => r.wpTraces.startsWith('YES')).length;
  const astroPageCount = results.filter(r => r.isAstro === 'YES').length;

  console.log('\n------------------------------------------------------------------------');
  console.log(`SUMMARY FOR ${targetBaseUrl}:`);
  console.log(`- Pages with WordPress / Elementor traces: ${wpPageCount} / ${results.length}`);
  console.log(`- Pages identified as Astro: ${astroPageCount} / ${results.length}`);

  if (wpPageCount > 0) {
    console.log('\n[NOTICE] The target server is currently serving the legacy WordPress/Elementor site.');
    console.log('Please follow DEPLOY.md to back up, clean the target public_html, and upload dist/.');
  } else if (astroPageCount === results.length) {
    console.log('\n[SUCCESS] The target server is 100% running the new Astro build with ZERO WordPress traces!');
  }
  console.log('------------------------------------------------------------------------\n');
}

run();
