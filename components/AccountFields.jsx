'use client';
import { useState } from 'react';
export function AccountField({ label, field, value, change, error, type = 'text', autoComplete, hint, readOnly = false, c, required = true }) {
  const [visible, setVisible] = useState(false); const password = type === 'password';
  return <div className="account-field"><label className="account-field-label" htmlFor={`account-${field}`}>{label}{!required && <small>{c.optional}</small>}</label><span className={`account-input ${password ? 'has-toggle' : ''}`}><input id={`account-${field}`} name={field} type={password && visible ? 'text' : type} value={value} onChange={event => change(field, event.target.value)} autoComplete={autoComplete} readOnly={readOnly} required={required} maxLength={password ? 128 : field === 'email' ? 254 : field === 'phone' ? 30 : 100} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${field}-note` : undefined} spellCheck={false} />{password && <button type="button" aria-label={`${visible ? c.hide : c.show} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? c.hide : c.show}</button>}</span>{(error || hint) && <small id={`${field}-note`} className={error ? 'account-field-error' : ''}>{error ? c.errors[error] || error : hint}</small>}</div>;
}
export function AccountFeedback({ error, success, c }) {
  return error ? <div className="account-feedback error" role="alert">{error === 'password_unchanged' ? c.passwordUnchanged : c.errors[error] || c.errors.service_unavailable}</div> : success ? <div className="account-feedback success" role="status">{success}</div> : null;
}
export async function authRequest(action, body) {
  let response;
  try { response = await fetch(`/api/auth/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw { code: 'network' }; }
  let result; try { result = await response.json(); } catch { throw { code: 'service_unavailable' }; }
  if (!response.ok) throw { code: result.error, fields: result.fields };
  return result;
}
