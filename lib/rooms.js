import { localizeRoom } from './i18n.js';
import { destinationSources } from './destination-sources.js';
import { referenceRooms } from './reference-catalog.js';

export const demoRooms = [
  { id: 1, tenPhong: 'Căn hộ có ban công tại Quận 1', viTri: 'TP. Hồ Chí Minh', giaTien: 48, khach: 2, phongNgu: 1, phongTam: 1, moTa: 'Căn hộ có bếp riêng và bàn làm việc, thuận tiện để khám phá trung tâm thành phố.', wifi: true, dieuHoa: true, bep: true },
  { id: 2, tenPhong: 'Cabin bên đồi thông', viTri: 'Đà Lạt', giaTien: 65, khach: 4, phongNgu: 2, phongTam: 1, moTa: 'Cabin hai phòng ngủ dành cho nhóm bạn hoặc gia đình.', wifi: true, bep: true },
  { id: 3, tenPhong: 'Căn hộ gần biển Mỹ Khê', viTri: 'Đà Nẵng', giaTien: 72, khach: 4, phongNgu: 2, phongTam: 2, moTa: 'Căn hộ gần biển với hồ bơi, bếp và hai phòng ngủ.', wifi: true, dieuHoa: true, hoBoi: true, bep: true },
];

export function normalize(value) {
  return String(value ?? '').toLocaleLowerCase('vi').normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').replaceAll('đ', 'd').trim();
}

export function findRooms(query, guests, category = '', rooms = referenceRooms, filters = {}) {
  const keyword = normalize(query);
  const minimum = Number(guests);
  return rooms.filter(room => {
    const source = { ...room, isDemo: room.isDemo || rooms === demoRooms };
    return [room, localizeRoom(source, 'vi'), localizeRoom(source, 'en')].some(item => normalize(item.tenPhong + ' ' + item.viTri).includes(keyword)) &&
      (!(minimum > 0) || room.khach == null || room.khach >= minimum) && (!category || (['beach', 'spa', 'pets'].includes(category) ? Boolean(room[category]) : room.category === category)) &&
      (!filters.roomCategory || room.roomTypes?.some(type => type.category === filters.roomCategory)) &&
      (!(Number(filters.maxPrice) > 0) || Number.isFinite(room.giaTien) && room.giaTien <= Number(filters.maxPrice)) &&
      (!(Number(filters.bedrooms) > 0) || room.phongNgu >= Number(filters.bedrooms)) &&
      (!['wifi', 'bep', 'hoBoi', 'dieuHoa'].includes(filters.amenity) || Boolean(room[filters.amenity]));
  });
}

export function getRoom(id) {
  return referenceRooms.find((room) => String(room.id) === id);
}

export const amenities = {
  wifi: 'Wi-Fi', dieuHoa: 'Điều hòa', bep: 'Bếp riêng', hoBoi: 'Hồ bơi', mayGiat: 'Máy giặt', banLa: 'Bàn là', tivi: 'TV', doXe: 'Chỗ đỗ xe',
};

export const destinations = [
  { id: 'hcm', name: 'Hồ Chí Minh', image: '/images/destinations/hcm.webp', landmark: { vi: 'Chợ Bến Thành', en: 'Ben Thanh Market' }, photo: destinationSources.hcm },
  { id: 'dalat', name: 'Đà Lạt', image: '/images/destinations/dalat.webp', landmark: { vi: 'Quảng trường Lâm Viên', en: 'Lam Vien Square' }, photo: destinationSources.dalat },
  { id: 'danang', name: 'Đà Nẵng', image: '/images/destinations/danang.webp', landmark: { vi: 'Cầu Rồng', en: 'Dragon Bridge' }, photo: destinationSources.danang },
  { id: 'hanoi', name: 'Hà Nội', image: '/images/destinations/hanoi.webp', landmark: { vi: 'Tháp Rùa, hồ Hoàn Kiếm', en: 'Turtle Tower, Hoan Kiem Lake' }, photo: destinationSources.hanoi },
  { id: 'nhatrang', name: 'Nha Trang', image: '/images/destinations/nhatrang.webp', landmark: { vi: 'Tháp Bà Ponagar', en: 'Po Nagar Cham Towers' }, photo: destinationSources.nhatrang },
  { id: 'vungtau', name: 'Vũng Tàu', image: '/images/destinations/vungtau.webp', landmark: { vi: 'Tượng Chúa Kitô Vua', en: 'Christ the King statue' }, photo: destinationSources.vungtau },
  { id: 'phuquoc', name: 'Phú Quốc', image: '/images/destinations/phuquoc.webp', landmark: { vi: 'Bãi Sao', en: 'Sao Beach' }, photo: destinationSources.phuquoc },
  { id: 'hoian', name: 'Hội An', image: '/images/destinations/hoian.webp', landmark: { vi: 'Chùa Cầu', en: 'Japanese Covered Bridge' }, photo: destinationSources.hoian },
];

