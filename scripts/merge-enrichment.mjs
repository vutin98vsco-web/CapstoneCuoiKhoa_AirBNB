import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const filename = 'lib/data/room-types.json', original = await readFile(filename,'utf8'), catalog = JSON.parse(original);
const statistics = value => { const rooms = Object.values(value).flat(); return { roomTypes: rooms.length,priced: rooms.filter(room => room.price).length,capacity: rooms.filter(room => room.capacity).length,area: rooms.filter(room => room.areaM2).length,beds: rooms.filter(room => room.beds).length,photos: rooms.reduce((sum,room) => sum+room.images.length,0),atLeast3Photos: rooms.filter(room => room.images.length >= 3).length }; };
const before = statistics(catalog); let grades = 0;
const evidenceArray = value => Array.isArray(value) ? value : Object.entries(value || {}).map(([field,evidence]) => ({ fields: [field],...evidence }));
for (const name of ['enrichment-north-central.json','enrichment-south-coast.json','enrichment-20261123.json']) {
  const patch = JSON.parse(await readFile(`lib/data/${name}`,'utf8'));
  for (const [slug, types] of Object.entries(patch)) {
    assert.ok(catalog[slug],slug);
    for (const [id,change] of Object.entries(types)) {
      const room = catalog[slug].find(room => room.id === id); assert.ok(room,`${slug}/${id}`); grades++;
      const allowed = new Set(['capacity','areaM2','areaRangeM2','areaMinimumM2','beds','occupancyNote','price','images','evidence','checkedAt','sourceUrl','sourceName','sourceNote','description','sharedPhoto']); for (const field of Object.keys(change)) assert.ok(allowed.has(field),field);
      for (const field of ['capacity','areaM2','areaRangeM2','areaMinimumM2','beds','occupancyNote','price','sourceUrl','sourceName','sourceNote','description','sharedPhoto']) if (field in change) room[field] = change[field];
      if(change.areaRangeM2)assert.ok(change.areaRangeM2.min>0&&change.areaRangeM2.max>=change.areaRangeM2.min);
      if(change.areaMinimumM2)assert.ok(change.areaMinimumM2>0);
      if (change.capacity != null) assert.ok(Number.isInteger(change.capacity) && change.capacity >= 1 && change.capacity <= 100);
      if (change.price) { assert.ok(change.price.amount > 0); assert.ok(['VND','USD'].includes(change.price.currency)); assert.match(change.price.sourceUrl,/^https:\/\//); assert.ok(change.price.context.vi && change.price.context.en); assert.equal(change.price.isLive,false); }
      for (const photo of change.images || []) {
        assert.match(photo.path,/^\/images\/room-types\/[a-z0-9-]+\.webp$/); assert.match(photo.sourceUrl,/^https:\/\//); assert.match(photo.originalUrl,/^https:\/\//); await access(resolve('public',photo.path.slice(1)));
        if (!room.images.some(existing => existing.path === photo.path)) room.images.push(photo);
      }
      assert.ok(room.images.length <= 4,`${slug}/${id} has too many images`);
      const evidence = [...evidenceArray(room.evidence),...evidenceArray(change.evidence)];
      for (const item of evidence) { assert.match(item.url || item.sourceUrl,/^https:\/\//); assert.ok(item.checkedAt && item.support); }
      room.evidence = [...new Map(evidence.map(item => [JSON.stringify(item),item])).values()];
      room.checkedAt = change.checkedAt || '2026-11-22';
    }
  }
}
if (process.argv.includes('--apply')) { await mkdir('.reference',{ recursive: true }); const backup = '.reference/room-types-before-enrichment-20261122.json'; try { await access(backup); } catch { await writeFile(backup,original,'utf8'); } await writeFile(filename,JSON.stringify(catalog,null,2)+'\n','utf8'); }
console.log(JSON.stringify({ applied: process.argv.includes('--apply'),grades,before,after: statistics(catalog) }));
