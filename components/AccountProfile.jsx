'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { useAuth } from './AuthProvider';
import { accountCopy } from '../lib/account-copy';
import { profileValues, validPassword } from '../lib/auth/validation';
import { AccountField, AccountFeedback, authRequest } from './AccountFields';
import RecoveryCode from './RecoveryCode';
import Icon from './Icon';

export default function AccountProfile({ initialUser }) {
  const { locale } = useLanguage(); const c = accountCopy[locale]; const auth = useAuth(); const router = useRouter();
  const user = auth.user;
  const [profile, setProfile] = useState({ name: initialUser.name, phone: initialUser.phone });
  const [password, setPassword] = useState({ currentPassword: '', password: '', confirm: '' });
  const [recoveryPassword, setRecoveryPassword] = useState(''); const [code, setCode] = useState('');
  const [busy, setBusy] = useState(''); const [feedback, setFeedback] = useState({}); const [fields, setFields] = useState({}); const fileInput = useRef(null);
  useEffect(() => { if (user && user.id !== initialUser.id) { router.replace('/tai-khoan'); router.refresh(); } }, [user, initialUser.id, router]);
  const message = key => <AccountFeedback c={c} {...feedback[key]} />;
  const error = (section, failure) => { setFeedback(old => ({ ...old, [section]: { error: failure.code || 'network' } })); if (section === 'profile' || section === 'password') setFields(failure.fields || {}); if (failure.code === 'unauthorized') auth.refresh(); };
  async function update(event, section) {
    event.preventDefault(); if (busy) return;
    const invalid = section === 'profile' ? profileValues(profile).fields : {};
    if (section === 'password') { if (!validPassword(password.password)) invalid.password = 'password_invalid'; if (password.password !== password.confirm) invalid.confirm = 'confirm_invalid'; if (!password.currentPassword) invalid.currentPassword = 'current_password'; }
    if (Object.keys(invalid).length) { setFields(invalid); setFeedback(old => ({ ...old, [section]: { error: 'validation' } })); return; }
    setBusy(section); setFields({}); setFeedback(old => ({ ...old, [section]: {} }));
    try {
      const result = await authRequest(section, section === 'profile' ? profile : section === 'password' ? password : { currentPassword: recoveryPassword });
      if (result.user) auth.commit(result.user);
      if (section === 'recovery') { setRecoveryPassword(''); setCode(result.recoveryCode); }
      else { if (section === 'password') setPassword({ currentPassword: '', password: '', confirm: '' }); setFeedback(old => ({ ...old, [section]: { success: section === 'profile' ? c.saved : c.passwordSaved } })); }
      router.refresh();
    } catch (failure) { error(section, failure); }
    finally { setBusy(''); }
  }
  async function avatar(file, remove = false) {
    if (busy || (!file && !remove)) return;
    if (file && file.size > 2097152) { error('avatar', { code: 'avatar_large' }); return; }
    setBusy('avatar'); setFeedback(old => ({ ...old, avatar: {} }));
    try {
      const form = new FormData(); if (file) form.append('avatar', file);
      const response = await fetch('/api/account/avatar', { method: remove ? 'DELETE' : 'POST', ...(remove ? {} : { body: form }) });
      const result = await response.json(); if (!response.ok) throw { code: result.error };
      auth.commit(result.user); setFeedback(old => ({ ...old, avatar: { success: remove ? c.avatarRemoved : c.avatarSaved } })); router.refresh();
    } catch (failure) { error('avatar', failure); }
    finally { setBusy(''); if (fileInput.current) fileInput.current.value = ''; }
  }
  async function logout() { if (busy) return; setBusy('logout'); try { await auth.signOut(); router.replace('/dang-nhap'); router.refresh(); } catch { setFeedback(old => ({ ...old, logout: { error: 'network' } })); } finally { setBusy(''); } }
  if (!user || user.id !== initialUser.id) return <main className="account-page" id="main-content"><div className="shell account-expired"><Icon name="shield" size={36} /><h1>{c.signInAgain}</h1><Link className="button-primary" href="/dang-nhap?returnTo=%2Ftai-khoan">{c.login}</Link></div></main>;
  const changeProfile = (key, value) => { setProfile(old => ({ ...old, [key]: value })); setFields(old => ({ ...old, [key]: undefined })); };
  const changePassword = (key, value) => { setPassword(old => ({ ...old, [key]: value })); setFields(old => ({ ...old, [key]: undefined })); };
  return <main className="account-page" id="main-content"><div className="shell account-profile-shell"><header className="account-heading"><p className="eyebrow coral">TNbnb</p><h1>{c.account}</h1><p>{c.profileIntro}</p></header><div className="account-profile-layout"><aside className="account-sidebar"><div className="account-large-avatar">{user.hasAvatar ? <img src={`/api/account/avatar?v=${user.avatarVersion}`} alt={c.avatar} width="96" height="96" /> : <span>{user.name.charAt(0).toUpperCase()}</span>}</div><h2>{user.name}</h2><p>{user.email}</p><small>{c.memberSince} {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(user.createdAt))}</small><nav aria-label={c.account}><a href="#personal" className="selected"><Icon name="user" size={19} />{c.personal}</a><a href="#security"><Icon name="shield" size={19} />{c.security}</a><Link href="/chuyen-di"><Icon name="calendar" size={19} />{c.trips}</Link><Link href="/rooms?favorites=1"><Icon name="heart" size={19} />{c.savedStays}</Link></nav><button className="account-logout" type="button" onClick={logout} disabled={Boolean(busy)}>{busy === 'logout' ? c.working : c.logout}<Icon name="arrow" size={17} /></button>{message('logout')}</aside><div className="account-panels"><section className="account-panel" id="personal"><div className="account-panel-heading"><span className="account-badge"><Icon name="user" size={23} /></span><div><h2>{c.personal}</h2><p>{c.profileIntro}</p></div></div><div className="account-avatar-controls"><div><strong>{c.avatar}</strong><p>{c.avatarHint}</p></div><div><input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} className="sr-only" id="account-avatar-file" aria-label={c.upload} onChange={event => avatar(event.target.files?.[0])} disabled={Boolean(busy)} /><button className="button-white" type="button" disabled={Boolean(busy)} onClick={() => fileInput.current?.click()}>{busy === 'avatar' ? c.working : c.upload}</button>{user.hasAvatar && <button className="account-text-button" type="button" disabled={Boolean(busy)} onClick={() => avatar(null, true)}>{c.removeAvatar}</button>}</div></div>{message('avatar')}<form noValidate onSubmit={event => update(event, 'profile')}>{message('profile')}<AccountField c={c} label={c.name} field="name" value={profile.name} change={changeProfile} error={fields.name} autoComplete="name" /><AccountField c={c} label={c.phone} field="phone" type="tel" value={profile.phone} change={changeProfile} error={fields.phone} autoComplete="tel" required={false} /><AccountField c={c} label={c.email} field="email" type="email" value={user.email} change={() => {}} readOnly hint={c.emailNote} /><button className="button-primary" type="submit" disabled={Boolean(busy)}>{busy === 'profile' ? c.working : c.save}<Icon name="check" size={17} /></button></form></section><section className="account-panel" id="security"><div className="account-panel-heading"><span className="account-badge"><Icon name="shield" size={23} /></span><div><h2>{c.passwordTitle}</h2><p>{c.passwordNote}</p></div></div><form noValidate onSubmit={event => update(event, 'password')}>{message('password')}<AccountField c={c} label={c.currentPassword} field="currentPassword" type="password" value={password.currentPassword} change={changePassword} error={fields.currentPassword} autoComplete="current-password" /><div className="account-field-pair"><AccountField c={c} label={c.newPassword} field="password" type="password" value={password.password} change={changePassword} error={fields.password} autoComplete="new-password" hint={c.passwordHint} /><AccountField c={c} label={c.confirm} field="confirm" type="password" value={password.confirm} change={changePassword} error={fields.confirm} autoComplete="new-password" /></div><button className="button-primary" type="submit" disabled={Boolean(busy)}>{busy === 'password' ? c.working : c.changePassword}<Icon name="arrow" size={17} /></button></form></section><section className="account-panel"><h2>{c.recoverySection}</h2><p>{c.recoveryMethod}</p>{code ? <RecoveryCode code={code} c={c} onDone={() => setCode('')} doneLabel={c.recoveryDone} /> : <form noValidate onSubmit={event => update(event, 'recovery')}><p>{c.recoveryRotateNote}</p>{message('recovery')}<AccountField c={c} label={c.currentPassword} field="recoveryPassword" type="password" value={recoveryPassword} change={(_, value) => setRecoveryPassword(value)} autoComplete="current-password" /><button type="submit" className="button-white" disabled={Boolean(busy)}>{busy === 'recovery' ? c.working : c.recoveryRotate}</button></form>}</section></div></div></div></main>;
}
