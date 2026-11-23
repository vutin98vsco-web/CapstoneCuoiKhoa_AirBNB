import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getI18n } from '../../../lib/i18n-server';
import { bookingCopy } from '../../../lib/booking-copy';
import { bookingStore } from '../../../lib/bookings/store.server';
import { bookingOwner, currentUser } from '../../../lib/auth/session.server';
import { accountCopy } from '../../../lib/account-copy';
import { intlLocale } from '../../../lib/i18n';
import { displayDate } from '../../../lib/trip';
import BookingPriceSummary from '../../../components/BookingPriceSummary';
import BookingCancel from '../../../components/BookingCancel';
import Icon from '../../../components/Icon';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: bookingCopy[locale].receiptTitle, robots: { index: false, follow: false } }; }
export default async function BookingReceipt({ params }) {
  const { id } = await params; const jar = await cookies(); const owner = bookingOwner(jar);
  if (!owner) notFound(); const booking = bookingStore().get(owner, id); if (!booking) notFound();
  const { locale } = await getI18n(); const c = bookingCopy[locale]; const cancelled = booking.status === 'cancelled';
  return <main className="booking-flow" id="main-content"><div className="shell booking-shell"><Link className="text-link booking-back" href="/chuyen-di">← {c.myTrips}</Link>
    <header className={`booking-receipt-heading ${cancelled ? 'receipt-cancelled' : ''}`}><span className="receipt-icon"><Icon name={cancelled ? 'close' : 'check'} size={32} /></span><div><p className="eyebrow coral">TNbnb · {c.receiptTitle}</p><h1>{cancelled ? c.cancelledTitle : c.savedTitle}</h1><p>{cancelled ? c.cancelledNote : c.savedNote}</p></div></header>
    <div className="checkout-grid"><div><section className="checkout-panel"><div className="receipt-reference"><div><span>{c.reference}</span><strong>{booking.reference}</strong></div><span className={`booking-status ${cancelled ? 'cancelled' : ''}`}>{cancelled ? c.cancelled : c.pending}</span></div><dl className="receipt-facts"><div><dt>{c.created}</dt><dd>{new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(booking.createdAt))}</dd></div><div><dt>{c.checkin}</dt><dd>{displayDate(booking.checkin)}{booking.snapshot.checkInAfter && ` · ${booking.snapshot.checkInAfter}`}</dd></div><div><dt>{c.checkout}</dt><dd>{displayDate(booking.checkout)}{booking.snapshot.checkOutBefore && ` · ${booking.snapshot.checkOutBefore}`}</dd></div></dl></section>
      <section className="checkout-panel"><div className="checkout-section-heading"><Icon name="user" /><h2>{c.contact}</h2></div><dl className="receipt-facts"><div><dt>{c.fullName}</dt><dd>{booking.fullName}</dd></div><div><dt>{c.email}</dt><dd>{booking.email}</dd></div><div><dt>{c.phone}</dt><dd>{booking.phone}</dd></div></dl>{booking.message && <div className="receipt-message"><h3>{c.message}</h3><p>{booking.message}</p></div>}</section>
      <section className="checkout-panel receipt-next"><Icon name="shield" size={26} /><h2>{c.next}</h2><p>{c.notice}</p><p>{c.nextNote}</p><a className="button-primary" href={booking.snapshot.sourceUrl} target="_blank" rel="noreferrer">{c.source} ↗</a></section>
      <div className="receipt-actions"><Link className="button-white" href="/chuyen-di">{c.myTrips}</Link>{!cancelled && <BookingCancel id={booking.id} />}</div><p className="checkout-help receipt-session-note">{currentUser(jar) ? accountCopy[locale].syncedTrips : c.sessionNote}</p>
    </div><BookingPriceSummary offer={booking.snapshot} trip={booking} locale={locale} /></div>
  </div></main>;
}
