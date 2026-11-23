import 'server-only';
import { cache } from 'react';
import { createCyberSoftClient, cyberSoftId, CyberSoftError } from './client.js';
import { normalizeCyberSoftRoom, normalizeLocation } from './normalize.js';
export const cyberSoftClient = () => createCyberSoftClient({ token: process.env.CYBERSOFT_TOKEN });
const unique = items => [...new Map(items.filter(Boolean).map(item => [item.id, item])).values()];
export const cyberSoftLocations = cache(async () => unique((await cyberSoftClient().locations()).map(normalizeLocation)));
export const cyberSoftRooms = cache(async () => {
  const [rooms, locations] = await Promise.all([cyberSoftClient().rooms(), cyberSoftLocations()]);
  return unique(rooms.map(room => normalizeCyberSoftRoom(room, locations)));
});
export const cyberSoftRoom = cache(async id => {
  const number = cyberSoftId(id); if (!number) return null;
  try {
    const raw = await cyberSoftClient().room(number);
    let locations;
    try { locations = await cyberSoftLocations(); }
    catch { const locationId = cyberSoftId(raw.maViTri); locations = locationId ? [normalizeLocation(await cyberSoftClient().location(locationId))].filter(Boolean) : []; }
    return normalizeCyberSoftRoom(raw, locations);
  } catch (error) { if (error instanceof CyberSoftError && error.code === 'not_found') return null; throw error; }
});
export const cyberSoftRoomsAtLocation = cache(async id => {
  const [rooms, locations] = await Promise.all([cyberSoftClient().roomsAtLocation(id), cyberSoftLocations()]);
  return unique(rooms.map(room => normalizeCyberSoftRoom(room, locations))).filter(room => room.apiLocationId === Number(id));
});
