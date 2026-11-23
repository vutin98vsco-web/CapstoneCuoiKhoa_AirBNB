import Link from 'next/link';
import { bookingCopy } from '../lib/booking-copy';
import { formatCurrency, priceAmounts } from '../lib/currency';
import { countNights, displayDate } from '../lib/trip';
import { quantity } from '../lib/i18n';

export default function BookingPriceSummary({ offer, trip, locale, editable = false }) {
  const c = bookingCopy[locale]; const nights = countNights(trip.checkin, trip.checkout);
  const units = nights * (Number(trip.rooms) || 1);
  const totals = offer.totals || (offer.price && units > 0 ? priceAmounts({ referencePrice: offer.price }, units) : null);
  const nightly = offer.nightly || (offer.price ? priceAmounts({ referencePrice: offer.price }) : null);
  const primary = locale === 'vi' ? 'VND' : 'USD', secondary = primary === 'VND' ? 'USD' : 'VND';
  const prices = value => <span className="checkout-dual-price"><strong>{formatCurrency(value[primary], locale, primary)}</strong><small>≈ {formatCurrency(value[secondary], locale, secondary)}</small></span>;
  return <aside className="checkout-summary" aria-label={c.summary}>
    <img className="checkout-cover" src={offer.cover} alt={offer.propertyName} width="900" height="675" />
    <div className="checkout-summary-body"><p className="eyebrow coral">{offer.city[locale]}</p><h2>{offer.propertyName}</h2><p className="checkout-room-name">{offer.roomName[locale]}</p>
      {editable && <Link className="checkout-edit" href={`/phong/${offer.propertyId}?roomType=${offer.roomTypeId}#room-types`}>{c.editRoom} ↗</Link>}
      {offer.occupancyNote?.[locale] && <p className="checkout-help">{offer.occupancyNote[locale]}</p>}
      <div className="checkout-summary-trip"><p><span>{c.checkin}</span><strong>{displayDate(trip.checkin) || '—'}</strong></p><p><span>{c.checkout}</span><strong>{displayDate(trip.checkout) || '—'}</strong></p><p><span>{c.rooms}</span><strong>{trip.rooms || '—'}</strong></p><p><span>{c.guests}</span><strong>{trip.guests || '—'}</strong></p></div>
      <h3>{c.price}</h3>{nightly ? <><div className="checkout-price-line"><span>{c.nightly}</span>{prices(nightly)}</div>{totals ? <><p className="checkout-nights">{quantity(nights, 'night', locale)} × {trip.rooms} {c.room}</p><div className="checkout-price-line checkout-total"><strong>{c.total}</strong>{prices(totals)}</div></> : <p className="checkout-help">{c.chooseDates}</p>}<p className="checkout-help">{c.taxes}</p></> : <div className="checkout-unpriced"><strong>{c.pendingPrice}</strong><p>{c.noPrice}</p></div>}
      {offer.price?.context?.[locale] && <p className="checkout-help">{offer.price.context[locale]}</p>}
      <a className="checkout-source" href={offer.sourceUrl} target="_blank" rel="noreferrer">{c.source} ↗</a>
    </div>
  </aside>;
}
