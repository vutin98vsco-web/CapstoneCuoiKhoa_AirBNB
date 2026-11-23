import Link from 'next/link';
import { getI18n } from '../../lib/i18n-server';
import { currentBookingOffer as findBookingOffer } from '../../lib/bookings/offers.server';
import { bookingCopy } from '../../lib/booking-copy';
import { validDate } from '../../lib/trip';
import BookingCheckout from '../../components/BookingCheckout';
import Icon from '../../components/Icon';
import { cookies } from 'next/headers';
import { currentUser } from '../../lib/auth/session.server';
export const runtime = 'nodejs';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: bookingCopy[locale].checkoutTitle, robots: { index: false, follow: false } }; }
export default async function CheckoutPage({ searchParams }) {
  const query = await searchParams; const { locale, t } = await getI18n(); const c = bookingCopy[locale];
  const user = currentUser(await cookies());
  const offer = findBookingOffer(query.property, query.roomType);
  const initial = { checkin: validDate(query.checkin), checkout: validDate(query.checkout), guests: /^[1-9]\d?$/.test(String(query.guests)) ? Number(query.guests) : 1, rooms: /^[1-5]$/.test(String(query.rooms)) ? Number(query.rooms) : 1 };
  return <main className="booking-flow" id="main-content"><div className="shell booking-shell"><nav className="breadcrumb" aria-label={t.mainNav}><Link href="/rooms">{t.exploreStays}</Link><span>/</span><span>{c.checkoutTitle}</span></nav>
    {offer ? <><Link className="text-link booking-back" href={`/phong/${offer.propertyId}?roomType=${offer.roomTypeId}`}>← {c.back}</Link><ol className="booking-steps">{c.steps.map((step, index) => <li key={step} className={index === 1 ? 'current' : index < 1 ? 'done' : ''} aria-current={index === 1 ? 'step' : undefined}><span>{index + 1}</span>{step}</li>)}</ol><header className="booking-page-heading"><p className="eyebrow coral">{c.eyebrow}</p><h1>{c.checkoutTitle}</h1><p>{c.intro}</p></header><BookingCheckout offer={offer} initial={initial} initialUser={user} /></> : <div className="empty-state"><Icon name="home" size={42} /><h1>{c.emptyTitle}</h1><p>{c.emptyNote}</p><Link className="button-primary" href="/rooms">{c.explore}<Icon name="arrow" size={18} /></Link></div>}
  </div></main>;
}
