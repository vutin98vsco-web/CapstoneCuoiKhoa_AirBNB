'use client';
import { useState } from 'react';
import Icon from './Icon';
export default function RecoveryCode({ code, c, onDone, doneLabel, success }) {
  const [message, setMessage] = useState('');
  async function copy() { try { await navigator.clipboard.writeText(code); setMessage(c.copied); } catch { setMessage(c.copyError); } }
  function download() {
    const url = URL.createObjectURL(new Blob([`TNbnb\n${c.recoveryCode}: ${code}\n\n${c.recoveryNote}\n${c.recoverySingle}\n`], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'TNbnb-recovery-code.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="recovery-card" aria-labelledby="recovery-title"><span className="account-badge"><Icon name="shield" size={26} /></span><h2 id="recovery-title">{c.recoveryTitle}</h2>{success && <p className="account-feedback success" role="status">{success}</p>}<p>{c.recoveryNote}</p><input className="recovery-code" aria-label={c.recoveryCode} readOnly value={code} onFocus={event => event.currentTarget.select()} autoComplete="off" /><div className="recovery-tools"><button type="button" onClick={copy}>{c.copy}</button><button type="button" onClick={download}>{c.download}</button></div><p className="account-copy-status" role="status">{message}</p><p className="account-fineprint">{c.recoverySingle}</p><button type="button" className="button-primary account-submit" onClick={onDone}>{doneLabel || c.continue}<Icon name="arrow" size={18} /></button></section>;
}
