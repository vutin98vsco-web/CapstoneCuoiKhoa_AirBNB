'use client';

import { useState } from 'react';
import useFavorites from './useFavorites';
import { useLanguage } from './LanguageProvider';
import { detailCopy } from '../lib/detail-copy';
import Icon from './Icon';

export default function PropertyActions({ id, name }) {
  const { locale, t } = useLanguage();
  const c = detailCopy[locale];
  const { favorites, toggle } = useFavorites();
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  async function share() {
    const current = new URL(window.location.href); current.hash = '';
    try {
      if (navigator.share) await navigator.share({ title: `${name} | TNbnb`, url: current.href });
      else { await navigator.clipboard.writeText(current.href); setMessage(c.copied); }
    } catch (error) { if (error.name !== 'AbortError') setUrl(current.href); }
  }
  return <div className="property-actions"><button type="button" onClick={share}><Icon name="share" size={18} />{c.share}</button><button type="button" className={favorites.includes(id) ? 'is-saved' : ''} aria-pressed={favorites.includes(id)} onClick={async () => setMessage(t[await toggle(id)])}><Icon name="heart" size={18} />{favorites.includes(id) ? c.saved : c.save}</button><span className="sr-only" role="status">{message}</span>{url && <label className="share-link">{c.shareFallback}<input readOnly value={url} onFocus={e => e.currentTarget.select()} /></label>}</div>;
}
