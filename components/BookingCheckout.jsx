'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import DateField from './DateField';
import Icon from './Icon';
import BookingPriceSummary from './BookingPriceSummary';
import { bookingCopy } from '../lib/booking-copy';
import { format } from '../lib/i18n';
import { nextDay, todayInVietnam } from '../lib/trip';
import { validateBooking } from '../lib/bookings/validation';
import { useAuth } from './AuthProvider';
import { accountCopy } from '../lib/account-copy';

export default function BookingCheckout({ offer, initial, initialUser }) {
  const { locale } = useLanguage(); const c = bookingCopy[locale]; const router = useRouter();
  const { user } = useAuth(); const a = accountCopy[locale];
  const [form, setForm] = useState({ ...initial, fullName: initialUser?.name || '', email: initialUser?.email || '', phone: initialUser?.phone || '', message: '', accepted: false });
  const [errors, setErrors] = useState({}); const [failure, setFailure] = useState(''); const [duplicateId, setDuplicateId] = useState(''); const [busy, setBusy] = useState(false);
  const requestKey = useRef(''); const notice = useRef(null); const today = todayInVietnam();
  useEffect(() => { setForm(current => ({ ...current, fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '' })); }, [user?.id]);
  const returnQuery = new URLSearchParams({ property: offer.propertyId, roomType: offer.roomTypeId, checkin: form.checkin || '', checkout: form.checkout || '', guests: String(form.guests), rooms: String(form.rooms) });
  function change(key, value) { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); setFailure(''); setDuplicateId(''); requestKey.current = ''; }
  const fieldError = key => errors[key] && <span className="checkout-field-error" id={`error-${key}`}>{c.errors[errors[key]] || c.validationSummary}</span>;
  const props = key => ({ 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `error-${key}` : undefined });
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const payload = { ...form, propertyId: offer.propertyId, roomTypeId: offer.roomTypeId, quoteVersion: offer.quoteVersion };
    const checked = validateBooking(payload, offer.capacity);
    if (Object.keys(checked.errors).length) { setErrors(checked.errors); setFailure('validation'); requestAnimationFrame(() => notice.current?.focus()); return; }
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
    setBusy(true); setFailure('');
    try {
      const session = await fetch('/api/bookings/session', { credentials: 'same-origin', cache: 'no-store' });
      if (!session.ok) throw new Error('session');
      const response = await fetch('/api/bookings', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setFailure(result.error || 'service_unavailable'); setErrors(result.fields || {}); setDuplicateId(result.existingId || ''); requestAnimationFrame(() => notice.current?.focus()); }
      else { router.push(`/dat-phong/${result.id}`); router.refresh(); }
    } catch { setFailure('network'); requestAnimationFrame(() => notice.current?.focus()); }
    finally { setBusy(false); }
  }
  return <div className="checkout-grid"><form className="checkout-form" onSubmit={submit}>
    <div className="checkout-account-note"><Icon name="user" size={20} />{user ? a.checkoutAccount : <Link href={`/dang-nhap?returnTo=${encodeURIComponent(`/dat-phong?${returnQuery}`)}`}>{a.checkoutLogin}</Link>}</div>
    <div className="checkout-selected-stay"><img src={offer.cover} alt={offer.propertyName} width="100" height="80" /><div><strong>{offer.propertyName}</strong><span>{offer.roomName[locale]}</span></div></div>
    <div className="checkout-notice"><Icon name="shield" size={23} /><p>{c.notice}</p></div>
    {failure && <div className="checkout-error-summary" role="alert" tabIndex={-1} ref={notice}>{failure === 'validation' ? c.validationSummary : c.errors[failure] || c.errors.service_unavailable}{duplicateId && <Link href={`/dat-phong/${duplicateId}`}>{c.duplicateLink} →</Link>}</div>}
    <section className="checkout-panel"><div className="checkout-section-heading"><span>1</span><h2>{c.trip}</h2></div><div className="checkout-field-grid">
      <div className="checkout-field"><span>{c.checkin}</span><DateField name="checkin" label={c.checkin} required min={today} value={form.checkin} onChange={value => { change('checkin', value); if (form.checkout && form.checkout <= value) change('checkout', ''); }} />{fieldError('checkin')}</div>
      <div className="checkout-field"><span>{c.checkout}</span><DateField name="checkout" label={c.checkout} required min={nextDay(form.checkin) || today} value={form.checkout} onChange={value => change('checkout', value)} />{fieldError('checkout')}</div>
      <label className="checkout-field">{c.rooms}<select {...props('rooms')} value={form.rooms} onChange={event => change('rooms', Number(event.target.value))}>{[1,2,3,4,5].map(count => <option key={count} value={count}>{count}</option>)}</select>{fieldError('rooms')}</label>
      <label className="checkout-field">{c.guests}<input {...props('guests')} onInvalid={event => event.currentTarget.setCustomValidity(c.errors.guests_invalid)} type="number" min="1" max="100" required value={form.guests} onChange={event => { event.currentTarget.setCustomValidity(''); change('guests', event.target.value === '' ? '' : Number(event.target.value)); }} />{fieldError('guests')}</label>
    </div><p className="checkout-help">{offer.capacity ? format(c.capacity, { count: offer.capacity }) : c.capacityUnknown}</p>{offer.occupancyNote?.[locale] && <p className="checkout-help">{offer.occupancyNote[locale]}</p>}</section>
    <section className="checkout-panel"><div className="checkout-section-heading"><span>2</span><h2>{c.contact}</h2></div><p className="checkout-help">{c.contactNote}</p><div className="checkout-contact-fields">
      <label className="checkout-field">{c.fullName}<input {...props('fullName')} onInvalid={event => event.currentTarget.setCustomValidity(c.errors.name_invalid)} name="fullName" autoComplete="name" minLength={2} maxLength={100} required value={form.fullName} onChange={event => { event.currentTarget.setCustomValidity(''); change('fullName', event.target.value); }} />{fieldError('fullName')}</label>
      <div className="checkout-field-grid"><label className="checkout-field">{c.email}<input {...props('email')} onInvalid={event => event.currentTarget.setCustomValidity(c.errors.email_invalid)} name="email" type="email" autoComplete="email" maxLength={254} required value={form.email} onChange={event => { event.currentTarget.setCustomValidity(''); change('email', event.target.value); }} />{fieldError('email')}</label><label className="checkout-field">{c.phone}<input {...props('phone')} onInvalid={event => event.currentTarget.setCustomValidity(c.errors.phone_invalid)} name="phone" type="tel" autoComplete="tel" maxLength={30} required value={form.phone} onChange={event => { event.currentTarget.setCustomValidity(''); change('phone', event.target.value); }} />{fieldError('phone')}</label></div>
      <label className="checkout-field">{c.message}<small>{c.optional}</small><textarea {...props('message')} name="message" maxLength={1000} rows={4} placeholder={c.messagePlaceholder} value={form.message} onChange={event => change('message', event.target.value)} />{fieldError('message')}</label>
    </div></section>
    <div className="checkout-consent"><label><input {...props('accepted')} type="checkbox" checked={form.accepted} onChange={event => change('accepted', event.target.checked)} /><span>{c.acknowledge}</span></label>{fieldError('accepted')}</div>
    <button className="button-primary checkout-submit" type="submit" disabled={busy}>{busy ? c.submitting : c.submit}<Icon name="arrow" size={19} /></button><p className="checkout-no-charge">{c.noCharge}</p>
  </form><BookingPriceSummary offer={offer} trip={form} locale={locale} editable /></div>;
}
