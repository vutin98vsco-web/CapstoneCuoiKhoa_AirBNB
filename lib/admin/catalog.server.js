import { referenceRooms, cityNames } from '../reference-catalog.js';
import { bookingStore } from '../bookings/store.server.js';
import { priceAmounts } from '../currency.js';
export function currentCities(includeArchived = false) {
  const names = { hanoi: 'Hanoi', hcm: 'Ho Chi Minh City', dalat: 'Da Lat', danang: 'Da Nang', nhatrang: 'Nha Trang', vungtau: 'Vung Tau', phuquoc: 'Phu Quoc', hoian: 'Hoi An' };
  const map = new Map(Object.entries(cityNames).map(([id,vi]) => [id,{ id,name: { vi,en: names[id] },archived: false }]));
  for (const row of bookingStore().workspace.cityOverrides()) map.set(row.id,{ ...row.data,archived: row.archived });
  return [...map.values()].filter(city => includeArchived || !city.archived);
}
export function currentProperties(includeArchived = false) {
  const cities = currentCities(true); const map = new Map(referenceRooms.map(property => [property.id,{ ...property,archived: false }]));
  for (const row of bookingStore().workspace.propertyOverrides()) map.set(row.id,{ ...row.data,archived: row.archived,updatedAt: row.updatedAt });
  return [...map.values()].filter(property => includeArchived || !property.archived).map(property => {
    const city = cities.find(city => city.id === property.cityId);
    const roomTypes = (property.roomTypes || []).filter(room => includeArchived || !room.archived);
    const minimum = roomTypes.filter(room => room.price).sort((a,b) => priceAmounts({ referencePrice: a.price }).USD-priceAmounts({ referencePrice: b.price }).USD)[0];
    const referencePrice = property.referencePrice || minimum?.price || null;
    return { ...property,roomTypes,referencePrice,giaTien: referencePrice ? priceAmounts({ referencePrice }).USD : null,viTri: city?.name.vi || property.viTri,viTriEn: city?.name.en || property.viTriEn };
  });
}
