import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getProperty } from '../../../lib/catalog';
import Icon from '../../../components/Icon';
import BookingEstimate from '../../../components/BookingEstimate';
import PropertyGallery from '../../../components/PropertyGallery';
import PropertyActions from '../../../components/PropertyActions';
import PriceProvenance from '../../../components/PriceProvenance';
import RoomGrid from '../../../components/RoomGrid';
import RoomSelectionProvider from '../../../components/RoomSelectionProvider';
import RoomTypeList from '../../../components/RoomTypeList';
import { validDate } from '../../../lib/trip';
import { getI18n } from '../../../lib/i18n-server';
import { format, localizeRoom, roomSummary } from '../../../lib/i18n';
import { detailCopy } from '../../../lib/detail-copy';
import { destinations } from '../../../lib/rooms';
import { roomTypeCopy } from '../../../lib/room-type-copy';
import { roomCardData } from '../../../lib/room-view';
import { cookies } from 'next/headers';
import { currentUser } from '../../../lib/auth/session.server';
import { bookingStore } from '../../../lib/bookings/store.server';
import PropertyReviews from '../../../components/PropertyReviews';
import { cyberSoftCopy } from '../../../lib/cybersoft-copy';

export async function generateMetadata({ params }) {
  const { id } = await params; const { locale, t } = await getI18n();
  const raw = await getProperty(id).catch(() => null);
  if (!raw) return { title: t.detailTitle };
  const room = localizeRoom(raw, locale); return { title: room.tenPhong, description: room.moTa };
}

