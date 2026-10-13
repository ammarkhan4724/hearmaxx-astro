import fs from 'node:fs';
import path from 'node:path';

const forbiddenTerms = [
  'wp-content',
  'wp-includes',
  'wp-json',
  'wp-admin',
  'wordpress',
  'elementor',
  'xmlrpc',
  'e-con',
  'wp-block',
  'wp-image',
  '?ver=',
  'hostingersite'
];

const ignoredDirs = new Set(['.git', 'node_modules', '.astro']);
const textExtensions = new Set(['.html', '.js', '.mjs', '.ts', '.astro', '.css', '.json', '.md', '.svg', '.txt', '.xml']);

const filenameViolations = [];
const contentViolations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative('.', fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        scanDir(fullPath);
      }
    } else {
      const lowerName = entry.name.toLowerCase();
      
      // 1. Check filename patterns
      if (lowerName.includes('wp-') || 
          lowerName.includes('untitled') || 
          lowerName.includes('elementor') || 
          /-\d+x\d+\./.test(lowerName)) {
        filenameViolations.push({
          file: relPath,
          issue: `Filename contains forbidden pattern ('wp-', 'untitled', 'elementor', or '-WxH')`
        });
      }

      // 2. Check content of text files (skip this script itself to avoid self-match)
      const ext = path.extname(entry.name).toLowerCase();
      if (textExtensions.has(ext) && !relPath.includes('verify-zero-wordpress.mjs')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const term of forbiddenTerms) {
            if (content.toLowerCase().includes(term.toLowerCase())) {
              contentViolations.push({
                file: relPath,
                term
              });
            }
          }
        } catch (e) {
          // ignore read error
        }
      }
    }
  }
}

console.log('========================================================================');
console.log('ZERO-WORDPRESS & ZERO-ELEMENTOR VERIFICATION AUDIT');
console.log('========================================================================\n');

scanDir('.');

console.log(`Filename Violations: ${filenameViolations.length}`);
if (filenameViolations.length > 0) {
  console.table(filenameViolations);
} else {
  console.log('✓ 0 forbidden filename patterns detected across repository!');
}

console.log(`\nContent Violations: ${contentViolations.length}`);
if (contentViolations.length > 0) {
  console.table(contentViolations);
} else {
  console.log('✓ 0 forbidden content terms detected across repository and dist/!');
}

if (filenameViolations.length === 0 && contentViolations.length === 0) {
  console.log('\n>>> AUDIT PASSED: ZERO WORDPRESS / ELEMENTOR ARTIFACTS EXIST. <<<');
  process.exit(0);
} else {
  console.log('\n>>> AUDIT FAILED: Violations must be cleaned up. <<<');
  process.exit(1);
}
