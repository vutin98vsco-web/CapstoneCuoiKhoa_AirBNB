import 'server-only';
import { cache } from 'react';
import { currentProperties } from './admin/catalog.server';
import { cyberSoftClient, cyberSoftRooms, cyberSoftLocations, cyberSoftRoom, cyberSoftRoomsAtLocation } from './cybersoft/catalog.server.js';
import { cyberSoftId } from './cybersoft/client.js';
import { reportServerError } from './observability.js';

export const getCatalog = cache(async (source = '', location = '') => {
  const referenceRooms = await currentProperties();
  const local = source === 'cybersoft' || location ? [] : referenceRooms;
  if (source === 'tnbnb') return { rooms: local, locations: [], source: 'reference', apiStatus: 'not_requested' };
  if (!cyberSoftClient().configured) return { rooms: local, locations: [], source: 'reference', apiStatus: 'not_configured' };
  try {
    const [rooms, locations] = await Promise.all([location ? cyberSoftRoomsAtLocation(location) : cyberSoftRooms(), cyberSoftLocations()]);
    return { rooms: [...local, ...rooms], locations, source: 'reference+api', apiStatus: 'ready' };
  } catch (error) {
    reportServerError('cybersoft.catalog', error);
    return { rooms: local, locations: [], source: 'fallback', apiStatus: error.code === 'unauthorized' ? 'unauthorized' : 'unavailable' };
  }
});

export const getProperty = cache(async id => {
  if (typeof id !== 'string' || id.length > 80) return null;
  if (id.startsWith('api-')) {
    const apiId = id.slice(4); if (!cyberSoftId(apiId)) return null;
    return cyberSoftRoom(apiId);
  }
  return (await currentProperties()).find(property => property.id === id) || null;
});
