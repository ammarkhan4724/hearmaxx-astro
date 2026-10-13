import fs from 'fs';
import * as cheerio from 'cheerio';

const manifest = JSON.parse(fs.readFileSync('content-manifest.json', 'utf8'));

const routeMap = {
  'home': 'dist/index.html',
  'explore-hearing-solutions': 'dist/explore-hearing-solutions/index.html',
  'our-services': 'dist/our-services/index.html',
  'about-us': 'dist/about-us/index.html',
  'contact-us': 'dist/contact-us/index.html',
  'appointment-form': 'dist/appointment-form/index.html',
  'find-our-clinics': 'dist/find-our-clinics/index.html',
  'get-expert-advice': 'dist/get-expert-advice/index.html',
  'the-impact-of-untreated-hearing-loss': 'dist/the-impact-of-untreated-hearing-loss/index.html',
  'signs-you-may-have-hearing-loss': 'dist/signs-you-may-have-hearing-loss/index.html',
  'what-is-tinnitus': 'dist/what-is-tinnitus/index.html',
  'ear-infections-conditions': 'dist/ear-infections-conditions/index.html'
};

const counts = [];

for (const [slug, htmlPath] of Object.entries(routeMap)) {
  const live = manifest.pages[slug];
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Extract built stats
  $('script, style, noscript').remove();
  const builtText = $('body').text().replace(/\s+/g, ' ').trim();
  const builtWords = builtText.split(/\s+/).filter(Boolean).length;
  const builtHeadings = $('h1, h2, h3, h4, h5, h6').length;
  const builtLinks = $('a[href]').length;
  const builtImages = $('img').length;
  const builtVideos = $('video').length;
  const builtTableCells = $('td, th').length;
  const builtFaqs = $('details, [data-faq], .faq-item').length;

  // Live manifest stats
  const liveText = live.visibleTextBlocks.join(' ').replace(/\s+/g, ' ').trim();
  const liveWords = liveText.split(/\s+/).filter(Boolean).length;
  const liveHeadings = live.headings.length;
  const liveLinks = live.links.length;
  const liveImages = live.images.length;
  const liveVideos = live.videos.length;
  const liveTableCells = live.tables.reduce((acc, t) => acc + (t.rows.length * (t.headers.length || 2)), 0);
  const liveFaqs = live.faqs.length;

  counts.push({
    page: slug,
    liveWords,
    builtWords,
    liveHeadings,
    builtHeadings,
    liveLinks,
    builtLinks,
    liveImages,
    builtImages,
    liveVideos,
    builtVideos,
    liveTableCells,
    builtTableCells,
    liveFaqs,
    builtFaqs
  });
}

fs.writeFileSync('entity_counts.json', JSON.stringify(counts, null, 2));
console.log('=== ENTITY COUNTS PER PAGE (LIVE vs BUILT) ===\n');
console.table(counts);
