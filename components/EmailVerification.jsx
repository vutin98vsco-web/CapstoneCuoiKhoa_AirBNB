'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageProvider';
export default function EmailVerification() {
  const { locale } = useLanguage(),
    vi = locale === 'vi';
  const [state, setState] = useState(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/account/email', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (active) setState(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function send() {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/account/email', { method: 'POST' });
      setMessage(
        r.ok
          ? vi
            ? 'Đã yêu cầu gửi liên kết. Vui lòng kiểm tra hộp thư và thư rác.'
            : 'Verification requested. Check your inbox and spam folder.'
          : vi
            ? 'Chưa gửi được email. Vui lòng thử lại sau.'
            : 'Unable to send email. Please try again later.',
      );
    } catch {
      setMessage(vi ? 'Không thể kết nối.' : 'Unable to connect.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-panel">
      <h2>{vi ? 'Xác minh email' : 'Email verification'}</h2>
      <p>
        {state?.verified
          ? vi
            ? 'Email của bạn đã được xác minh.'
            : 'Your email is verified.'
          : vi
            ? 'Xác minh email để nhận thông báo yêu cầu đặt phòng đến địa chỉ của tài khoản.'
            : 'Verify your email to receive booking-request notifications at your account address.'}
      </p>
      {state &&
        !state.verified &&
        (state.configured ? (
          <button
            className="button-primary"
            style={{ marginTop: 16 }}
            disabled={busy}
            onClick={send}
          >
            {busy
              ? vi
                ? 'Đang xử lý…'
                : 'Sending…'
              : vi
                ? 'Gửi liên kết xác minh'
                : 'Send verification link'}
          </button>
        ) : (
          <p>
            {vi
              ? 'Gửi email hiện chưa khả dụng. Bạn vẫn có thể sử dụng mã khôi phục tài khoản.'
              : 'Email delivery is currently unavailable. Your account recovery code remains available.'}
          </p>
        ))}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
