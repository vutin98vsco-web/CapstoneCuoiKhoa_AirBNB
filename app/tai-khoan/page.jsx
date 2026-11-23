import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/auth/session.server';
import { getI18n } from '../../lib/i18n-server';
import { accountCopy } from '../../lib/account-copy';
import AccountProfile from '../../components/AccountProfile';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: accountCopy[locale].account, robots: { index: false, follow: false } }; }
export default async function AccountPage() { const user = currentUser(await cookies()); if (!user) redirect('/dang-nhap?returnTo=%2Ftai-khoan'); return <AccountProfile key={user.id} initialUser={user} />; }
