const fs = require('fs');
const path = require('path');

const files = [
  'our-services.html',
  'about-us.html',
  'contact-us.html',
  'appointment-form.html',
  'find-our-clinics.html',
  'get-expert-advice.html',
  'the-impact-of-untreated-hearing-loss.html',
  'signs-you-may-have-hearing-loss.html',
  'what-is-tinnitus.html',
  'ear-infections-conditions.html'
];

files.forEach(f => {
  const content = fs.readFileSync(path.join('scratch_live', f), 'utf8');
  // Strip script, style, comments
  const clean = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '');
  
  // Find all headings
  const headings = [];
  const hRegex = /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = hRegex.exec(clean)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text.length > 2 && !text.includes('Menu') && !text.includes('Navigation')) {
      headings.push(`${m[1]}: ${text}`);
    }
  }

  console.log(`=== ${f} Headings (${headings.length}) ===`);
  headings.forEach(h => console.log('  ' + h));
  console.log('\n');
});
