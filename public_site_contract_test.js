const fs = require('fs');
const path = require('path');

const root = __dirname;
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);
const failures = [];
const stale = /C\$|\bCAD\b|Square|controlled beta|checkout closed|checkout coming soon|\bRC2\b|\bRC6\b|AI drafts unavailable|internal links unavailable|Free binary unavailable|technically qualified|Complete bundle/i;
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  if (!/^<!doctype html>/i.test(text)) failures.push(`${rel}: missing doctype`);
  if (!/<meta name="viewport"/i.test(text)) failures.push(`${rel}: missing viewport`);
  if (!/<link rel="canonical"/i.test(text)) failures.push(`${rel}: missing canonical`);
  if (!/<title>[^<]+<\/title>/i.test(text)) failures.push(`${rel}: missing title`);
  if (stale.test(text)) failures.push(`${rel}: stale public copy`);
  for (const match of text.matchAll(/href="([^"]+)"/gi)) {
    const href = match[1];
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    if (clean.startsWith('downloads/')) continue; // release-managed binaries are intentionally not stored in this static source repo
    const target = path.resolve(path.dirname(file), clean);
    const candidates = [target, path.join(target, 'index.html')];
    if (!candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) failures.push(`${rel}: broken internal link ${href}`);
  }
}
const rootIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pricing = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8');
const paddle = fs.readFileSync(path.join(root, 'paddle-seo.js'), 'utf8');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
if (!rootIndex.includes('FOUNDING 500 LIFETIME DEAL') || !rootIndex.includes('Limited to the first 500 paying customers.')) failures.push('homepage: founding 500 message missing');
if (!pricing.includes('$89') || !pricing.includes('$199') || !pricing.includes('one-time') || !pricing.includes('lifetime')) failures.push('pricing: canonical offer missing');
for (const id of ['pri_01m1524hswd2h0aqb9jgdscd6k', 'pri_01m152bjg4v9e6wcety33fhbgq']) if (!pricing.includes(id) || !paddle.includes(id)) failures.push(`paddle: approved price missing ${id}`);
if (!paddle.includes('live_3392a4bb7d056c8b11ac2039d46')) failures.push('paddle: approved client token missing');
for (const route of ['compare/', 'compare/barnd-ai-vs-aioseo/', 'compare/barnd-ai-vs-rank-math/', 'compare/barnd-ai-vs-yoast/', 'compare/barnd-ai-vs-seopress/', 'compare/best-ai-seo-plugins-wordpress/', 'compare/best-wordpress-seo-plugin-for-ai-search/']) if (!sitemap.includes(`https://barndai.com/${route}`)) failures.push(`sitemap: missing ${route}`);
if (!fs.existsSync(path.join(root, 'seo-download.js')) || !fs.existsSync(path.join(root, 'download.html'))) failures.push('delivery: secure download assets missing');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`PASS: ${htmlFiles.length} HTML routes, stale-copy scan, internal links, metadata, schema/offer, Paddle IDs, sitemap, and secure delivery contract.`);
