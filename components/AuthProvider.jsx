'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
const AuthContext = createContext(null);
const signal = 'tnbnb-account-change';
export const guestFavoritesKey = 'cyberbnb-favorites';
export function guestFavorites() { try { const ids = JSON.parse(localStorage.getItem(guestFavoritesKey) || '[]'); return Array.isArray(ids) ? ids.slice(0, 100).map(String) : []; } catch { return []; } }
export default function AuthProvider({ initialUser, children }) {
  const [user, setUser] = useState(initialUser);
  const userId = useRef(initialUser?.id); const router = useRouter();
  useEffect(() => { userId.current = user?.id; }, [user]);
  useEffect(() => { setUser(initialUser); }, [initialUser]);
  const refresh = useCallback(async () => {
    try { const response = await fetch('/api/auth/session', { cache: 'no-store' }); if (response.ok) { const next = (await response.json()).user; setUser(next); if (userId.current !== next?.id) router.refresh(); } } catch { /* Retain state during network interruptions. */ }
  }, [router]);
  useEffect(() => {
    const sync = event => { if (event.key === signal) refresh(); };
    window.addEventListener('storage', sync); window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', refresh); };
  }, [refresh]);
  function commit(next, imported = false, deferred = []) {
    if (imported) { try { const keep = guestFavorites().filter(id => deferred.includes(id)); if (keep.length) localStorage.setItem(guestFavoritesKey, JSON.stringify(keep)); else localStorage.removeItem(guestFavoritesKey); } catch {} }
    setUser(next);
    try { localStorage.setItem(signal, String(Date.now())); } catch {}
    window.dispatchEvent(new Event('tnbnb-favorites-change'));
  }
  async function signOut() {
    const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) throw new Error('logout');
    commit(null);
  }
  return <AuthContext.Provider value={{ user, commit, refresh, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
