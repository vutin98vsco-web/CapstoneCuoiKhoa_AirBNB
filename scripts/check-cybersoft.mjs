import { createCyberSoftClient } from '../lib/cybersoft/client.js';
const client = createCyberSoftClient({ token: process.env.CYBERSOFT_TOKEN, revalidate: 0 });
try {
  const [rooms, locations] = await Promise.all([client.rooms(), client.locations()]);
  let checks = 2;
  if (rooms.length) { await client.room(rooms[0].id); checks++; }
  if (locations.length) { await Promise.all([client.location(locations[0].id), client.roomsAtLocation(locations[0].id)]); checks += 2; }
  await Promise.all([client.searchRooms({ pageSize: 1 }), client.searchLocations({ pageSize: 1 })]); checks += 2;
  console.log(JSON.stringify({ provider: 'CyberSoft', configured: true, status: 'ok', checks, rooms: rooms.length, locations: locations.length }));
} catch (error) {
  console.error(JSON.stringify({ provider: 'CyberSoft', configured: client.configured, status: error.code || 'unavailable', httpStatus: error.status || null })); process.exitCode = 1;
}
