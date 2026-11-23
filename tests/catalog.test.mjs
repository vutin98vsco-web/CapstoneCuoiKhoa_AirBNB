import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import properties from '../lib/data/properties.json' with { type: 'json' };
import typesByProperty from '../lib/data/room-types.json' with { type: 'json' };
import photosByProperty from '../lib/data/property-images.json' with { type: 'json' };
import coversByProperty from '../lib/data/property-covers.json' with { type: 'json' };
import { referenceRooms, cityNames } from '../lib/reference-catalog.js';
import { bookingOfferFor } from '../lib/room-view.js';
import { priceAmounts, formatCurrency, exchangeRate } from '../lib/currency.js';
import { localizeRoom, roomSummary } from '../lib/i18n.js';
import { detailCopy } from '../lib/detail-copy.js';
import { roomTypeCopy } from '../lib/room-type-copy.js';

test('the eight destinations each contain at least ten distinct real properties', () => {
  assert.equal(new Set(properties.map(property => property.slug)).size, 80);
  for (const city of Object.keys(cityNames)) assert.ok(properties.filter(property => property.city === city).length >= 10, city);
  for (const property of properties) {
    assert.ok(property.price.amount > 0);
    assert.equal(property.price.isLive, false);
    assert.match(property.sourceUrl, /^https:\/\//);
    assert.match(property.price.sourceUrl, /^https:\/\//);
    assert.ok(property.price.checkedAt && property.price.context.vi && property.price.context.en);
    assert.equal(photosByProperty[property.slug].length, 5);
  }
});

test('every property has at least two distinct, bilingual, source-linked room categories', () => {
  assert.equal(Object.keys(typesByProperty).length, 80);
  for (const property of properties) {
    const types = typesByProperty[property.slug];
    assert.ok(types.length >= 2, property.slug);
    assert.equal(new Set(types.map(type => type.id)).size, types.length);
    assert.equal(new Set(types.map(type => type.sourceOriginalName.toLowerCase())).size, types.length);
    for (const type of types) {
      assert.ok(['room', 'suite', 'apartment', 'villa'].includes(type.category));
      assert.match(type.sourceUrl, /^https:\/\//);
      assert.ok(type.checkedAt && type.sourceName && type.sourceOriginalName);
      for (const locale of ['vi', 'en']) {
        assert.ok(type.name[locale] && type.description[locale]);
        assert.doesNotMatch(type.name[locale], /[?\uFFFD]/);
        assert.doesNotMatch(type.description[locale], /\uFFFD/);
      }
      assert.ok(type.images.length > 0, `${property.slug}/${type.id}`);
      if (type.price) {
        assert.ok(type.price.amount > 0);
        assert.ok(['VND', 'USD'].includes(type.price.currency));
        assert.match(type.price.sourceUrl, /^https:\/\//);
        assert.ok(type.price.context.vi && type.price.context.en && type.price.checkedAt);
      }
    }
  }
});

test('property cards use a sourced hotel cover, independently of room galleries', async () => {
  assert.equal(Object.keys(coversByProperty).length, properties.length);
  const hashes = new Set();
  for (const room of referenceRooms) {
    const cover = coversByProperty[room.id];
    assert.ok(['exterior', 'aerial', 'entrance', 'pool', 'lobby'].includes(cover.kind), room.id);
    assert.match(cover.path, /^\/images\/property-covers\/[a-z0-9-]+\.webp$/);
    assert.match(cover.sourceUrl, /^https:\/\//);
    assert.match(cover.originalUrl, /^https:\/\//);
    assert.ok(cover.caption.vi && cover.caption.en);
    assert.equal(room.hinhAnh, cover.thumbnailPath || cover.path);
    assert.notEqual(room.hinhAnh, room.photos[0].path, 'A room-gallery cover must not silently become a hotel-card cover');
    const bytes = await fs.readFile(`public${cover.path}`);
    const info = await sharp(bytes).metadata();
    assert.equal(info.format, 'webp');
    assert.ok(info.width >= 640 && info.height >= 480);
    hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(hashes.size, properties.length, 'Different hotels must not share the same cover photo');
});

test('room category photos exist, decode and include separate source attribution', async () => {
  const publicRoot = path.resolve('public') + path.sep;
  for (const [slug, types] of Object.entries(typesByProperty)) {
    const categoryImages = new Map();
    for (const type of types) {
      assert.ok(type.images.length <= 4, `${slug}/${type.id}: keep the curated gallery to four distinct views`);
      const hashes = [];
      for (const photo of type.images) {
        assert.match(photo.path, /^\/images\/room-types\/[a-z0-9-]+\.webp$/);
        assert.match(photo.originalUrl, /^https:\/\//);
        assert.doesNotMatch(photo.originalUrl, /\/wp-content\/plugins\/|\/wp-includes\/|video_thumbnail|placeholder/i, `${slug}/${type.id}: decorative site asset is not a room photo`);
        assert.match(photo.sourceUrl, /^https:\/\//);
        const absolute = path.resolve('public', photo.path.slice(1));
        assert.ok(absolute.startsWith(publicRoot));
        const bytes = await fs.readFile(absolute);
        const info = await sharp(bytes).metadata();
        assert.equal(info.format, 'webp');
        assert.ok(info.width >= 250 && info.height >= 150, `${slug}/${type.id} image too small`);
        hashes.push(crypto.createHash('sha256').update(bytes).digest('hex'));
      }
      const key = hashes.sort().join(',');
      assert.equal(new Set(hashes).size, hashes.length, `${slug}/${type.id}: repeated image is not another camera angle`);
      const previous = categoryImages.get(key);
      if (previous) {
        assert.ok(type.sharedPhoto && previous.sharedPhoto, `${slug}: identical image sets need an explicit shared-source disclosure`);
        assert.ok(type.imageAssociation && previous.imageAssociation, `${slug}: shared images need source association evidence`);
      }
      categoryImages.set(key, type);
    }
  }
});

test('selecting an unpriced room never inherits the hotel starting rate', () => {
  const hotel = { giaTien: 99, referencePrice: { amount: 99, currency: 'USD' } };
  assert.equal(bookingOfferFor(hotel, null), hotel);
  assert.equal(bookingOfferFor(hotel, { id: 'suite', price: null }), null);
  const room = { id: 'double', price: { amount: 1200000, currency: 'VND' } };
  assert.deepEqual(priceAmounts(bookingOfferFor(hotel, room), 3), { VND: 3600000, USD: 3600000 / exchangeRate.usdToVnd });
});

test('the two currencies preserve amounts and localized room counts', () => {
  assert.equal(priceAmounts({ referencePrice: { amount: 1.25, currency: 'USD' } }, 2).VND, 2.5 * exchangeRate.usdToVnd);
  assert.match(formatCurrency(1.25, 'en', 'USD'), /1\.25/);
  assert.match(formatCurrency(1200000, 'vi', 'VND'), /1\.200\.000/);
  for (const room of referenceRooms) {
    assert.equal(room.roomTypes, typesByProperty[room.id]);
    for (const locale of ['vi', 'en']) {
      const localized = localizeRoom(room, locale);
      assert.equal(localized.tenPhong, room.tenPhong);
      assert.ok(roomSummary(localized, locale).includes(String(room.roomTypes.length)));
    }
  }
  assert.deepEqual(Object.keys(detailCopy.vi).sort(), Object.keys(detailCopy.en).sort());
  assert.deepEqual(Object.keys(roomTypeCopy.vi).sort(), Object.keys(roomTypeCopy.en).sort());
});
