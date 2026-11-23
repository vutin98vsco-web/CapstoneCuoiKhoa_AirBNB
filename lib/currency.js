// Reference snapshot; never presented as a live transaction rate.
export const exchangeRate = {
  usdToVnd: 25900,
  asOf: '2026-11-18T00:05:02+07:00',
  checkedAt: '2026-11-18',
  provider: 'Vietcombank',
  kind: 'sell',
  sourceUrl: 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx',
  pageUrl: 'https://www.vietcombank.com.vn/KHCN/Cong-cu-tien-ich/Ty-gia/',
};

export function priceAmounts(room, nights = 1) {
  if (room.referencePrice?.amount == null && room.giaTien == null) return null;
  const amount = Number(room.referencePrice?.amount ?? room.giaTien);
  const currency = room.referencePrice?.currency || 'USD';
  const count = Number.isFinite(nights) && nights > 0 ? nights : 0;
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (!['USD', 'VND'].includes(currency)) return null;
  const total = amount * count;
  return currency === 'VND' ? { USD: total / exchangeRate.usdToVnd, VND: total } : { USD: total, VND: total * exchangeRate.usdToVnd };
}

export function formatCurrency(amount, locale, currency) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'vi-VN', {
    style: 'currency', currency, currencyDisplay: 'code',
    minimumFractionDigits: 0, maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);
}
