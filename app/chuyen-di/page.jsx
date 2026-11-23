import Link from 'next/link';
import { cookies } from 'next/headers';
import { getI18n } from '../../lib/i18n-server';
import { bookingCopy } from '../../lib/booking-copy';
import { bookingStore } from '../../lib/bookings/store.server';
import { bookingOwner, currentUser } from '../../lib/auth/session.server';
import { accountCopy } from '../../lib/account-copy';
import { displayDate, todayInVietnam } from '../../lib/trip';
import { formatCurrency } from '../../lib/currency';
import Icon from '../../components/Icon';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: bookingCopy[locale].tripsTitle, robots: { index: false, follow: false } }; }
export default async function TripsPage({ searchParams }) {
  const { locale } = await getI18n(); const c = bookingCopy[locale]; const query = await searchParams;
  const jar = await cookies(); const user = currentUser(jar); const owner = bookingOwner(jar);
  const bookings = owner ? bookingStore().list(owner) : []; const today = todayInVietnam();
  const groups = { all: bookings, upcoming: bookings.filter(booking => booking.status === 'pending' && booking.checkout > today), past: bookings.filter(booking => booking.status === 'pending' && booking.checkout <= today), cancelled: bookings.filter(booking => booking.status === 'cancelled') };
  const tab = ['upcoming', 'past', 'cancelled'].includes(query.tab) ? query.tab : 'all';
  return <main className="booking-flow" id="main-content"><div className="shell booking-shell"><header className="booking-page-heading"><p className="eyebrow coral">TNbnb</p><h1>{c.tripsTitle}</h1><p>{c.tripsIntro}</p></header><p className="trips-session-note"><Icon name="shield" size={17} />{user ? accountCopy[locale].syncedTrips : c.sessionNote}{!user && <Link href="/dang-nhap?returnTo=%2Fchuyen-di">{accountCopy[locale].login}</Link>}</p>
    <nav className="trip-tabs" aria-label={c.tripsTitle}>{Object.entries(groups).map(([key, values]) => <Link key={key} href={key === 'all' ? '/chuyen-di' : `/chuyen-di?tab=${key}`} className={tab === key ? 'selected' : ''} aria-current={tab === key ? 'page' : undefined}>{key === 'cancelled' ? c.cancelledTab : c[key]}<span>{values.length}</span></Link>)}</nav>
    {groups[tab].length ? <div className="trip-card-list">{groups[tab].map(booking => <article className="trip-card" key={booking.id}><Link href={`/dat-phong/${booking.id}`} className="trip-card-image"><img src={booking.snapshot.cover} alt={booking.snapshot.propertyName} width="900" height="675" /></Link><div className="trip-card-content"><div className="trip-card-top"><p className="eyebrow">{booking.snapshot.city[locale]}</p><span className={`booking-status ${booking.status === 'cancelled' ? 'cancelled' : ''}`}>{booking.status === 'cancelled' ? c.cancelled : c.pending}</span></div><h2><Link href={`/dat-phong/${booking.id}`}>{booking.snapshot.propertyName}</Link></h2><p className="checkout-room-name">{booking.snapshot.roomName[locale]}</p><div className="trip-card-dates"><Icon name="calendar" size={17} /><span>{displayDate(booking.checkin)} → {displayDate(booking.checkout)}</span></div><p className="trip-card-details">{c.rooms}: {booking.rooms} · {c.guests}: {booking.guests}</p><div className="trip-card-bottom"><div><span>{c.reference}: {booking.reference}</span>{booking.snapshot.totals ? <strong>{formatCurrency(booking.snapshot.totals[locale === 'vi' ? 'VND' : 'USD'], locale, locale === 'vi' ? 'VND' : 'USD')}</strong> : <strong>{c.pendingPrice}</strong>}</div><Link className="button-primary" href={`/dat-phong/${booking.id}`}>{c.view}<Icon name="arrow" size={17} /></Link></div></div></article>)}</div> : <div className="empty-state"><Icon name="calendar" size={40} /><h2>{bookings.length ? c.noMatches : c.noTrips}</h2><p>{c.noTripsNote}</p><Link className="button-primary" href="/rooms">{c.explore}<Icon name="arrow" size={17} /></Link></div>}
  </div></main>;
}
