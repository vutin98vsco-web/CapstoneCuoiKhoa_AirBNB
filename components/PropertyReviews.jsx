'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';
import { reviewCopy } from '../lib/review-copy';
import Icon from './Icon';
export default function PropertyReviews({ propertyId, initial }) {
  const { user, refresh } = useAuth(); const { locale } = useLanguage(); const c = reviewCopy[locale];
  const [data, setData] = useState(initial), [page, setPage] = useState(1), [order, setOrder] = useState('newest');
  const [editing, setEditing] = useState(false), [rating, setRating] = useState(0), [body, setBody] = useState('');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''); const dialog = useRef(null); const request = useRef(0);
  const mine = user?.id === data.viewerId ? data.mine : null;
  async function load(selectedPage = page, selectedOrder = order) {
    const version = ++request.current; setLoading(true);
    try { const response = await fetch(`/api/reviews?${new URLSearchParams({ propertyId,page: String(selectedPage),order: selectedOrder })}`, { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error); if (version === request.current) { setData(result); setPage(selectedPage); setOrder(selectedOrder); setError(''); } }
    catch (failure) { if (version === request.current) setError(failure.message || 'network'); } finally { if (version === request.current) setLoading(false); }
  }
  useEffect(() => { setEditing(false); setBody(''); setRating(0); load(1,order); return () => { request.current++; }; }, [user?.id,propertyId]);
  function edit() { setRating(mine.rating); setBody(mine.body); setEditing(true); setError(''); setMessage(''); }
  async function submit(event, deleting = false) {
    event?.preventDefault(); if (busy) return;
    if (!deleting && (!rating || body.trim().length < 10 || body.trim().length > 2000)) { setError('review_invalid'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/reviews', { method: deleting ? 'DELETE' : mine ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId,rating,body }) });
      const result = await response.json(); if (!response.ok) { if (response.status === 401) refresh(); throw new Error(result.error); }
      setMessage(deleting ? c.deleted : c.saved); setEditing(false); setRating(0); setBody(''); dialog.current?.close(); await load(1,order);
    } catch (failure) { dialog.current?.close(); setError(failure.message || 'network'); } finally { setBusy(false); }
  }
  const date = value => new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium',timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
  const stars = value => <span className="review-stars" aria-label={`${value} ${c.outOf}`}>{[1,2,3,4,5].map(index => <Icon key={index} name="star" size={16} className={index <= value ? 'filled' : ''} />)}</span>;
  const showForm = user && (!mine || editing);
  return <section className="community-reviews" aria-labelledby="community-review-heading"><div className="community-review-heading"><div><p className="eyebrow coral">TNbnb</p><h2 id="community-review-heading">{c.title}</h2></div>{data.summary.count > 0 && <div className="community-score"><Icon name="star" size={23} /><strong>{data.summary.average}/5</strong><span>{data.summary.count} {c.total}</span></div>}</div><p className="property-help">{c.intro} {c.noVerified}</p>
    {error && <div className="account-feedback error" role="alert">{c.errors[error] || c.errors.service_unavailable}<button className="review-text-button" type="button" onClick={() => load()}>{c.refresh}</button></div>}{message && <p className="account-feedback success" role="status">{message}</p>}
    {!user && <Link className="button-white" href={`/dang-nhap?returnTo=${encodeURIComponent(`/phong/${propertyId}#reviews`)}`}>{c.login}</Link>}
    {user && mine && !editing && <article className="review-mine"><div className="review-author"><strong>{c.mine}</strong>{stars(mine.rating)}</div><p>{mine.body}</p>{mine.status === 'hidden' && <p className="review-moderation">{c.hidden} {c.reason}: {mine.moderationReason}</p>}<div className="review-actions"><button className="button-white" type="button" onClick={edit}>{c.edit}</button><button className="review-text-button danger" type="button" onClick={() => dialog.current?.showModal()}>{c.remove}</button></div></article>}
    {showForm && <form className="review-form" onSubmit={submit} noValidate><h3>{mine ? c.edit : c.write}</h3><fieldset className="review-rating-input"><legend>{c.rating}</legend>{[1,2,3,4,5].map(value => <label key={value}><input type="radio" name={`rating-${propertyId}`} value={value} checked={rating === value} onChange={() => setRating(value)} /><span className={value <= rating ? 'filled' : ''}><Icon name="star" size={25} /><small>{value}</small></span></label>)}</fieldset><label className="review-body-label" htmlFor="review-body">{c.body}</label><textarea id="review-body" minLength={10} maxLength={2000} rows={5} value={body} onChange={event => setBody(event.target.value)} placeholder={c.placeholder} aria-describedby="review-body-hint" /><div className="review-form-hint"><small id="review-body-hint">{c.hint}</small><span>{body.length}/2000</span></div><div className="review-actions"><button type="submit" className="button-primary" disabled={busy}>{busy ? c.saving : mine ? c.save : c.submit}</button>{editing && <button type="button" className="review-text-button" onClick={() => setEditing(false)}>{c.cancel}</button>}</div></form>}
    <div className="review-list-heading"><span>{data.count} {c.total}</span><label><span className="sr-only">{c.sort}</span><select aria-label={c.sort} value={order} disabled={loading} onChange={event => load(1,event.target.value)}><option value="newest">{c.newest}</option><option value="highest">{c.highest}</option><option value="lowest">{c.lowest}</option></select></label></div><div aria-busy={loading}>{data.items.length ? <div className="review-list">{data.items.map(item => <article className="review-item" key={item.id}><div className="review-author"><span className="review-initial">{item.name.charAt(0).toUpperCase()}</span><div><strong>{item.name}</strong><small>{date(item.createdAt)}{item.updatedAt !== item.createdAt ? ` · ${c.edited}` : ''}</small></div>{stars(item.rating)}</div><p>{item.body}</p></article>)}</div> : <div className="review-empty"><Icon name="star" size={30} /><h3>{c.empty}</h3><p>{c.first}</p></div>}</div>{data.pages > 1 && <nav className="review-pagination" aria-label={c.page}><button type="button" disabled={page <= 1 || loading} onClick={() => load(page-1)}>{c.previous}</button><span>{c.page} {page}/{data.pages}</span><button type="button" disabled={page >= data.pages || loading} onClick={() => load(page+1)}>{c.next}</button></nav>}
    <dialog ref={dialog} className="review-delete-dialog" aria-labelledby="review-delete-title"><h2 id="review-delete-title">{c.removeTitle}</h2><p>{c.removeNote}</p><div className="review-actions"><button className="button-white" type="button" disabled={busy} onClick={() => dialog.current?.close()}>{c.back}</button><button className="button-primary" type="button" disabled={busy} onClick={() => submit(null,true)}>{busy ? c.saving : c.confirmRemove}</button></div></dialog>
  </section>;
}
