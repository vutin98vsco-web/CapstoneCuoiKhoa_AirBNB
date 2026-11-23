export const CYBERSOFT_API_URL = 'https://airbnbnew.cybersoft.edu.vn';
export class CyberSoftError extends Error {
  constructor(code, status = 0) { super(`CyberSoft: ${code}`); this.name = 'CyberSoftError'; this.code = code; this.status = status; }
}
export function cyberSoftId(value) {
  const text = String(value ?? '');
  return /^[1-9]\d{0,9}$/.test(text) && Number(text) <= 2147483647 ? Number(text) : null;
}
export function createCyberSoftClient({ token, fetchImpl = globalThis.fetch, timeout = 8000, revalidate = 60 } = {}) {
  const credential = typeof token === 'string' ? token.trim() : '';
  async function request(path, query = {}) {
    if (!credential) throw new CyberSoftError('not_configured');
    const url = new URL(path, CYBERSOFT_API_URL);
    for (const [key, value] of Object.entries(query)) if (value !== '' && value != null) url.searchParams.set(key, String(value));
    let response;
    try { response = await fetchImpl(url.toString(), { headers: { TokenCybersoft: credential, Accept: 'application/json' }, next: { revalidate }, redirect: 'error', signal: AbortSignal.timeout(timeout) }); }
    catch { throw new CyberSoftError('unavailable'); }
    if (!response.ok) throw new CyberSoftError(response.status === 404 ? 'not_found' : [401,403].includes(response.status) ? 'unauthorized' : response.status === 429 ? 'rate_limited' : 'unavailable', response.status);
    let result;
    try { result = await response.json(); } catch { throw new CyberSoftError('invalid_response'); }
    if (!result || typeof result !== 'object' || !Object.hasOwn(result, 'content')) throw new CyberSoftError('invalid_response');
    if (result.statusCode != null && Number(result.statusCode) !== 200) throw new CyberSoftError('invalid_response');
    return result.content;
  }
  const array = value => { if (!Array.isArray(value)) throw new CyberSoftError('invalid_response'); return value; };
  function id(value) { const result = cyberSoftId(value); if (!result) throw new CyberSoftError('invalid_id'); return result; }
  async function single(path, value) { const result = await request(`${path}/${id(value)}`); if (!result || Array.isArray(result) || typeof result !== 'object' || cyberSoftId(result.id) !== id(value)) throw new CyberSoftError('invalid_response'); return result; }
  async function page(path, { pageIndex = 1, pageSize = 20, keyword = '' } = {}) {
    if (!Number.isInteger(pageIndex) || pageIndex < 1 || pageIndex > 10000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || typeof keyword !== 'string' || keyword.length > 200) throw new CyberSoftError('invalid_query');
    const result = await request(path, { pageIndex, pageSize, keyword: keyword.trim() });
    if (!result || !Array.isArray(result.data) || !Number.isInteger(result.totalRow) || result.totalRow < 0) throw new CyberSoftError('invalid_response');
    return { items: result.data, total: result.totalRow, pageIndex, pageSize };
  }
  return {
    configured: Boolean(credential),
    rooms: async () => array(await request('/api/phong-thue')),
    room: value => single('/api/phong-thue', value),
    roomsAtLocation: async value => array(await request('/api/phong-thue/lay-phong-theo-vi-tri', { maViTri: id(value) })),
    searchRooms: options => page('/api/phong-thue/phan-trang-tim-kiem', options),
    locations: async () => array(await request('/api/vi-tri')),
    location: value => single('/api/vi-tri', value),
    searchLocations: options => page('/api/vi-tri/phan-trang-tim-kiem', options),
  };
}
