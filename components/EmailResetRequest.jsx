'use client';
import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
export default function EmailResetRequest() {
  const { locale } = useLanguage(),
    vi = locale === 'vi';
  const [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/auth/email-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      setMessage(
        r.ok
          ? vi
            ? 'Nếu địa chỉ đã đăng ký, hệ thống sẽ gửi liên kết khôi phục.'
            : 'If the address is registered, a recovery link will be sent.'
          : vi
            ? 'Gửi email hiện chưa khả dụng. Vui lòng dùng mã khôi phục bên trên.'
            : 'Email delivery is unavailable. Please use your recovery code above.',
      );
    } catch {
      setMessage(vi ? 'Không thể kết nối.' : 'Unable to connect.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="account-panel" style={{ marginTop: 24 }} onSubmit={submit}>
      <h2>{vi ? 'Khôi phục qua email' : 'Recover by email'}</h2>
      <label className="account-field">
        {vi ? 'Email đăng nhập' : 'Account email'}
        <span className="account-input">
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </span>
      </label>
      <button className="button-primary" disabled={busy}>
        {busy
          ? vi
            ? 'Đang xử lý…'
            : 'Sending…'
          : vi
            ? 'Gửi liên kết khôi phục'
            : 'Send recovery link'}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
