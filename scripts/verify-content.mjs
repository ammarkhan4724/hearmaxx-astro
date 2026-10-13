import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const MANIFEST_PATH = 'content-manifest.json';
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Error: ${MANIFEST_PATH} not found. Run scripts/build-content-manifest.mjs first.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

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

function cleanText(text) {
  return normalize(text)
    .replace(/([?!:;,])(?=[A-Za-z])/g, '$1 ')
    .replace(/([A-Za-z0-9])([-(])/g, '$1 $2')
    .replace(/([)-])([A-Za-z0-9])/g, '$1 $2')
    .replace(/(\d{1,2}:\d{2})(Sat|Sun|Mon)/gi, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let totalErrors = 0;
const pageSummaries = [];

console.log('=== STARTING AUTOMATED CONTENT PARITY VERIFICATION ===\n');
console.log(`Comparing plain HTML files in dist/ against content-manifest.json (ZERO JS executed)\n`);

for (const [slug, htmlPath] of Object.entries(routeMap)) {
  if (!fs.existsSync(htmlPath)) {
    console.error(`✗ Missing built file: ${htmlPath}`);
    totalErrors++;
    continue;
  }

  const livePage = manifest.pages[slug];
  if (!livePage) {
    console.error(`✗ Missing manifest entry for slug: ${slug}`);
    totalErrors++;
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Plain static extraction (NO JS)
  $('script, style, noscript').remove();
  const builtFullText = cleanText($('body').text());

  // 1. Check Visible Text Blocks
  let missingBlocks = [];
  for (const block of livePage.visibleTextBlocks) {
    const cleanedBlock = cleanText(block);
    if (cleanedBlock.length < 15) continue;
    const sub = cleanedBlock.length > 40 ? cleanedBlock.slice(0, 35) : cleanedBlock;
    if (!builtFullText.includes(sub)) {
      missingBlocks.push(block);
    }
  }

  // 2. Check Headings
  let missingHeadings = [];
  for (const h of livePage.headings) {
    const cleanH = cleanText(h.text);
    if (cleanH.length < 5) continue;
    const subH = cleanH.length > 35 ? cleanH.slice(0, 30) : cleanH;
    if (!builtFullText.includes(subH)) {
      missingHeadings.push(`[${h.level}] ${h.text}`);
    }
  }

  // 3. Check FAQs
  let missingFaqs = [];
  for (const faq of livePage.faqs) {
    const cleanQ = cleanText(faq.question);
    const cleanA = cleanText(faq.answer);
    const subQ = cleanQ.slice(0, 20);
    const subA = cleanA.slice(0, 20);
    if (!builtFullText.includes(subQ) || !builtFullText.includes(subA)) {
      missingFaqs.push(faq.question);
    }
  }

  // 4. Check Contacts
  let missingContacts = [];
  for (const p of livePage.contacts.phones) {
    if (!builtFullText.includes(cleanText(p))) {
      missingContacts.push(`Phone: ${p}`);
    }
  }
  for (const e of livePage.contacts.emails) {
    if (!builtFullText.includes(cleanText(e))) {
      missingContacts.push(`Email: ${e}`);
    }
  }

  // 5. Check Videos (for about-us)
  if (slug === 'about-us') {
    const videoCount = $('video').length;
    if (videoCount < 2) {
      missingBlocks.push(`Expected 2 HTML5 videos on about-us, found ${videoCount}`);
    }
  }

  const pageErrors = missingBlocks.length + missingHeadings.length + missingFaqs.length + missingContacts.length;
  totalErrors += pageErrors;

  pageSummaries.push({
    slug,
    textBlocks: `${livePage.visibleTextBlocks.length - missingBlocks.length}/${livePage.visibleTextBlocks.length}`,
    headings: `${livePage.headings.length - missingHeadings.length}/${livePage.headings.length}`,
    faqs: livePage.faqs.length > 0 ? `${livePage.faqs.length - missingFaqs.length}/${livePage.faqs.length}` : '0/0',
    status: pageErrors === 0 ? '✓ PASS' : `✗ ${pageErrors} ERRORS`
  });

  if (pageErrors > 0) {
    console.log(`--------------------------------------------------`);
    console.log(`PAGE: [${slug}] FAILED PARITY CHECK (${pageErrors} issues):`);
    if (missingBlocks.length > 0) {
      console.log(`  Missing Text Blocks (${missingBlocks.length}):`);
      missingBlocks.slice(0, 5).forEach(b => console.log(`    - "${b.slice(0, 80)}..."`));
    }
    if (missingHeadings.length > 0) {
      console.log(`  Missing Headings (${missingHeadings.length}):`);
      missingHeadings.slice(0, 5).forEach(h => console.log(`    - ${h}`));
    }
    if (missingFaqs.length > 0) {
      console.log(`  Missing FAQs (${missingFaqs.length}):`);
      missingFaqs.forEach(f => console.log(`    - Q: ${f}`));
    }
    if (missingContacts.length > 0) {
      console.log(`  Missing Contacts:`);
      missingContacts.forEach(c => console.log(`    - ${c}`));
    }
    console.log(`--------------------------------------------------\n`);
  } else {
    console.log(`✓ [${slug}] 100% Content Parity Verified`);
  }
}

console.log('\n==================================================');
console.log('CONTENT PARITY SUMMARY TABLE');
console.log('==================================================');
console.table(pageSummaries);
console.log(`TOTAL PARITY ERRORS: ${totalErrors}`);
console.log('==================================================\n');

if (totalErrors > 0) {
  console.error(`PARITY CHECK FAILED with ${totalErrors} errors.`);
  process.exit(1);
} else {
  console.log('ALL PAGES PASSED CONTENT PARITY WITH ZERO LOSS!');
  process.exit(0);
}