export const stayTypes = [
  { id: 'hotel', image: referenceRooms.find(room => room.cityId === 'hcm')?.hinhAnh },
  { id: 'beach', image: referenceRooms.find(room => room.beach)?.hinhAnh },
  { id: 'spa', image: referenceRooms.find(room => room.spa)?.hinhAnh },
  { id: 'pets', image: referenceRooms.find(room => room.pets)?.hinhAnh },
];

const roomExtras = [
  { category: 'home', hinhAnh: '/images/stay-1.jpg' },
  { category: 'nature', hinhAnh: '/images/stay-3.jpg' },
  { category: 'home', hinhAnh: '/images/stay-1.jpg' },
];
demoRooms.forEach((room, index) => Object.assign(room, roomExtras[index]));
demoRooms.push(
  { id: 4, tenPhong: 'Ngôi nhà nhỏ giữa phố cổ', viTri: 'Hà Nội', giaTien: 52, khach: 2, phongNgu: 1, phongTam: 1, moTa: 'Khám phá Hà Nội từ một ngôi nhà nhỏ có sân trong, gần những con phố cổ, quán cà phê và hàng ăn địa phương.', wifi: true, dieuHoa: true, bep: true, category: 'unique', hinhAnh: '/images/stay-2.jpg' },
  { id: 5, tenPhong: 'Nhà vườn đón gió biển', viTri: 'Nha Trang', giaTien: 85, khach: 6, phongNgu: 3, phongTam: 2, moTa: 'Ngôi nhà với khu vườn riêng dành cho cả gia đình. Bạn có thể mang theo thú cưng và tận hưởng những buổi chiều thư thái bên biển.', wifi: true, dieuHoa: true, bep: true, hoBoi: true, category: 'pets', hinhAnh: '/images/stay-4.jpg' },
  { id: 6, tenPhong: 'Bungalow giữa vườn xanh', viTri: 'Phú Quốc', giaTien: 79, khach: 3, phongNgu: 1, phongTam: 1, moTa: 'Bungalow riêng tư nằm giữa khu vườn nhiệt đới, có hiên ngồi đọc sách và lối đi bộ ra biển. Không gian dành cho những ngày nghỉ thật chậm.', wifi: true, dieuHoa: true, hoBoi: true, category: 'nature', hinhAnh: '/images/stay-3.jpg' },
  { id: 7, tenPhong: 'Căn nhà nghỉ cuối tuần bên biển', viTri: 'Vũng Tàu', giaTien: 95, khach: 8, phongNgu: 4, phongTam: 3, moTa: 'Căn nhà rộng rãi cho những cuộc gặp gỡ cuối tuần. Bếp lớn, phòng khách chung và sân nhỏ dành cho những bữa ăn cùng bạn bè.', wifi: true, dieuHoa: true, bep: true, category: 'home', hinhAnh: '/images/stay-1.jpg' },
  { id: 8, tenPhong: 'Nhà nhỏ bên dòng sông Hoài', viTri: 'Hội An', giaTien: 58, khach: 4, phongNgu: 2, phongTam: 1, moTa: 'Căn nhà nhỏ mang nét mộc mạc của Hội An, có sân vườn và những góc nghỉ ngơi yên tĩnh. Thú cưng được chào đón trong chuyến đi của bạn.', wifi: true, dieuHoa: true, bep: true, category: 'pets', hinhAnh: '/images/stay-4.jpg' },
);
