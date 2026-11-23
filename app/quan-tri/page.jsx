import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/auth/session.server';
import { getI18n } from '../../lib/i18n-server';
import { adminCopy } from '../../lib/admin-copy';
import { bookingStore } from '../../lib/bookings/store.server';
import { currentProperties, currentCities } from '../../lib/admin/catalog.server';
import AdminDashboard from '../../components/AdminDashboard';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: adminCopy[locale].title,robots: { index: false,follow: false } }; }
export default async function AdminPage({ searchParams }) {
  const user = currentUser(await cookies()); if (!user) redirect('/dang-nhap?returnTo=%2Fquan-tri');
  const { locale } = await getI18n(), c = adminCopy[locale];
  if (user.role !== 'admin') return <main className="account-page" id="main-content"><div className="shell account-expired"><h1>{c.forbidden}</h1><p>{c.accessNote}</p><Link className="button-primary" href="/tai-khoan">{c.back}</Link></div></main>;
  const tab = (await searchParams).tab; const properties = currentProperties(), types = properties.flatMap(property => property.roomTypes);
  return <AdminDashboard key={user.id} initialTab={['properties','cities','users','bookings','reviews','audit'].includes(tab) ? tab : 'overview'} initialOverview={{ ...bookingStore().workspace.stats(),properties: properties.length,roomTypes: types.length,cities: currentCities().length,quality: { priced: types.filter(room => room.price).length,capacityKnown: types.filter(room => room.capacity).length,photoReady: types.filter(room => room.images.length >= 3).length } }} />;
}
