'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { detailCopy } from '../lib/detail-copy';
import { format } from '../lib/i18n';
import Icon from './Icon';

export default function PropertyGallery({ images, name, sourceUrl, variant = 'property', photoSourceLabel }) {
  const { locale } = useLanguage(); const c = detailCopy[locale];
  const dialog = useRef(null); const opener = useRef(null);
  const touch = useRef(null);
  const thumbnails = useRef(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState([]);
  const photos = images.filter(photo => photo.path || photo.url);
  useEffect(() => { if (!open) return; const prior = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prior; }; }, [open]);
  useEffect(() => { if (open) thumbnails.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [index, open]);
  function show(i, event) { setIndex(i); opener.current = event.currentTarget; dialog.current?.showModal(); setOpen(true); }
  function close() { dialog.current?.close(); }
  function move(delta) { setIndex(current => (current + delta + photos.length) % photos.length); }
  const label = i => format(c.photoOf, { index: i + 1, count: photos.length });
  function photo(item, i, extra = {}) { return <img src={item.path || item.url} alt={`${name} · ${label(i)}`} width={item.width || 1200} height={item.height || 800} draggable={false} loading={i || variant === 'room' ? 'lazy' : 'eager'} onError={() => setFailed(previous => previous.includes(i) ? previous : [...previous, i])} {...extra} />; }
  return <section className={`property-gallery ${variant === 'room' ? 'room-type-gallery' : ''}`} aria-label={`${c.gallery}: ${name}`}>
    <div className={`gallery-mosaic ${photos.length < 3 ? 'gallery-simple' : ''}`}>
      {photos.slice(0, 5).map((item, i) => <button key={item.path || item.url} className={`gallery-tile gallery-tile-${i}`} type="button" aria-label={`${c.allPhotos}: ${label(i)}`} onClick={event => show(i, event)}>{failed.includes(i) ? <span>{c.photoMissing}</span> : photo(item, i)}</button>)}
      {!photos.length && <div className="gallery-no-photo"><Icon name="home" size={48} /><p>{c.photoMissing}</p><a href={sourceUrl} target="_blank" rel="noreferrer">{c.viewPhotos} ↗</a></div>}
    </div>
    {photos.length > 0 && <button type="button" className="gallery-open" onClick={event => show(0, event)}><Icon name="grid" size={18} />{c.allPhotos}<span>{photos.length}</span></button>}
    <dialog ref={dialog} className="gallery-dialog" aria-label={`${c.gallery}: ${name}`} onClose={() => { setOpen(false); opener.current?.focus(); }} onClick={event => { if (event.target === dialog.current) close(); }} onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } }}>
      {open && photos.length > 0 && <><div className="gallery-dialog-heading"><p>{name}</p><span aria-live="polite">{label(index)}</span><button type="button" autoFocus className="icon-button" aria-label={c.closePhotos} onClick={close}><Icon name="close" /></button></div><div className="gallery-stage" onTouchStart={event => { const point = event.touches[0]; touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null; }} onTouchEnd={event => { const start = touch.current; touch.current = null; const end = event.changedTouches[0]; if (!start || !end || photos.length < 2) return; const dx = end.clientX - start.x; const dy = end.clientY - start.y; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1); }} onTouchCancel={() => { touch.current = null; }}>{failed.includes(index) ? <p>{c.photoMissing}</p> : photo(photos[index], index, { loading: 'eager' })}{photos.length > 1 && <><button className="gallery-prev" type="button" aria-label={c.previousPhoto} onClick={() => move(-1)}><Icon name="arrow" /></button><button className="gallery-next" type="button" aria-label={c.nextPhoto} onClick={() => move(1)}><Icon name="arrow" /></button></>}</div><div ref={thumbnails} className="gallery-thumbnails">{photos.map((item, i) => <button key={i} type="button" className={i === index ? 'selected' : ''} aria-label={label(i)} aria-pressed={i === index} onClick={() => setIndex(i)}>{photo(item, i)}</button>)}</div><a className="gallery-attribution" href={photos[index].sourceUrl || sourceUrl} target="_blank" rel="noreferrer">{photoSourceLabel || c.photoSource} ↗</a></>}
    </dialog>
  </section>;
}
