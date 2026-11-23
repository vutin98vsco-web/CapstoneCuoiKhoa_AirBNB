import Link from 'next/link';
import { getI18n } from '../../lib/i18n-server';
import { currentProperties, currentCities } from '../../lib/admin/catalog.server';
import { detailCopy } from '../../lib/detail-copy';
import { roomTypeCopy } from '../../lib/room-type-copy';
import { format, localizeRoom, intlLocale } from '../../lib/i18n';
import { exchangeRate, formatCurrency } from '../../lib/currency';
import DualPrice from '../../components/DualPrice';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: detailCopy[locale].sourceTitle }; }
export default async function DataSourcesPage() {
  const { locale,t } = await getI18n(), c = detailCopy[locale], rc = roomTypeCopy[locale], cities = currentCities(), properties = currentProperties();
  const date = value => value ? new Intl.DateTimeFormat(intlLocale(locale),{ dateStyle: 'medium',timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${value.slice(0,10)}T12:00:00+07:00`)) : '—';
  return <main className="shell listing-page" id="main-content"><nav className="breadcrumb" aria-label={t.mainNav}><Link href="/">{t.home}</Link><span>/</span><span>{c.sourceTitle}</span></nav><h1>{c.sourceTitle}</h1><p className="sources-intro">{c.sourceIntro} {c.referenceNote}</p>
    <div className="sources-rate"><strong>{c.rate}: 1 USD = {formatCurrency(exchangeRate.usdToVnd,locale,'VND')}</strong><p>{c.rateKind} · {date(exchangeRate.asOf)} · <a href={exchangeRate.sourceUrl} target="_blank" rel="noreferrer">{exchangeRate.provider}</a></p><p>{c.rateNote}</p></div>
    <nav className="source-city-nav" aria-label={t.featuredDestinations}>{cities.map(city => <a key={city.id} href={`#${city.id}`}>{city.name[locale]}</a>)}</nav>
    {cities.map(city => {
      const rooms = properties.filter(room => room.cityId === city.id).map(room => localizeRoom(room,locale));
      return <section key={city.id} id={city.id} className="source-city"><h2>{city.name[locale]}</h2><p>{format(c.properties,{ count: rooms.length })}</p><div className="source-list">{rooms.map(room => <article className="source-record" key={room.id}><img src={room.hinhAnh} alt={room.tenPhong} width="100" height="100" loading="lazy" /><div><h3><Link href={`/phong/${room.id}`}>{room.tenPhong}</Link></h3>{room.referencePrice ? <><DualPrice room={room} locale={locale} /><p>{room.referencePrice.context[locale]}</p><p>{c.checked}: {date(room.referencePrice.checkedAt)}</p></> : <p>{rc.rateOnRequest}</p>}<div className="source-record-links"><a href={room.sourceUrl} target="_blank" rel="noreferrer">{room.sourceName}</a>{room.referencePrice && <a href={room.referencePrice.sourceUrl} target="_blank" rel="noreferrer">{c.sourcePriceContext}</a>}<a href={room.coverPhoto?.sourceUrl || room.sourceUrl} target="_blank" rel="noreferrer">{t.photoCredits}</a></div>{room.roomTypes.length > 0 && <div className="source-record-room-types"><strong>{format(rc.availableTypes,{ count: room.roomTypes.length })}</strong>{room.roomTypes.map(type => <span key={type.id}><a href={type.sourceUrl} target="_blank" rel="noreferrer">{type.name[locale]} · {type.sourceName}</a>{Array.isArray(type.evidence) && [...new Set(type.evidence.map(item => item.url || item.sourceUrl).filter(url => /^https:\/\//.test(url || '')))].map(url => <a key={url} href={url} target="_blank" rel="noreferrer">{c.source}: {new URL(url).hostname}</a>)}</span>)}</div>}</div></article>)}</div></section>;
    })}
  </main>;
}
