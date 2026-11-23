'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { bookingCopy } from '../lib/booking-copy';
import Icon from './Icon';
export default function BookingCancel({ id }) {
  const { locale } = useLanguage(); const c = bookingCopy[locale]; const router = useRouter();
  const dialog = useRef(null); const button = useRef(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function cancel() {
    if (busy) return; setBusy(true); setError('');
    try { const response = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST', credentials: 'same-origin' }); const result = await response.json(); if (!response.ok) setError(c.errors[result.error] || c.errors.service_unavailable); else { dialog.current?.close(); router.refresh(); } }
    catch { setError(c.errors.network); } finally { setBusy(false); }
  }
  return <><button type="button" className="booking-cancel-button" ref={button} onClick={() => { setError(''); dialog.current.showModal(); }}>{c.cancel}</button><dialog className="booking-cancel-dialog" ref={dialog} aria-labelledby="cancel-title" onClose={() => button.current?.focus()}><Icon name="shield" size={30} /><h2 id="cancel-title">{c.cancelTitle}</h2><p>{c.cancelNote}</p>{error && <p className="checkout-field-error" role="alert">{error}</p>}<div><button type="button" className="button-white" disabled={busy} onClick={() => dialog.current.close()} autoFocus>{c.keep}</button><button type="button" className="button-primary" disabled={busy} onClick={cancel}>{busy ? c.cancelling : c.confirmCancel}</button></div></dialog></>;
}
