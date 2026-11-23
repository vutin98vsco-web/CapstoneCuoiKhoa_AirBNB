'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const RoomSelection = createContext(null);
export function useRoomSelection() { return useContext(RoomSelection); }

export default function RoomSelectionProvider({ roomTypes, initialType = '', children }) {
  const [selectedId, setSelectedId] = useState(roomTypes.some(type => type.id === initialType) ? initialType : '');
  const selected = roomTypes.find(type => type.id === selectedId) || null;
  useEffect(() => {
    const sync = () => { const id = new URL(window.location.href).searchParams.get('roomType'); setSelectedId(roomTypes.some(type => type.id === id) ? id : ''); };
    window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync);
  }, [roomTypes]);
  function selectRoom(id, scroll = false) {
    if (id && !roomTypes.some(type => type.id === id)) return;
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('roomType', id); else url.searchParams.delete('roomType');
    window.history.replaceState(window.history.state, '', url);
    if (scroll) document.getElementById('price-estimate')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  return <RoomSelection.Provider value={{ roomTypes, selected, selectRoom }}>{children}</RoomSelection.Provider>;
}
