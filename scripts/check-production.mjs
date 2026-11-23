import assert from 'node:assert/strict';
const base = 'https://tnbnb.vercel.app';
for (const path of ['/', '/rooms?source=tnbnb', '/api/health', '/robots.txt', '/sitemap.xml']) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(base + path, { signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200); const body = await response.text();
      if (path === '/api/health') assert.equal(JSON.parse(body).status, 'ok');
      if (path === '/sitemap.xml') assert.ok(body.includes('<urlset'));
      last = null; break;
    } catch { last = new Error(`Production check failed: ${path}`); }
  }
  if (last) throw last;
}
console.log('Production pages, database health and SEO endpoints are available.');
