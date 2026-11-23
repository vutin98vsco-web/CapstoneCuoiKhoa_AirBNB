import { detailCopy } from '../lib/detail-copy';
import { exchangeRate, formatCurrency } from '../lib/currency';
import { intlLocale } from '../lib/i18n';
import DualPrice from './DualPrice';
import { roomTypeCopy } from '../lib/room-type-copy';

export default function PriceProvenance({ room, locale }) {
  const c = detailCopy[locale];
  const price = room.referencePrice;
  if (!price) return <div className="price-provenance" id="price-source"><h3>{roomTypeCopy[locale].rateOnRequest}</h3><p>{c.referenceNote}</p><a href={room.sourceUrl} target="_blank" rel="noreferrer">{c.sourceLink}</a></div>;
  const date = value => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value.length === 10 ? `${value}T12:00:00+07:00` : value));
  return <div className="price-provenance" id="price-source"><div className="provenance-heading"><span className="eyebrow coral">{c.source}</span><a href="/data-sources">{c.sourceTitle} ↗</a></div><h3>{c.roomOffer}</h3><DualPrice room={room} locale={locale} /><p>{price.context[locale]}</p><dl><div><dt>{c.checked}</dt><dd>{date(price.checkedAt)}</dd></div><div><dt>{c.sourcePriceContext}</dt><dd><a href={price.sourceUrl} target="_blank" rel="noreferrer">{room.sourceName} ↗</a></dd></div><div><dt>{c.rate}</dt><dd>1 USD = {formatCurrency(exchangeRate.usdToVnd, locale, 'VND')}</dd></div><div><dt>{c.rateKind}</dt><dd>{date(exchangeRate.asOf)} · <a href={exchangeRate.sourceUrl} target="_blank" rel="noreferrer">{exchangeRate.provider} ↗</a></dd></div></dl><p className="provenance-note">{c.rateNote}</p></div>;
}
