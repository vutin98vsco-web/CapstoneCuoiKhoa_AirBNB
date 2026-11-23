import 'server-only';
import { currentProperties } from './admin/catalog.server';

const API_URL = 'https://airbnbnew.cybersoft.edu.vn';

async function request(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { TokenCybersoft: process.env.CYBERSOFT_TOKEN },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`CyberSoft API: ${response.status}`);
  const result = await response.json();
  if (!Array.isArray(result.content)) throw new Error('Invalid catalog response');
  return result.content;
}

export async function getCatalog() {
  const referenceRooms = await currentProperties();
  if (!process.env.CYBERSOFT_TOKEN) return { rooms: referenceRooms, source: 'reference' };
  try {
    const [rooms, locations] = await Promise.all([request('/api/phong-thue'), request('/api/vi-tri')]);
    return {
      source: 'reference+api',
      rooms: [...referenceRooms, ...rooms.map(room => ({
        ...room,
        id: `api-${room.id}`,
        dataSource: 'api',
        category: '',
        tenPhong: String(room.tenPhong || 'Chỗ ở tại Việt Nam'),
        khach: Math.max(1, Math.min(100, Number(room.khach) || 1)),
        giaTien: Math.max(0, Number(room.giaTien) || 0),
        viTri: locations.find(location => location.id === room.maViTri)?.tinhThanh || 'Việt Nam',
        hinhAnh: /^https:\/\//.test(room.hinhAnh || '') ? room.hinhAnh : '',
      }))],
    };
  } catch {
    return { rooms: referenceRooms, source: 'fallback' };
  }
}
