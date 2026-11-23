import { cyberSoftId, CYBERSOFT_API_URL } from './client.js';
import { localizeLocation } from '../i18n.js';
const text = (value, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const key = value => text(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('đ', 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
const cityAliases = { hcm: ['hochiminh','tphochiminh','saigon','hcm','tphcm'], hanoi: ['hanoi','tphanoi'], danang: ['danang','tpdanang'], dalat: ['dalat','tpdalat','lamdong'], nhatrang: ['nhatrang','tpnhatrang'], vungtau: ['vungtau','tpvungtau'], phuquoc: ['phuquoc'], hoian: ['hoian'] };
export function safeImage(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : ''; } catch { return ''; } }
function count(value, min = 0) { return Number.isInteger(value) && value >= min && value <= 100 ? value : null; }
export function normalizeLocation(raw) {
  const id = cyberSoftId(raw?.id); if (!id) return null;
  const city = text(raw.tinhThanh), district = text(raw.tenViTri), country = text(raw.quocGia);
  const cityId = Object.entries(cityAliases).find(([, aliases]) => aliases.includes(key(city)) || aliases.includes(key(district)))?.[0] || `api-location-${id}`;
  return { id, cityId, name: city || district || 'Việt Nam', nameEn: localizeLocation(city || district || 'Việt Nam', 'en'), district, country, image: safeImage(raw.hinhAnh) };
}
export function normalizeCyberSoftRoom(raw, locations = [], checkedAt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())) {
  const id = cyberSoftId(raw?.id); if (!id) return null;
  const locationId = cyberSoftId(raw.maViTri), location = locations.find(item => item.id === locationId);
  const city = location?.name || 'Việt Nam', cityEn = location?.nameEn || 'Vietnam';
  const price = Number.isInteger(raw.giaTien) && raw.giaTien > 0 && raw.giaTien <= 1e9 ? raw.giaTien : null;
  const image = safeImage(raw.hinhAnh), sourceUrl = `${CYBERSOFT_API_URL}/api/phong-thue/${id}`;
  return { id: `api-${id}`, apiId: id, apiLocationId: locationId, dataSource: 'api', sourceName: 'CyberSoft', sourceUrl, category: '', cityId: location?.cityId || `api-location-${locationId || 'unknown'}`,
    tenPhong: text(raw.tenPhong, 180) || `Chỗ ở CyberSoft ${id}`, tenPhongEn: `CyberSoft stay ${id} · ${cityEn}`,
    moTa: text(raw.moTa, 5000), viTri: city, viTriEn: cityEn,
    searchText: [text(raw.tenPhong, 180), city, cityEn, location?.district, location?.country].filter(Boolean).join(' '),
    address: { vi: [location?.district, city].filter(Boolean).join(', '), en: cityEn },
    khach: count(raw.khach, 1), phongNgu: count(raw.phongNgu), giuong: count(raw.giuong), phongTam: count(raw.phongTam), giaTien: price,
    hinhAnh: image, photos: image ? [{ url: image, sourceUrl, checkedAt }] : [], roomTypes: [],
    referencePrice: price ? { amount: price, currency: 'USD', sourceUrl, checkedAt, isLive: false, context: { vi: 'Dữ liệu học tập CyberSoft, giá USD theo giao diện mẫu. Chưa kiểm tra phòng trống, thuế và phí.', en: 'CyberSoft educational data; USD as displayed by the reference app. Availability, taxes and fees are unverified.' } } : null,
    ...Object.fromEntries(['mayGiat','tivi','dieuHoa','wifi','bep','doXe','hoBoi'].map(field => [field, raw[field] === true])), banLa: raw.banLa === true || raw.banUi === true,
  };
}