export default async function RoomPage({ params, searchParams }) {
  const { id } = await params;
  const { locale, t } = await getI18n();
  const rawRoom = await getProperty(id);
  if (!rawRoom) notFound();
  const catalog = await getCatalog(rawRoom.dataSource === 'api' ? 'cybersoft' : 'tnbnb');
  const room = localizeRoom(rawRoom, locale);
  const c = detailCopy[locale];
  const rc = roomTypeCopy[locale];
  const isReference = room.dataSource === 'reference';
  const cc = cyberSoftCopy[locale];
  const cityUrl = `/rooms?q=${encodeURIComponent(room.viTri)}`;
  const address = room.address?.[locale] || `${room.viTri}, ${t.country}`;
  const destination = destinations.find(item => item.id === room.cityId);
  const related = catalog.rooms.filter(item => item.cityId === room.cityId && item.id !== room.id).slice(0, 3).map(item => roomCardData(localizeRoom(item, locale)));
  const rating = room.sourceRating;
  const query = await searchParams;
  const initial = { checkin: validDate(query.checkin), checkout: validDate(query.checkout), guests: typeof query.guests === 'string' ? query.guests : '' };
  const user = (await currentUser(await cookies())); const reviews = { ...await bookingStore().workspace.reviewList(id),viewerId: user?.id || null,mine: user ? await bookingStore().workspace.ownReview(user.id,id) : null };
  return <main className="shell detail property-detail" id="main-content">
    <nav className="breadcrumb" aria-label={t.mainNav}><Link href="/">{t.home}</Link><span>/</span><Link href={cityUrl}>{room.viTri}</Link><span>/</span><span>{c.accommodation}</span></nav>
    <div className="property-title-row"><div><p className="property-kicker"><span>{c[room.category] || c.accommodation}</span>{isReference && <span><Icon name="check" size={14} />{c.verifiedSource}</span>}</p><h1>{room.tenPhong}</h1></div><PropertyActions id={room.id} name={room.tenPhong} /></div>
    <div className="property-subtitle"><a href="#location"><Icon name="pin" size={16} />{address}</a>{rating && <a href="#reviews"><Icon name="star" size={16} /><strong>{rating.score}/{rating.scale}</strong><span>{room.sourceName}</span></a>}</div>
    {!isReference && <p className="data-note">{cc.listingNote}</p>}
    <PropertyGallery images={room.photos || (room.hinhAnh ? [{ url: room.hinhAnh }] : [])} name={room.tenPhong} sourceUrl={room.sourceUrl} photoSourceLabel={!isReference ? cc.photoSource : undefined} />
    <nav className="property-section-nav" aria-label={t.detailTitle}>{['overview', ...(isReference ? ['room-types'] : []), 'amenities', 'location', 'reviews', 'policies'].map(key => <a key={key} href={`#${key}`}>{key === 'room-types' ? rc.nav : c[key]}</a>)}</nav>
    <RoomSelectionProvider roomTypes={room.roomTypes || []} initialType={typeof query.roomType === 'string' ? query.roomType : ''}>
    <div className="detail-grid property-content-grid"><div className="property-main">
      <section className="property-section" id="overview"><div className="property-overview-heading"><div><p className="eyebrow coral">{c.about}</p><h2>{format(t.stayAt, { destination: room.viTri })}</h2></div><span className="property-host-icon"><Icon name="home" size={30} /></span></div><p className="property-description">{room.moTa}</p><div className="property-facts"><div><Icon name="home" /><span>{c.accommodation}<strong>{room.tenPhong}</strong></span></div><div><Icon name="pin" /><span>{t.destination}<strong>{room.viTri}</strong></span></div><div><Icon name="shield" /><span>{c.source}<strong>{room.sourceName || 'CyberSoft'}</strong></span></div></div><p className="property-help">{isReference ? c.capacityNote : roomSummary(room, locale, true)}</p></section>
      {isReference && <RoomTypeList propertyName={room.tenPhong} />}
      <section className="property-section" id="amenities"><h2>{t.amenitiesTitle}</h2><p className="property-help">{c.listedAmenities}</p><ul className="amenities">{Object.entries(t.amenities).filter(([key]) => room[key]).map(([key, name]) => <li key={key}><Icon name={key === 'wifi' ? 'wifi' : key === 'pets' ? 'heart' : 'check'} />{name}</li>)}</ul><p className="property-help">{Object.keys(t.amenities).some(key => room[key]) ? c.amenitiesNote : c.noAmenities}</p></section>
      <section className="property-section" id="location"><h2>{c.location}</h2><p className="property-address"><Icon name="pin" size={19} />{address}</p><div className="property-location-card">{destination && <img src={destination.image} alt={destination.landmark[locale]} width="384" height="384" loading="lazy" />}<div><p className="eyebrow">{c.area}</p><h3>{room.viTri}</h3>{destination && <p>{destination.landmark[locale]}</p>}<a className="button-primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${room.tenPhong}, ${address}`)}`} target="_blank" rel="noreferrer">{c.map}<Icon name="arrow" size={17} /></a></div></div><p className="property-help">{c.addressNote}</p></section>
      <section className="property-section" id="reviews"><h2>{c.reviewsTitle}</h2>{rating && <div className="source-rating"><div className="source-rating-score"><Icon name="star" size={22} /><strong>{rating.score}</strong><span>/ {rating.scale}</span></div><div><strong>{format(c.sourceReviews, { count: new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-GB').format(rating.count) })}</strong><p>{c.ratingNote}</p></div></div>}<p className="property-help">{c.reviewsNote}</p>{room.sourceUrl && <a className="text-link source-link" href={rating?.sourceUrl || room.sourceUrl} target="_blank" rel="noreferrer">{c.readReviews} ↗</a>}</section>
      <PropertyReviews propertyId={id} initial={reviews} />
      <section className="property-section" id="policies"><h2>{c.policies}</h2><div className="property-policy-grid"><div><Icon name="calendar" /><h3>{c.checkTimes}</h3>{room.checkInAfter && room.checkOutBefore ? <><p>{c.checkInFrom}: <strong>{room.checkInAfter}</strong></p><p>{c.checkOutBy}: <strong>{room.checkOutBefore}</strong></p></> : <p>{c.checkTimesNote}</p>}</div><div><Icon name="shield" /><h3>{c.cancellation}</h3><p>{c.cancellationNote}</p></div><div><Icon name="user" /><h3>{c.occupancy}</h3><p>{c.occupancyNote}</p></div><div><Icon name="check" /><h3>{c.fees}</h3><p>{c.feesNote}</p></div></div>{room.telephone && <a className="property-phone" href={`tel:${room.telephone.replace(/[^+\d]/g, '')}`}>{c.phone}: {room.telephone}</a>}{room.sourceUrl && <a className="text-link source-link" href={room.policiesSourceUrl || room.sourceUrl} target="_blank" rel="noreferrer">{c.sourceLink} ↗</a>}</section>
      {isReference && <PriceProvenance room={room} locale={locale} />}
    </div><BookingEstimate room={{ id: room.id, giaTien: room.giaTien, referencePrice: room.referencePrice, sourceUrl: room.sourceUrl, dataSource: room.dataSource, khach: room.khach }} initial={initial} /></div>
    </RoomSelectionProvider>
    {related.length > 0 && <section className="related-properties"><div className="section-heading"><h2>{format(c.similar, { destination: room.viTri })}</h2><Link className="text-link" href={cityUrl}>{t.exploreAll}<Icon name="arrow" size={17} /></Link></div><RoomGrid rooms={related} search={new URLSearchParams(Object.entries(initial).filter(([, value]) => value)).size ? `?${new URLSearchParams(Object.entries(initial).filter(([, value]) => value))}` : ''} /></section>}
  </main>;
}
