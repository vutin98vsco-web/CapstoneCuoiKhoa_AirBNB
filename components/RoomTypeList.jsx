'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { useRoomSelection } from './RoomSelectionProvider';
import { roomTypeCopy } from '../lib/room-type-copy';
import { format } from '../lib/i18n';
import PropertyGallery from './PropertyGallery';
import DualPrice from './DualPrice';
import Icon from './Icon';

export default function RoomTypeList({ propertyName }) {
  const { locale } = useLanguage(); const c = roomTypeCopy[locale];
  const selection = useRoomSelection(); const [filter, setFilter] = useState('all');
  const roomTypes = selection?.roomTypes || [];
  const categories = [...new Set(roomTypes.map(type => type.category))];
  const visible = filter === 'all' ? roomTypes : roomTypes.filter(type => type.category === filter);
  return <section className="property-section room-types-section" id="room-types" aria-labelledby="room-types-title">
    <div className="room-types-heading"><div><p className="eyebrow coral">{c.nav}</p><h2 id="room-types-title">{c.title}</h2></div><span>{format(c.availableTypes, { count: roomTypes.length })}</span></div>
    <p className="property-help">{c.intro}</p>
    {categories.length > 1 && <div className="room-category-filters" role="group" aria-label={c.nav}>{['all', ...categories].map(category => <button type="button" key={category} aria-pressed={filter === category} className={filter === category ? 'selected' : ''} onClick={() => setFilter(category)}>{category === 'all' ? c.all : c.category[category]}</button>)}</div>}
    <div className="room-type-list">{visible.map(type => {
      const isSelected = selection.selected?.id === type.id;
      return <article key={type.id} className={`room-type-card ${isSelected ? 'room-type-selected' : ''}`} id={`room-${type.id}`}>
        <PropertyGallery images={type.images} name={`${propertyName} · ${type.name[locale]}`} sourceUrl={type.sourceUrl} variant="room" photoSourceLabel={c.photoSource} />
        <div className="room-type-content"><div className="room-type-title"><span>{c.category[type.category]}</span><h3>{type.name[locale]}</h3></div>
          <p className="room-type-description">{type.description[locale]}</p>
          {type.sharedPhoto && <p className="room-shared-photo">{c.sharedPhoto}</p>}
          <ul className="room-type-specs">
            {type.areaM2 > 0 && <li><Icon name="grid" size={16} /><span>{c.area}: <strong>{type.areaM2} m²</strong></span></li>}
            {type.capacity > 0 && <li><Icon name="user" size={16} /><span>{format(c.maxGuests, { count: type.capacity })}</span></li>}
            {type.beds?.[locale] && <li><Icon name="bed" size={16} /><span>{type.beds[locale]}</span></li>}
            {type.view?.[locale] && <li><Icon name="pin" size={16} /><span>{type.view[locale]}</span></li>}
          </ul>
          {type.occupancyNote?.[locale] && <p className="property-help">{type.occupancyNote[locale]}</p>}
          <div className="room-type-source"><a href={type.sourceUrl} target="_blank" rel="noreferrer">{c.source}: {type.sourceName} ↗</a></div>
          {Array.isArray(type.evidence) && <div className="room-type-evidence">{[...new Map(type.evidence.filter(item => /^https:\/\//.test(item.url || item.sourceUrl || '')).map(item => [item.url || item.sourceUrl,item])).values()].map(item => <a key={item.url || item.sourceUrl} href={item.url || item.sourceUrl} target="_blank" rel="noreferrer">{c.source}: {new URL(item.url || item.sourceUrl).hostname} · {item.checkedAt}</a>)}</div>}
          <div className="room-type-bottom"><div>{type.price ? <><span className="room-type-rate-label">{c.roomRate}</span><DualPrice room={{ referencePrice: type.price }} locale={locale} /></> : <p className="room-type-unpriced">{c.rateOnRequest}</p>}</div><button type="button" className={isSelected ? 'room-selected-button' : 'button-primary'} aria-pressed={isSelected} onClick={() => selection.selectRoom(type.id, true)}>{isSelected ? <><Icon name="check" size={16} />{c.selected}</> : <>{c.select}<Icon name="arrow" size={16} /></>}</button></div>
        </div>
      </article>;
    })}</div>
    {!roomTypes.length && <p className="property-help">{c.noTypes}</p>}
  </section>;
}
