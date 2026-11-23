import assert from 'node:assert/strict';
import properties from '../lib/data/properties.json' with { type: 'json' };
import typesByProperty from '../lib/data/room-types.json' with { type: 'json' };
import { cityNames } from '../lib/reference-catalog.js';
import { roomTypeCopy } from '../lib/room-type-copy.js';
import covers from '../lib/data/property-covers.json' with { type: 'json' };

const base = process.argv[2] || 'http://localhost:3001';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
async function page(path, locale) {
  const response = await fetch(`${base}${path}`, { headers: { Cookie: `tnbnb-language=${locale}` }, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${locale} ${path}`);
  const html = await response.text();
  assert.ok(html.includes(`<html lang="${locale}"`), `${locale} language mismatch`);
  return html;
}
let checked = 0;
for (const locale of ['vi', 'en']) {
  for (let offset = 0; offset < properties.length; offset += 6) {
    await Promise.all(properties.slice(offset, offset + 6).map(async property => {
      const html = await page(`/phong/${property.slug}`, locale);
      const types = typesByProperty[property.slug];
      assert.ok(html.includes('id="room-types"'));
      assert.equal((html.match(/<article[^>]*class="room-type-card(?: |")/g) || []).length, types.length, property.slug);
      for (const type of types) {
        assert.ok(html.includes(escape(type.name[locale])), `${property.slug}/${type.id}: missing title`);
        for (const image of type.images) assert.ok(html.includes(`src="${image.path}"`), `${property.slug}/${type.id}: missing photo ${image.path}`);
      }
      assert.ok(html.includes('VND') && html.includes('USD'));
      checked++;
    }));
  }
  for (const [city, name] of Object.entries(cityNames)) {
    const html = await page(`/rooms?q=${encodeURIComponent(name)}`, locale);
    assert.equal((html.match(/<article class="room-card"/g) || []).length, properties.filter(property => property.city === city).length);
    const cards = html.match(/<article class="room-card"[\s\S]*?<\/article>/g) || [];
    for (const property of properties.filter(property => property.city === city)) {
      const card = cards.find(value => value.includes(`/phong/${property.slug}`));
      assert.ok(card?.includes(`src="${covers[property.slug].thumbnailPath || covers[property.slug].path}"`), `${property.slug}: listing should show the hotel cover`);
    }
  }
  const sources = await page('/data-sources', locale);
  assert.equal((sources.match(/<article class="source-record"/g) || []).length, properties.length);
  const allTypes = Object.entries(typesByProperty).flatMap(([slug, types]) => types.map(type => ({ slug, type })));
  for (const hasPrice of [true, false]) {
    const { slug, type } = allTypes.find(item => Boolean(item.type.price) === hasPrice);
    const html = await page(`/phong/${slug}?roomType=${type.id}&checkin=2026-12-01&checkout=2026-12-03&guests=2`, locale);
    assert.ok(html.includes('booking-selected-room'));
    assert.ok(html.includes(escape(type.name[locale])));
    if (!hasPrice) {
      assert.ok(html.includes(escape(roomTypeCopy[locale].rateOnRequest)));
      assert.doesNotMatch(html, /<button[^>]*class="button-primary booking-submit"[^>]*disabled=""/);
      assert.ok(!html.includes('class="booking-price"'));
    } else assert.ok(html.includes('class="booking-price"'));
  }
  const home = await page('/', locale);
  assert.ok(!home.includes('src="undefined"'));
}
const missing = await fetch(`${base}/phong/missing-property`);
assert.equal(missing.status, 404);
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
assert.ok(sitemap.includes('/phong/hanoi-4689061')); assert.ok(!sitemap.includes('/tai-khoan'));
const robots = await (await fetch(`${base}/robots.txt`)).text(); assert.ok(robots.includes('Disallow: /quan-tri')); assert.ok(robots.includes('/sitemap.xml'));
for (const cover of Object.values(covers)) {
  const response = await fetch(`${base}${cover.thumbnailPath || cover.path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /image\/webp/);
  await response.arrayBuffer();
}
for (const locale of ['vi', 'en']) {
  const returnTo = `/phong/${properties[0].slug}?roomType=${typesByProperty[properties[0].slug][0].id}&guests=2#room-types`;
  const response = await fetch(`${base}/language`, { method: 'POST', body: new URLSearchParams({ locale, returnTo }), redirect: 'manual' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), returnTo, 'Language switching must retain query/hash on the public host.');
  assert.match(response.headers.get('set-cookie'), new RegExp(`tnbnb-language=${locale}`));
}
for (const returnTo of ['https://foreign.example', '//foreign.example', '/\\foreign.example']) {
  const response = await fetch(`${base}/language`, { method: 'POST', body: new URLSearchParams({ locale: 'vi', returnTo }), redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/', 'Language switching must not redirect to an external host.');
}
console.log(JSON.stringify({ detailPages: checked, destinationLists: 16, hotelCovers: Object.keys(covers).length, sourcePages: 2, selectedRoomChecks: 4, homePages: 2, languageRedirects: 5, missingProperty: 404 }));
