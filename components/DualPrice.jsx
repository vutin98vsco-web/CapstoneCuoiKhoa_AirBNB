import { formatCurrency, priceAmounts } from '../lib/currency';

export default function DualPrice({ room, locale, nights = 1, className = '' }) {
  const prices = priceAmounts(room, nights);
  if (!prices) return null;
  const primary = locale === 'vi' ? 'VND' : 'USD';
  const secondary = primary === 'VND' ? 'USD' : 'VND';
  return <span className={`dual-price ${className}`}><strong>{formatCurrency(prices[primary], locale, primary)}</strong><small>≈ {formatCurrency(prices[secondary], locale, secondary)}</small></span>;
}
