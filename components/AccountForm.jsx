'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useLanguage } from './LanguageProvider';
import { useAuth, guestFavorites } from './AuthProvider';
import { accountCopy } from '../lib/account-copy';
import { normalizeEmail, validEmail, validPassword, profileValues } from '../lib/auth/validation';
import { AccountField, AccountFeedback, authRequest } from './AccountFields';
import RecoveryCode from './RecoveryCode';
import Icon from './Icon';
export default function AccountForm({ mode, returnTo }) {
  const { locale } = useLanguage(); const c = accountCopy[locale]; const auth = useAuth(); const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', recoveryCode: '', remember: true });
  const [errors, setErrors] = useState({}); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [code, setCode] = useState(''); const feedback = useRef(null);
  const registering = mode === 'register', resetting = mode === 'reset';
  const title = registering ? c.registerTitle : resetting ? c.resetTitle : c.welcome;
  function change(key, value) { setForm(old => ({ ...old, [key]: value })); setErrors(old => ({ ...old, [key]: undefined })); setError(''); }
  const go = () => { router.replace(resetting ? '/dang-nhap' : returnTo); router.refresh(); };
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const fields = {}; if (!validEmail(normalizeEmail(form.email))) fields.email = 'email_invalid';
    if ((registering || resetting) ? !validPassword(form.password) : !form.password) fields.password = 'password_invalid';
    if (registering) Object.assign(fields, profileValues(form).fields);
    if ((registering || resetting) && form.password !== form.confirm) fields.confirm = 'confirm_invalid';
    if (resetting && !form.recoveryCode.trim()) fields.recoveryCode = 'recovery_wrong';
    setErrors(fields);
    if (Object.keys(fields).length) { setError('validation'); requestAnimationFrame(() => feedback.current?.focus()); return; }
    setBusy(true); setError('');
    try {
      const result = await authRequest(mode, { ...form, favoriteIds: resetting ? [] : guestFavorites() });
      if (!resetting) auth.commit(result.user, true, result.deferredFavoriteIds || []);
      setForm(old => ({ ...old, password: '', confirm: '', recoveryCode: '' }));
      if (result.recoveryCode) setCode(result.recoveryCode); else go();
    } catch (failure) { setError(failure.code); setErrors(failure.fields || {}); requestAnimationFrame(() => feedback.current?.focus()); }
    finally { setBusy(false); }
  }
  const field = (key, label, options = {}) => <AccountField key={key} label={label} field={key} value={form[key]} change={change} error={errors[key]} c={c} {...options} />;
  return <main className="account-page" id="main-content"><div className="shell account-auth-layout"><aside className="account-story"><Link href="/" className="account-story-brand"><img src="/images/tnbnb-logo.svg" alt="" width="42" height="42" />TNbnb</Link><div><p className="eyebrow">{c.sideEyebrow}</p><h2>{c.sideTitle}</h2><p>{c.sideNote}</p><ul><li><Icon name="calendar" size={19} />{c.benefitTrips}</li><li><Icon name="heart" size={19} />{c.benefitSaved}</li><li><Icon name="user" size={19} />{c.benefitProfile}</li></ul></div><Link href="/">← {c.back}</Link></aside><div className="account-auth-card">{code ? <RecoveryCode code={code} c={c} onDone={go} success={resetting ? c.resetSuccess : ''} /> : <><span className="account-badge"><Icon name={resetting ? 'shield' : 'user'} size={25} /></span><h1>{title}</h1><p className="account-intro">{registering ? c.registerIntro : resetting ? c.resetIntro : c.loginIntro}</p><form onSubmit={submit} noValidate><div ref={feedback} tabIndex={-1}><AccountFeedback error={error} c={c} /></div>{registering && field('name', c.name, { autoComplete: 'name' })}{field('email', c.email, { type: 'email', autoComplete: 'email' })}{registering && field('phone', c.phone, { type: 'tel', autoComplete: 'tel', required: false })}{resetting && field('recoveryCode', c.recoveryCode, { autoComplete: 'off' })}{field('password', resetting ? c.newPassword : c.password, { type: 'password', autoComplete: registering || resetting ? 'new-password' : 'current-password', hint: registering || resetting ? c.passwordHint : undefined })}{(registering || resetting) && field('confirm', c.confirm, { type: 'password', autoComplete: 'new-password' })}{mode === 'login' && <div className="account-form-options"><label><input type="checkbox" checked={form.remember} onChange={event => change('remember', event.target.checked)} />{c.remember}</label><Link href="/quen-mat-khau">{c.forgot}</Link></div>}<button className="button-primary account-submit" disabled={busy} type="submit">{busy ? c.working : registering ? c.register : resetting ? c.reset : c.login}<Icon name="arrow" size={18} /></button></form><p className="account-switch">{resetting ? <Link href="/dang-nhap">← {c.backLogin}</Link> : <>{registering ? c.hasAccount : c.noAccount} <Link href={`${registering ? '/dang-nhap' : '/dang-ky'}?returnTo=${encodeURIComponent(returnTo)}`}>{registering ? c.login : c.register}</Link></>}</p><p className="account-fineprint"><Icon name="shield" size={15} />{resetting || registering ? c.recoveryMethod : c.guestClaim}</p></>}</div></div></main>;
}
