import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const LIVE_BASE_URL = 'https://pink-kingfisher-948450.hostingersite.com';

const pages = [
  { slug: 'home', path: '/' },
  { slug: 'explore-hearing-solutions', path: '/explore-hearing-solutions/' },
  { slug: 'our-services', path: '/our-services/' },
  { slug: 'about-us', path: '/about-us/' },
  { slug: 'contact-us', path: '/contact-us/' },
  { slug: 'appointment-form', path: '/appointment-form/' },
  { slug: 'find-our-clinics', path: '/find-our-clinics/' },
  { slug: 'get-expert-advice', path: '/get-expert-advice/' },
  { slug: 'the-impact-of-untreated-hearing-loss', path: '/the-impact-of-untreated-hearing-loss/' },
  { slug: 'signs-you-may-have-hearing-loss', path: '/signs-you-may-have-hearing-loss/' },
  { slug: 'what-is-tinnitus', path: '/what-is-tinnitus/' },
  { slug: 'ear-infections-conditions', path: '/ear-infections-conditions/' }
];

function normalize(text) {
  if (!text) return '';
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if block is part of allowed removals or WP engine noise
function isAllowedRemoval(text) {
  if (!text) return true;
  const t = text.toLowerCase();
  if (t.includes('buy 2 get 1 free')) return true;
  if (t.includes('lorem ipsum')) return true;
  if (t.includes('click edit button to change this text')) return true;
  if (t.includes('shop now') && t.includes('sale')) return true;
  if (t === 'h' || t === '## h') return true;
  if (t === 'socials' || t === 'social') return true; // Elementor icon widget placeholder heading
  if (t === 'skip to content') return true; // WP accessibility skip link
  if (t.includes('proudly powered by') || t.includes('wordpress') || t.includes('elementor')) return true;
  // Concatenated WP navigation string from live site header
  if (t.startsWith('hearing health understanding hearing loss') || t.startsWith('book appointment! hearing health')) return true;
  return false;
}

async function extractFromLivePage(pageDef) {
  const url = `${LIVE_BASE_URL}${pageDef.path}`;
  console.log(`Fetching live page: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, noscript, svg, wp-admin bar, elementor edit widgets
  $('script, style, noscript, svg, #wpadminbar, .elementor-edit-area').remove();

  // Remove the allowed removal template eCommerce promo container if present
  $('.elementor-widget-container, .e-con, section').each((_, el) => {
    const text = $(el).text();
    if (text.includes('Buy 2 Get 1 Free') || text.includes('Click edit button to change this text')) {
      $(el).remove();
    }
  });

  // Meta Tags
  const meta = {
    title: normalize($('title').text()),
    description: normalize($('meta[name="description"]').attr('content') || ''),
    ogTitle: normalize($('meta[property="og:title"]').attr('content') || ''),
    ogDescription: normalize($('meta[property="og:description"]').attr('content') || ''),
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    ogUrl: $('meta[property="og:url"]').attr('content') || '',
    ogType: $('meta[property="og:type"]').attr('content') || ''
  };

  // Headings (excluding WP engine artifacts like "socials", stray "H", etc.)
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = el.tagName.toLowerCase();
    const text = normalize($(el).text());
    if (text && !isAllowedRemoval(text)) {
      // Don't add duplicate headings in same list
      if (!headings.some(h => h.text.toLowerCase() === text.toLowerCase())) {
        headings.push({ level, text });
      }
    }
  });

  // Lists
  const listItems = [];
  $('li').each((_, el) => {
    const text = normalize($(el).clone().children('ul, ol').remove().end().text());
    if (text && !isAllowedRemoval(text) && text.length > 5) {
      if (!listItems.some(l => l.toLowerCase() === text.toLowerCase())) {
        listItems.push(text);
      }
    }
  });

  // Tables
  const tables = [];
  $('table').each((_, tableEl) => {
    const rows = [];
    $(tableEl).find('tr').each((_, trEl) => {
      const row = [];
      $(trEl).find('th, td').each((_, cellEl) => {
        row.push(normalize($(cellEl).text()));
      });
      if (row.length > 0) rows.push(row);
    });
    if (rows.length > 0) tables.push({ rows });
  });

  // FAQs (Accordions)
  const faqs = [];
  $('.elementor-accordion-item, .elementor-toggle-item, .elementor-tab-title').each((_, el) => {
    const qEl = $(el).is('.elementor-tab-title') ? $(el) : $(el).find('.elementor-tab-title');
    const aEl = $(el).is('.elementor-tab-title') ? $(el).next('.elementor-tab-content') : $(el).find('.elementor-tab-content');
    const q = normalize(qEl.text());
    const a = normalize(aEl.text());
    if (q && a && !faqs.some(f => f.question.toLowerCase() === q.toLowerCase())) {
      faqs.push({ question: q, answer: a });
    }
  });

  // Buttons & CTAs
  const buttons = [];
  $('button, a.elementor-button, .elementor-button-text').each((_, el) => {
    const text = normalize($(el).text());
    if (text && !isAllowedRemoval(text) && !buttons.includes(text)) {
      buttons.push(text);
    }
  });

  // Form labels & Select options
  const formLabels = [];
  const selectOptions = [];
  $('label').each((_, el) => {
    const text = normalize($(el).text());
    if (text && !formLabels.includes(text)) formLabels.push(text);
  });
  $('select option').each((_, el) => {
    const text = normalize($(el).text());
    if (text && !selectOptions.includes(text)) selectOptions.push(text);
  });

  // Links
  const links = [];
  $('a').each((_, el) => {
    const text = normalize($(el).text());
    const href = $(el).attr('href') || '';
    if (text && href && !href.startsWith('javascript:') && !href.startsWith('#') && !isAllowedRemoval(text)) {
      links.push({ text, href });
    }
  });

  // Images
  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = normalize($(el).attr('alt') || '');
    if (src && !src.includes('wp-admin') && !src.includes('placeholder')) {
      images.push({ src, alt });
    }
  });

  // Videos
  const videos = [];
  $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).find('source').attr('src') || '';
    if (src) videos.push({ src });
  });

  // Contacts
  const bodyText = normalize($('body').text());
  const phones = [];
  if (bodyText.includes('905-232-7860') || bodyText.includes('9052327860')) phones.push('+1 905-232-7860');
  if (bodyText.includes('416-792-8792') || bodyText.includes('4167928792')) phones.push('+1 416-792-8792');
  
  const emails = [];
  if (/info@hearmaxx\.ca/i.test(bodyText)) emails.push('Info@hearmaxx.ca');

  const addresses = [];
  if (bodyText.includes('1151 Dundas Street')) {
    addresses.push('1151 Dundas Street West #17, Mississauga, ON L5C 4C4, Canada');
  }
  if (bodyText.includes('861 A Jane St') || bodyText.includes('Jane Park Plaza')) {
    addresses.push('861 A Jane St, York, ON M6N 4C4, Canada');
  }

  const hours = [];
  if (bodyText.includes('Monday – Friday') || bodyText.includes('10:00 – 17:00') || bodyText.includes('Monday - Friday')) {
    hours.push('Monday – Friday: 10:00 – 17:00');
    hours.push('Saturday – Sunday: Closed');
  }

  // Full visible text blocks (excluding navigation container concatenated strings and allowed removals)
  const visibleTextBlocks = [];
  $('h1, h2, h3, h4, h5, h6, p, td, th').each((_, el) => {
    const text = normalize($(el).text());
    if (text && !isAllowedRemoval(text) && text.length >= 15) {
      if (!visibleTextBlocks.some(b => b.toLowerCase() === text.toLowerCase())) {
        visibleTextBlocks.push(text);
      }
    }
  });

  return {
    slug: pageDef.slug,
    path: pageDef.path,
    url,
    meta,
    headings,
    listItems,
    tables,
    faqs,
    buttons,
    formLabels,
    selectOptions,
    links,
    images,
    videos,
    contacts: {
      phones,
      emails,
      addresses,
      hours
    },
    visibleTextBlocks
  };
}

(async () => {
  console.log('=== BUILDING REFINED CONTENT MANIFEST FROM LIVE SITE ===\n');
  const manifest = {
    generatedAt: new Date().toISOString(),
    liveBaseUrl: LIVE_BASE_URL,
    allowedRemovals: [
      'Buy 2 Get 1 Free eCommerce template block',
      'Stray ## H heading on Ear Infections page',
      'Duplicated slider slides',
      'Third-party hotlinked images (replaced with local placeholders)',
      'WordPress/Elementor engine classes & tags',
      'WordPress widget header artifacts ("socials", "skip to content")'
    ],
    pages: {}
  };

  for (const pageDef of pages) {
    try {
      const data = await extractFromLivePage(pageDef);
      manifest.pages[pageDef.slug] = data;
      console.log(`✓ Parsed ${pageDef.slug}: ${data.headings.length} headings, ${data.visibleTextBlocks.length} text blocks, ${data.faqs.length} FAQs`);
    } catch (err) {
      console.error(`✗ Error on ${pageDef.slug}:`, err.message);
    }
  }

  const outPath = 'content-manifest.json';
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written successfully to: ${outPath}`);
})();
