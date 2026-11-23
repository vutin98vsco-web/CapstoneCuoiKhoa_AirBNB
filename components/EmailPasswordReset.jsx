'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { accountCopy } from '../lib/account-copy';
import RecoveryCode from './RecoveryCode';
import { validPassword } from '../lib/auth/validation';
export default function EmailPasswordReset({ token }) {
  const { locale } = useLanguage(),
    c = accountCopy[locale],
    vi = locale === 'vi',
    router = useRouter();
  const [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [message, setMessage] = useState(''),
    [code, setCode] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!validPassword(password)) {
      setMessage(c.errors.password_invalid);
      return;
    }
    if (password !== confirm) {
      setMessage(c.errors.confirm_invalid);
      return;
    }
    setMessage('');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/email-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) throw Error();
      setCode(data.recoveryCode);
    } catch {
      setMessage(
        vi
          ? 'Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới.'
          : 'This link is invalid or expired. Please request a new link.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (code)
    return (
      <RecoveryCode
        code={code}
        c={c}
        success={c.resetSuccess}
        onDone={() => {
          router.replace('/dang-nhap');
          router.refresh();
        }}
      />
    );
  return (
    <form onSubmit={submit}>
      <label className="account-field">
        {c.newPassword}
        <span className="account-input">
          <input
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </span>
      </label>
      <label className="account-field">
        {c.confirm}
        <span className="account-input">
          <input
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </span>
      </label>
      <button className="button-primary" disabled={busy}>
        {busy ? c.working : c.reset}
      </button>
      {message && (
        <p className="account-feedback error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
