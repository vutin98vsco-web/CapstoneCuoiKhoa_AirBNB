'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';
import { useLanguage } from './LanguageProvider';
import { format, roomSummary } from '../lib/i18n';
import DualPrice from './DualPrice';
import useFavorites from './useFavorites';
import { detailCopy } from '../lib/detail-copy';
import { roomTypeCopy } from '../lib/room-type-copy';

export default function RoomGrid({ rooms, favoritesOnly = false, search = '' }) {
  const { locale, t } = useLanguage();
  const { favorites, ready, toggle: changeFavorite } = useFavorites();
  const c = detailCopy[locale];
  const [message, setMessage] = useState('');
  async function toggle(id) {
    setMessage(await changeFavorite(id));
  }
  const visible = favoritesOnly ? rooms.filter(room => favorites.includes(room.id)) : rooms;
  if (favoritesOnly && !ready) return <p className="empty-state" role="status">{t.loadingSaved}</p>;
  return <><span className="sr-only" role="status">{message ? t[message] : ''}</span>
    {visible.length ? <div className="room-grid">{visible.map(room => <article className="room-card" key={room.id}>
      <div className="room-image"><Link href={`/phong/${room.id}${search}`} aria-label={format(t.viewRoom, { room: room.tenPhong })}><img src={room.hinhAnh || '/images/property-unavailable.svg'} alt={room.coverCaption?.[locale] || room.tenPhong} loading="lazy" width="900" height="675" onError={e => { if (!e.currentTarget.src.endsWith('/images/property-unavailable.svg')) e.currentTarget.src = '/images/property-unavailable.svg'; }} /></Link>{(room.category || room.dataSource === 'api') && <span className="room-tag">{room.dataSource === 'api' ? 'CyberSoft' : c[room.category] || (room.category === 'nature' ? t.natureTag : room.category === 'pets' ? t.petsTag : t.privateTag)}</span>}<button className={`favorite-button ${favorites.includes(room.id) ? 'is-saved' : ''}`} aria-label={format(favorites.includes(room.id) ? t.unsaveRoom : t.saveRoom, { room: room.tenPhong })} aria-pressed={favorites.includes(room.id)} onClick={() => toggle(room.id)}><Icon name="heart" size={21} /></button></div>
      <Link href={`/phong/${room.id}${search}`} className="room-info"><div className="room-location"><strong>{room.viTri}</strong><Icon name="arrow" size={17} /></div><h3>{room.tenPhong}</h3><p>{roomSummary(room, locale)}</p><div className="room-price">{room.referencePrice || room.giaTien != null ? <><DualPrice room={room} locale={locale} /><span>{t.perNight}</span></> : <span>{roomTypeCopy[locale].rateOnRequest}</span>}</div></Link>
    </article>)}</div> : <div className="empty-state"><Icon name={favoritesOnly ? 'heart' : 'search'} size={38} /><h2>{favoritesOnly ? t.emptySavedTitle : t.emptyResultsTitle}</h2><p>{favoritesOnly ? t.emptySavedDescription : t.emptyResultsDescription}</p><Link className="button-primary" href="/rooms">{t.allStays} <Icon name="arrow" size={18} /></Link></div>}
  </>;
}
