import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const properties = JSON.parse(await fs.readFile('lib/data/properties.json', 'utf8'));
const original = JSON.parse(await fs.readFile('lib/data/room-types.json', 'utf8'));
const covers = JSON.parse(await fs.readFile('.reference/property-covers.json', 'utf8'));
const allowedCoverKinds = ['exterior', 'aerial', 'entrance', 'pool', 'lobby'];
assert.equal(Object.keys(covers).length, properties.length, 'Every property needs its own hotel cover');
for (const property of properties) {
  const cover = covers[property.slug];
  assert.ok(cover && allowedCoverKinds.includes(cover.kind), `No hotel cover: ${property.slug}`);
  assert.match(cover.path, /^\/images\/property-covers\/[a-z0-9-]+\.webp$/);
  assert.match(cover.sourceUrl, /^https:\/\//);
  assert.match(cover.originalUrl, /^https:\/\//);
  assert.ok(cover.caption?.vi && cover.caption?.en, `Missing cover caption: ${property.slug}`);
  await fs.access(`public${cover.path}`);
}
const updates = {};
for (const group of ['a', 'b']) {
  const data = JSON.parse(await fs.readFile(`.reference/room-angles-${group}.json`, 'utf8'));
  for (const [slug, types] of Object.entries(data)) {
    assert.ok(original[slug] && !updates[slug], `Unknown or duplicate property: ${slug}`);
    assert.equal(types.length, original[slug].length, `Room inventory changed: ${slug}`);
    updates[slug] = original[slug].map(room => {
      const updated = types.find(type => type.id === room.id);
      assert.ok(updated, `Missing room category: ${slug}/${room.id}`);
      for (const key of ['id', 'name', 'category', 'description', 'areaM2', 'capacity', 'beds', 'view', 'price', 'sourceUrl', 'sourceName', 'sharedPhoto']) assert.deepEqual(updated[key], room[key], `Unexpected content change: ${slug}/${room.id}/${key}`);
      assert.ok(updated.images.length > 0 && updated.images.length <= 4, `Invalid photo count: ${slug}/${room.id}`);
      for (const photo of updated.images) {
        assert.match(photo.path, /^\/images\/room-types\/[a-z0-9-]+\.webp$/);
        assert.match(photo.sourceUrl, /^https:\/\//);
        assert.match(photo.originalUrl, /^https:\/\//);
      }
      return { ...room, images: updated.images,
        ...(updated.gallerySourceUrl ? { gallerySourceUrl: updated.gallerySourceUrl } : {}),
        ...(updated.imageAssociation ? { imageAssociation: updated.imageAssociation } : {}),
      };
    });
  }
}
assert.equal(Object.keys(updates).length, properties.length, 'Incomplete room gallery coverage');
await fs.writeFile('lib/data/property-covers.json', JSON.stringify(covers, null, 2) + '\n');
await fs.writeFile('lib/data/room-types.json', JSON.stringify(updates, null, 2) + '\n');
const rooms = Object.values(updates).flat();
console.log(JSON.stringify({ properties: properties.length, rooms: rooms.length, photos: rooms.reduce((total, room) => total + room.images.length, 0), threeOrMore: rooms.filter(room => room.images.length >= 3).length, fourPhotos: rooms.filter(room => room.images.length === 4).length, covers: Object.fromEntries(allowedCoverKinds.map(kind => [kind, Object.values(covers).filter(cover => cover.kind === kind).length])) }));
