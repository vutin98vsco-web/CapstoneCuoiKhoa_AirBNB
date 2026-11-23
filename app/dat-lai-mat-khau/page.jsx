import Link from 'next/link';
import { getI18n } from '../../lib/i18n-server';
import EmailPasswordReset from '../../components/EmailPasswordReset';
export const metadata = {
  title: 'TNbnb',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default async function ResetPage({ searchParams }) {
  const params = await searchParams,
    { locale } = await getI18n(),
    vi = locale === 'vi';
  const valid = typeof params.token === 'string' && /^[a-f0-9]{64}$/.test(params.token);
  return (
    <main id="main-content" className="account-page">
      <div className="shell account-panel" style={{ maxWidth: 560 }}>
        <h1>{vi ? 'Đặt lại mật khẩu' : 'Reset password'}</h1>
        {valid ? (
          <EmailPasswordReset token={params.token} />
        ) : (
          <p>{vi ? 'Liên kết không hợp lệ.' : 'Invalid recovery link.'}</p>
        )}
        <Link className="text-link" href="/quen-mat-khau">
          {vi ? 'Yêu cầu liên kết mới' : 'Request a new link'}
        </Link>
      </div>
    </main>
  );
}
