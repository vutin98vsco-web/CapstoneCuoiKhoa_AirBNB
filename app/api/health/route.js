import { reply } from '../../../lib/http.server';
import { bookingStore } from '../../../lib/bookings/store.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() { try { return bookingStore().health() ? reply({ status: 'ok' }) : reply({ status: 'unavailable' },503); } catch { return reply({ status: 'unavailable' },503); } }
