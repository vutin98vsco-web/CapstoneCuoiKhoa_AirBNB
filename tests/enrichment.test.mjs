import test from 'node:test';
import assert from 'node:assert/strict';
import { referenceRooms } from '../lib/reference-catalog.js';
test('new occupancy and price data keeps explicit evidence and child-occupancy notes', () => {
  const enriched = referenceRooms.flatMap(property => property.roomTypes).filter(room => Array.isArray(room.evidence) && room.evidence.some(item => item.checkedAt === '2026-11-22'));
  assert.ok(enriched.length >= 180);
  for (const room of enriched) {
    assert.ok(room.images.length <= 4);
    for (const evidence of room.evidence) { assert.match(evidence.url || evidence.sourceUrl,/^https:\/\//); assert.ok(evidence.checkedAt && evidence.support); }
    if (room.occupancyNote) assert.ok(room.occupancyNote.vi && room.occupancyNote.en);
    if (room.price) { assert.equal(room.price.isLive,false); assert.ok(room.price.context.vi && room.price.context.en); }
  }
  const wink = referenceRooms.find(property => property.tenPhong.includes('Wink'))?.roomTypes.find(room => room.id.includes('corner'));
  if (wink) { assert.equal(wink.capacity,3); assert.ok(wink.occupancyNote?.vi && wink.occupancyNote?.en); }
});
