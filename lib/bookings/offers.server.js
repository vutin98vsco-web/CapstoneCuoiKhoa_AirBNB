import { createHash } from 'node:crypto';
import { referenceRooms } from '../reference-catalog.js';
import { localizeLocation } from '../i18n.js';
import { exchangeRate, priceAmounts } from '../currency.js';
import { currentProperties } from '../admin/catalog.server.js';

export async function currentBookingOffer(propertyId, roomTypeId) { return findBookingOffer(propertyId,roomTypeId,await currentProperties()); }

export function findBookingOffer(propertyId, roomTypeId, rooms = referenceRooms) {
  if (typeof propertyId !== 'string' || typeof roomTypeId !== 'string') return null;
  const property = rooms.find(room => room.id === propertyId);
  const type = property?.roomTypes.find(room => room.id === roomTypeId);
  if (!property || !type) return null;
  const price = type.price || null;
  const quoteVersion = createHash('sha256').update(JSON.stringify({ propertyId, roomTypeId, price, fx: exchangeRate.usdToVnd })).digest('hex');
  return { propertyId, roomTypeId, propertyName: property.tenPhong, roomName: type.name,
    city: { vi: localizeLocation(property.viTri, 'vi'), en: localizeLocation(property.viTri, 'en') },
    address: property.address, cover: property.hinhAnh, roomPhoto: type.images[0]?.path,
    capacity: type.capacity || null, occupancyNote: type.occupancyNote || null, areaM2: type.areaM2 || null, beds: type.beds || null,
    price, quoteVersion, sourceUrl: type.sourceUrl, propertySourceUrl: property.sourceUrl,
    telephone: property.telephone || null, checkInAfter: property.checkInAfter || null, checkOutBefore: property.checkOutBefore || null,
  };
}

export function makeBookingSnapshot(offer, trip) {
  const units = trip.nights * trip.rooms;
  return { ...offer, totals: offer.price ? priceAmounts({ referencePrice: offer.price }, units) : null,
    nightly: offer.price ? priceAmounts({ referencePrice: offer.price }) : null,
    exchangeRate: { usdToVnd: exchangeRate.usdToVnd, asOf: exchangeRate.asOf, sourceUrl: exchangeRate.sourceUrl },
  };
}
