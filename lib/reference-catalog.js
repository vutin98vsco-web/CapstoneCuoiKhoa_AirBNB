import properties from './data/properties.json' with { type: 'json' };
import photos from './data/property-images.json' with { type: 'json' };
import roomTypes from './data/room-types.json' with { type: 'json' };
import covers from './data/property-covers.json' with { type: 'json' };
import { priceAmounts } from './currency.js';

export const cityNames = {
  hcm: 'Hồ Chí Minh', dalat: 'Đà Lạt', danang: 'Đà Nẵng', hanoi: 'Hà Nội',
  nhatrang: 'Nha Trang', vungtau: 'Vũng Tàu', phuquoc: 'Phú Quốc', hoian: 'Hội An',
};
const amenityKeys = { wifi: 'wifi', pool: 'hoBoi', parking: 'doXe', spa: 'spa', pets: 'pets', airConditioning: 'dieuHoa', kitchen: 'bep', gym: 'gym', restaurant: 'restaurant', breakfast: 'breakfast', beach: 'beach', frontDesk: 'frontDesk', airportShuttle: 'airportShuttle', laundry: 'laundry' };
export const referenceRooms = properties.map(property => {
  const cover = covers[property.slug];
  const coverPhoto = ['exterior', 'aerial', 'entrance', 'pool', 'lobby'].includes(cover?.kind) ? cover : null;
  const room = {
    id: property.slug, cityId: property.city, viTri: cityNames[property.city],
    tenPhong: property.name, tenPhongEn: property.name,
    moTa: property.description.vi, moTaEn: property.description.en,
    address: property.address, area: property.area, coordinates: property.coordinates,
    khach: property.capacity, phongNgu: property.bedrooms, phongTam: null,
    roomType: property.roomType, category: property.accommodationType,
    referencePrice: property.price, sourceUrl: property.sourceUrl, sourceName: property.sourceName,
    dataSource: 'reference', stars: property.stars,
    checkInAfter: property.checkInAfter, checkOutBefore: property.checkOutBefore,
    policiesSourceUrl: property.policiesSourceUrl, telephone: property.telephone,
    sourceRating: property.sourceRating, officialWebsite: property.officialWebsite,
    photos: photos[property.slug] || property.images,
    roomTypes: roomTypes[property.slug] || [],
    coverPhoto,
    coverCaption: coverPhoto?.caption,
  };
  // Property cards represent the hotel; room/category photos stay in their galleries.
  room.hinhAnh = room.coverPhoto?.thumbnailPath || room.coverPhoto?.path || '';
  room.giaTien = priceAmounts(room).USD;
  for (const amenity of property.amenities) if (amenityKeys[amenity]) room[amenityKeys[amenity]] = true;
  return room;
});
