import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/auth/session.server';
import { safeReturnTo } from '../../lib/auth/validation';
import { getI18n } from '../../lib/i18n-server';
import { accountCopy } from '../../lib/account-copy';
import AccountForm from '../../components/AccountForm';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: accountCopy[locale].login, robots: { index: false, follow: false } }; }
export default async function LoginPage({ searchParams }) { const target = safeReturnTo((await searchParams).returnTo); if ((await currentUser(await cookies()))) redirect(target); return <AccountForm mode="login" returnTo={target} />; }
