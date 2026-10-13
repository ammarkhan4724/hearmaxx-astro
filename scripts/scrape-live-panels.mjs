import * as cheerio from 'cheerio';
import fs from 'fs';

const pages = [
  { name: 'the-impact-of-untreated-hearing-loss', url: 'https://pink-kingfisher-948450.hostingersite.com/the-impact-of-untreated-hearing-loss/' },
  { name: 'what-is-tinnitus', url: 'https://pink-kingfisher-948450.hostingersite.com/what-is-tinnitus/' },
  { name: 'ear-infections-conditions', url: 'https://pink-kingfisher-948450.hostingersite.com/ear-infections-conditions/' },
  { name: 'home', url: 'https://pink-kingfisher-948450.hostingersite.com/' },
  { name: 'explore-hearing-solutions', url: 'https://pink-kingfisher-948450.hostingersite.com/explore-hearing-solutions/' },
  { name: 'our-services', url: 'https://pink-kingfisher-948450.hostingersite.com/our-services/' },
  { name: 'about-us', url: 'https://pink-kingfisher-948450.hostingersite.com/about-us/' },
  { name: 'contact-us', url: 'https://pink-kingfisher-948450.hostingersite.com/contact-us/' },
  { name: 'appointment-form', url: 'https://pink-kingfisher-948450.hostingersite.com/appointment-form/' },
  { name: 'find-our-clinics', url: 'https://pink-kingfisher-948450.hostingersite.com/find-our-clinics/' },
  { name: 'get-expert-advice', url: 'https://pink-kingfisher-948450.hostingersite.com/get-expert-advice/' },
  { name: 'signs-you-may-have-hearing-loss', url: 'https://pink-kingfisher-948450.hostingersite.com/signs-you-may-have-hearing-loss/' }
];

async function inspectPanels() {
  const extractedPanels = {};

  for (const p of pages) {
    console.log(`Fetching ${p.name} from ${p.url}...`);
    try {
      const res = await fetch(p.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      const pagePanels = {
        tabs: [],
        accordions: [],
        toggles: []
      };

      // 1. Elementor Tabs
      $('.elementor-widget-tabs').each((i, widget) => {
        const titles = [];
        $(widget).find('.elementor-tab-title').each((j, t) => {
          titles.push($(t).text().trim());
        });

        const contents = [];
        $(widget).find('.elementor-tab-content').each((j, c) => {
          contents.push($(c).text().replace(/\s+/g, ' ').trim());
        });

        pagePanels.tabs.push({
          titles,
          contents
        });
      });

      // 2. Elementor Accordions
      $('.elementor-widget-accordion').each((i, widget) => {
        const items = [];
        $(widget).find('.elementor-accordion-item').each((j, item) => {
          const title = $(item).find('.elementor-accordion-title').text().trim();
          const content = $(item).find('.elementor-tab-content').text().replace(/\s+/g, ' ').trim();
          items.push({ title, content });
        });
        pagePanels.accordions.push(items);
      });

      // 3. Elementor Toggles
      $('.elementor-widget-toggle').each((i, widget) => {
        const items = [];
        $(widget).find('.elementor-toggle-item').each((j, item) => {
          const title = $(item).find('.elementor-toggle-title').text().trim();
          const content = $(item).find('.elementor-tab-content').text().replace(/\s+/g, ' ').trim();
          items.push({ title, content });
        });
        pagePanels.toggles.push(items);
      });

      extractedPanels[p.name] = pagePanels;
      console.log(`  Tabs: ${pagePanels.tabs.length}, Accordions: ${pagePanels.accordions.length}, Toggles: ${pagePanels.toggles.length}`);
    } catch (err) {
      console.error(`Error on ${p.name}:`, err.message);
    }
  }

  fs.writeFileSync('live-panels-extracted.json', JSON.stringify(extractedPanels, null, 2));
  console.log('\nSaved full extraction to live-panels-extracted.json');
}

inspectPanels();
