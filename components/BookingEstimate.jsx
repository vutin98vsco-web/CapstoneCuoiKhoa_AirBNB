'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import DateField from './DateField';
import DualPrice from './DualPrice';
import { nextDay, countNights, todayInVietnam } from '../lib/trip';
import { useLanguage } from './LanguageProvider';
import { format, quantity } from '../lib/i18n';
import { detailCopy } from '../lib/detail-copy';
import { roomTypeCopy } from '../lib/room-type-copy';
import { useRoomSelection } from './RoomSelectionProvider';
import { bookingOfferFor } from '../lib/room-view';
import { bookingCopy } from '../lib/booking-copy';

export default function BookingEstimate({ room, initial = {} }) {
  const { locale, t } = useLanguage();
  const c = detailCopy[locale];
  const rc = roomTypeCopy[locale];
  const bc = bookingCopy[locale]; const router = useRouter();
  const selection = useRoomSelection();
  const selected = selection?.selected;
  const capacity = Math.min(100, selected?.capacity || room.khach || 12);
  const priceRoom = bookingOfferFor(room, selected);
  const isReference = room.dataSource === 'reference';
  const [arrival, setArrival] = useState(initial.checkin || '');
  const [departure, setDeparture] = useState(initial.checkout || '');
  const [guests, setGuests] = useState(Math.min(capacity, Math.max(1, Number(initial.guests) || 1)));
  const [showTotal, setShowTotal] = useState(false);
  useEffect(() => { setShowTotal(false); setGuests(current => Math.min(current, capacity)); }, [selected?.id, capacity]);
  const today = todayInVietnam();
  const nights = countNights(arrival, departure);
  const update = () => setShowTotal(false);
  return <aside className="booking-card" id="price-estimate" aria-label={isReference ? bc.checkoutTitle : t.showEstimate}>
    {selected && <div className="booking-selected-room" aria-live="polite"><p>{rc.selectedRoom}</p><strong>{selected.name[locale]}</strong><button type="button" onClick={() => selection.selectRoom('')} aria-label={rc.clear}><Icon name="close" size={16} /></button></div>}
    {isReference && <p className="booking-reference-label">{selected ? rc.roomRate : rc.propertyRate}</p>}
    {priceRoom ? <div className="booking-price"><DualPrice room={priceRoom} locale={locale} /><span>{t.perNight}</span></div> : <p className="booking-rate-unavailable">{rc.rateOnRequest}</p>}
    {isReference && !selected && <p className="booking-scope-note">{rc.propertyScope} <a href="#room-types">{rc.chooseType} ↓</a></p>}
    <p>{t.chooseTripDates}</p><form onSubmit={event => { event.preventDefault(); if (nights <= 0 || arrival < today) return; if (isReference && selected) router.push(`/dat-phong?${new URLSearchParams({ property: room.id, roomType: selected.id, checkin: arrival, checkout: departure, guests: String(guests), rooms: '1' })}`); else if (priceRoom) setShowTotal(true); }}>
    <div className="booking-dates"><div className="booking-date"><span>{t.checkin}</span><DateField name="checkin" label={t.checkinLabel} min={today} required value={arrival} onChange={value => { setArrival(value); if (departure <= value) setDeparture(''); update(); }} /></div><div className="booking-date"><span>{t.checkout}</span><DateField name="checkout" label={t.checkoutLabel} min={nextDay(arrival) || today} required value={departure} onChange={value => { setDeparture(value); update(); }} /></div></div>
    <label className="booking-guests">{isReference ? c.guestEstimate : t.guests}<select value={guests} onChange={e => { setGuests(Number(e.target.value)); update(); }}>{Array.from({ length: capacity }, (_, i) => <option key={i} value={i + 1}>{quantity(i + 1, 'guest', locale)}</option>)}</select></label>
    {isReference && <p className="booking-small-note">{selected?.capacity ? format(rc.maxGuests, { count: selected.capacity }) : c.guestEstimateNote}</p>}
    {isReference && !selected ? <a className="button-primary booking-submit" href="#room-types">{rc.chooseType}<Icon name="arrow" size={18} /></a> : <button className="button-primary booking-submit" type="submit" disabled={!isReference && !priceRoom}>{isReference ? bc.continue : t.showEstimate}<Icon name="arrow" size={18} /></button>}
  </form>
    {(showTotal || (isReference && selected)) && priceRoom && nights > 0 && <div className="estimate-total" role="status"><div><span>{quantity(nights, 'night', locale)}</span><DualPrice room={priceRoom} locale={locale} nights={nights} /></div><div className="total"><strong>{isReference ? c.estimatedTotal : t.roomTotal}</strong><DualPrice room={priceRoom} locale={locale} nights={nights} /></div><p>{isReference ? selected ? rc.taxNote : c.datesNote : format(t.estimateDisclaimer, { guests: quantity(guests, 'guest', locale) })}</p></div>}
    {isReference ? <><a className="source-booking-link" href={selected?.sourceUrl || room.sourceUrl} target="_blank" rel="noreferrer">{c.externalBooking} ↗</a><p className="booking-caption">{c.noBooking}</p><p className="booking-small-note">{selected ? priceRoom ? rc.roomPriceNote : rc.noRoomPriceNote : c.referenceNote}</p>{selected?.price && <p className="booking-small-note">{selected.price.context?.[locale]} <a href={selected.price.sourceUrl} target="_blank" rel="noreferrer">{c.source} ↗</a></p>}<a className="booking-data-link" href={selected ? `#room-${selected.id}` : '#price-source'}>{c.source} ↓</a></> : <p className="booking-caption">{t.noPayment}</p>}
  </aside>;
}
