export function displayDate(value) { return validDate(value) ? value.split('-').reverse().join('/') : ''; }
export function parseDate(value) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? validDate(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`) : '';
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) > 9998) return '';
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

export function nextDay(value) {
  if (!validDate(value)) return '';
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function countNights(arrival, departure) {
  if (!validDate(arrival) || !validDate(departure)) return 0;
  return Math.max(0, Math.round((Date.parse(departure) - Date.parse(arrival)) / 86400000));
}

export function todayInVietnam() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}
