'use client';

import { useState } from 'react';
import Icon from './Icon';
import DateField from './DateField';
import { nextDay, todayInVietnam } from '../lib/trip';
import { useLanguage } from './LanguageProvider';
import { localizeLocation, quantity } from '../lib/i18n';

export default function SearchForm({ initial = {}, compact = false, formId }) {
  const { locale, t } = useLanguage();
  const [arrival, setArrival] = useState(initial.checkin || '');
  const [departure, setDeparture] = useState(initial.checkout || '');
  const today = todayInVietnam();
  return <form id={formId} action="/rooms" className={`search-form ${compact ? 'search-compact' : ''}`}>
    {(formId ? ['favorites'] : ['type', 'maxPrice', 'roomCategory', 'amenity', 'favorites']).map(key => initial[key] ? <input key={key} type="hidden" name={key} value={initial[key]} /> : null)}
    <label className="search-location"><span><Icon name="pin" size={17} /> {t.destination}</span><input name="q" aria-label={t.destinationLabel} placeholder={t.destinationPlaceholder} defaultValue={initial.q || ''} list="destinations-list" autoComplete="off" /></label>
    <datalist id="destinations-list">{['Hồ Chí Minh','Đà Lạt','Đà Nẵng','Hà Nội','Nha Trang','Phú Quốc','Vũng Tàu','Hội An'].map(x => <option key={x} value={localizeLocation(x, locale)} />)}</datalist>
    <div className="search-date"><span>{t.checkin}</span><DateField name="checkin" label={t.checkinLabel} min={today} value={arrival} required={Boolean(departure)} onChange={value => { setArrival(value); if (departure && value >= departure) setDeparture(''); }} /></div>
    <div className="search-date"><span>{t.checkout}</span><DateField name="checkout" label={t.checkoutLabel} min={nextDay(arrival) || today} value={departure} required={Boolean(arrival)} onChange={setDeparture} /></div>
    <label className="search-guests"><span>{t.guests}</span><select name="guests" aria-label={t.guestCount} defaultValue={initial.guests || ''}><option value="">{t.addGuests}</option>{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{quantity(i + 1, 'guest', locale)}</option>)}</select></label>
    <button type="submit" className="search-submit" aria-label={t.searchLabel}><Icon name="search" size={23} /><span>{t.search}</span></button>
  </form>;
}
