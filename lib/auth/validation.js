export function normalizeEmail(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; }
export function validEmail(value) { return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
export function validPassword(value) { return typeof value === 'string' && value.length >= 10 && value.length <= 128 && /\S/.test(value); }
export function profileValues(input) {
  const name = typeof input?.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
  const phone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  const fields = {};
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f]/.test(name)) fields.name = 'name_invalid';
  if (phone && (phone.length > 30 || !/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15)) fields.phone = 'phone_invalid';
  return { name, phone, fields };
}
export function safeReturnTo(value, fallback = '/tai-khoan') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try { const decoded = decodeURIComponent(value); if (/[\\\x00-\x20]/.test(decoded) || decoded.startsWith('//') || /^\/(?:api|dang-nhap|dang-ky|quen-mat-khau)(?:[/?#]|$)/.test(decoded)) return fallback; }
  catch { return fallback; }
  return value;
}
