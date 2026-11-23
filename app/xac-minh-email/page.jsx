import Link from 'next/link';
import { getI18n } from '../../lib/i18n-server';
export const metadata = {
  title: 'TNbnb',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default async function VerifyPage({ searchParams }) {
  const params = await searchParams,
    { locale } = await getI18n(),
    vi = locale === 'vi';
  const valid = typeof params.token === 'string' && /^[a-f0-9]{64}$/.test(params.token);
  return (
    <main id="main-content" className="account-page">
      <div className="shell account-panel" style={{ maxWidth: 560 }}>
        <h1>{vi ? 'Xác minh email' : 'Verify email'}</h1>
        {valid ? (
          <form action="/api/auth/email-verification" method="post">
            <input type="hidden" name="token" value={params.token} />
            <p>
              {vi
                ? 'Xác nhận để hoàn tất xác minh địa chỉ email của bạn.'
                : 'Confirm to verify your email address.'}
            </p>
            <button className="button-primary" style={{ marginTop: 20 }}>
              {vi ? 'Xác nhận email' : 'Confirm email'}
            </button>
          </form>
        ) : (
          <p>
            {params.status === 'ok'
              ? vi
                ? 'Email đã được xác minh.'
                : 'Your email has been verified.'
              : vi
                ? 'Liên kết không hợp lệ hoặc đã hết hạn.'
                : 'This link is invalid or expired.'}
          </p>
        )}
        <Link className="text-link" href="/tai-khoan">
          {vi ? 'Về tài khoản' : 'Your account'}
        </Link>
      </div>
    </main>
  );
}
