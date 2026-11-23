import { getI18n } from '../../lib/i18n-server';
import { accountCopy } from '../../lib/account-copy';
import AccountForm from '../../components/AccountForm';
export const runtime = 'nodejs';
export async function generateMetadata() { const { locale } = await getI18n(); return { title: accountCopy[locale].resetTitle, robots: { index: false, follow: false } }; }
export default function ResetPage() { return <AccountForm mode="reset" returnTo="/dang-nhap" />; }
