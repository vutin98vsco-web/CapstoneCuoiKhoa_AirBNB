import Link from 'next/link';
import { findRooms, stayTypes } from '../../lib/rooms';
import { getCatalog } from '../../lib/catalog';
import SearchForm from '../../components/SearchForm';
import RoomGrid from '../../components/RoomGrid';
import Icon from '../../components/Icon';
import StayFilters from '../../components/StayFilters';
import { validDate } from '../../lib/trip';
import { getI18n } from '../../lib/i18n-server';
import { format, localizeLocation, localizeRoom, quantity } from '../../lib/i18n';
import { detailCopy } from '../../lib/detail-copy';
import { roomCardData } from '../../lib/room-view';
import { cyberSoftCopy } from '../../lib/cybersoft-copy';
import { cyberSoftId } from '../../lib/cybersoft/client';

export async function generateMetadata({ searchParams }) { const { t } = await getI18n(); const query = await searchParams; return { title: t.roomsPageTitle, alternates: { canonical: '/rooms' }, robots: query.favorites === '1' || Object.values(query).some(Boolean) ? { index: false, follow: true } : { index: true, follow: true } }; }

export default async function RoomsPage({ searchParams }) {
  const params = await searchParams;
  const { locale, t } = await getI18n();
  const c = detailCopy[locale];
  const cc = cyberSoftCopy[locale];
  const initial = {
    q: typeof params.q === 'string' ? localizeLocation(params.q, locale) : '',
    guests: typeof params.guests === 'string' && /^(?:[1-9]|1[0-2])$/.test(params.guests) ? params.guests : '',
    checkin: validDate(params.checkin), checkout: validDate(params.checkout),
    type: stayTypes.some(type => type.id === params.type) ? params.type : '',
    maxPrice: ['50', '75', '100', '150', '200', '300', '500'].includes(params.maxPrice) ? params.maxPrice : '',
    roomCategory: ['room', 'suite', 'apartment', 'villa'].includes(params.roomCategory) ? params.roomCategory : '',
    amenity: ['wifi', 'bep', 'hoBoi', 'dieuHoa'].includes(params.amenity) ? params.amenity : '',
    favorites: params.favorites === '1' ? '1' : '',
    source: ['tnbnb','cybersoft'].includes(params.source) ? params.source : '',
    location: params.source !== 'tnbnb' && cyberSoftId(params.location) ? String(cyberSoftId(params.location)) : '',
  };
  if (initial.source === 'cybersoft') { initial.type = ''; initial.roomCategory = ''; }
  const category = initial.type;
  const favoritesOnly = params.favorites === '1';
  const catalog = await getCatalog(initial.source, initial.location);
  const rooms = findRooms(initial.q, initial.guests, category, catalog.rooms, initial).map(room => roomCardData(localizeRoom(room, locale)));
  const dates = new URLSearchParams(Object.entries(initial).filter(([key, value]) => ['guests', 'checkin', 'checkout'].includes(key) && value));
  const title = favoritesOnly ? t.favoritesTitle : initial.q ? format(t.destinationTitle, { destination: initial.q }) : t.listingTitle;
  const summary = favoritesOnly ? t.favoritesDescription : format(initial.guests ? t.resultsGuests : t.results, { stays: quantity(rooms.length, 'stay', locale), guests: quantity(Number(initial.guests), 'guest', locale) });
  return <main className="listing-layout" id="main-content">
    {!favoritesOnly && <section className="results-hero" aria-labelledby="results-heading"><img src="/images/results-hero.webp" alt="" width="1600" height="1067" /><div className="results-hero-shade" /><div className="shell"><h1 id="results-heading">{title}</h1></div></section>}
    <div className={`shell listing-page ${favoritesOnly ? '' : 'listing-below-banner'}`}>
    <div className="breadcrumb"><Link href="/">{t.home}</Link><span>/</span><span>{favoritesOnly ? t.favorites : t.roomsPageTitle}</span></div>
    {favoritesOnly && <div className="listing-heading"><div><p className="eyebrow coral">{t.listingEyebrow}</p><h1>{title}</h1><p>{summary}</p></div><span className="listing-symbol"><Icon name="heart" size={40} /></span></div>}
    <SearchForm key={JSON.stringify(initial)} initial={initial} compact formId="results-stay-search" />
    <StayFilters key={`filters-${JSON.stringify(initial)}`} locale={locale} initial={initial} searchFormId="results-stay-search" catalogSources locations={catalog.locations} />
    {!favoritesOnly && <p className="results-summary">{summary}</p>}
    <p className="data-note">{catalog.apiStatus === 'ready' ? initial.source === 'cybersoft' || initial.location ? cc.apiOnly : cc.mixed : initial.source === 'cybersoft' || catalog.source === 'fallback' ? cc[catalog.apiStatus] || cc.unavailable : c.sourceCatalog} {t.availabilityNote} <Link href="/data-sources">{c.sourceTitle} ↗</Link></p>
    <RoomGrid rooms={rooms} favoritesOnly={favoritesOnly} search={dates.size ? `?${dates}` : ''} />
    </div>
  </main>;
}
