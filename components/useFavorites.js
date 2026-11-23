'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, guestFavorites, guestFavoritesKey } from './AuthProvider';
const eventName = 'tnbnb-favorites-change';
export default function useFavorites() {
  const { user, refresh } = useAuth(); const userId = user?.id;
  const [favorites, setFavorites] = useState([]); const [ready, setReady] = useState(false); const pending = useRef(false);
  const activeUser = useRef(userId); activeUser.current = userId;
  useEffect(() => {
    let active = true; const controller = new AbortController(); setReady(false); setFavorites([]);
    async function sync() {
      if (!userId) { if (active) { setFavorites(guestFavorites()); setReady(true); } return; }
      try { const response = await fetch('/api/account/favorites', { cache: 'no-store', signal: controller.signal }); if (response.ok && active) setFavorites((await response.json()).favorites); else if (response.status === 401) refresh(); }
      catch {} finally { if (active) setReady(true); }
    }
    const storage = event => { if (event.key === guestFavoritesKey || event.key === 'tnbnb-saved-change') sync(); };
    sync(); window.addEventListener('storage', storage); window.addEventListener(eventName, sync); window.addEventListener('focus', sync);
    return () => { active = false; controller.abort(); window.removeEventListener('storage', storage); window.removeEventListener(eventName, sync); window.removeEventListener('focus', sync); };
  }, [userId, refresh]);
  async function toggle(id) {
    if (pending.current || !ready) return 'storageMessage';
    id = String(id); pending.current = true;
    try {
      const current = userId ? favorites : guestFavorites(); const saved = !current.includes(id);
      const next = saved ? [...current, id] : current.filter(value => value !== id);
      if (userId) {
        const response = await fetch('/api/account/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: id, saved }) });
        if (!response.ok) { if (response.status === 401) refresh(); return 'favoriteError'; }
        const result = await response.json(); if (activeUser.current !== userId) return 'favoriteError'; setFavorites(result.favorites);
      } else { localStorage.setItem(guestFavoritesKey, JSON.stringify(next)); setFavorites(next); }
      window.dispatchEvent(new Event(eventName)); try { localStorage.setItem('tnbnb-saved-change', String(Date.now())); } catch {}
      return saved ? 'savedMessage' : 'unsavedMessage';
    } catch { return userId ? 'favoriteError' : 'storageMessage'; }
    finally { pending.current = false; }
  }
  return { favorites, ready, toggle };
}
