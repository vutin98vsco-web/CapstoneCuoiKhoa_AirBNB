'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from './LanguageProvider';
import { format, intlLocale } from '../lib/i18n';
import { displayDate, parseDate, todayInVietnam } from '../lib/trip';
import Icon from './Icon';

export default function DateField({ name, label, value, min, required = false, onChange }) {
  const { locale, t } = useLanguage();
  const id = useId();
  const wrapper = useRef(null);
  const input = useRef(null);
  const trigger = useRef(null);
  const popover = useRef(null);
  const [position, setPosition] = useState({ visibility: 'hidden' });
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(displayDate(value));
  const [month, setMonth] = useState((value || min || todayInVietnam()).slice(0, 7));
  useEffect(() => setRaw(displayDate(value)), [value]);
  function error(text) {
    if (!text) return required ? t.dateRequired : '';
    const date = parseDate(text);
    if (!date) return t.dateInvalid;
    return min && date < min ? format(t.dateMin, { date: displayDate(min) }) : '';
  }
  useEffect(() => { input.current?.setCustomValidity(error(raw)); }, [raw, min, required, locale]);
  useEffect(() => {
    function outside(event) { if (!wrapper.current?.contains(event.target) && !popover.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === 'Escape' && (wrapper.current?.contains(document.activeElement) || popover.current?.contains(document.activeElement))) { setOpen(false); trigger.current?.focus({ preventScroll: true }); event.stopPropagation(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = wrapper.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 32);
      const height = popover.current?.offsetHeight || 360;
      const top = rect.bottom + 12 + height <= window.innerHeight - 16 ? rect.bottom + 12 : Math.max(16, rect.top - height - 12);
      setPosition({ width, left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), top });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, month]);
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const totalDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
  const fullDate = date => new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  function move(delta) { const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1)); setMonth(date.toISOString().slice(0, 7)); }
  function choose(date) { onChange(date); setRaw(displayDate(date)); setOpen(false); trigger.current?.focus({ preventScroll: true }); }
  const previousEnd = new Date(Date.UTC(year, monthNumber - 1, 0)).toISOString().slice(0, 10);
  return <div className="date-field" ref={wrapper}>
    <input type="hidden" name={name} value={value} />
    <div className="date-input-row"><input ref={input} type="text" value={raw} placeholder={t.dateFormatShort} aria-label={label} aria-description={t.dateFormat} required={required} inputMode="numeric" autoComplete="off" maxLength={10} onChange={event => {
      const text = event.target.value;
      setRaw(text); event.target.setCustomValidity(error(text));
      if (!text) onChange('');
      else if (parseDate(text)) onChange(parseDate(text));
    }} onInvalid={event => event.currentTarget.setCustomValidity(error(raw))} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setMonth((value || min || todayInVietnam()).slice(0, 7)); setOpen(true); } }} />
    <button ref={trigger} type="button" className="calendar-trigger" aria-label={`${t.chooseDate}: ${label}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { setMonth((value || min || todayInVietnam()).slice(0, 7)); setOpen(!open); }}><Icon name="calendar" size={16} /></button></div>
    {open && createPortal(<div ref={popover} className="calendar-popover" style={position} id={id} role="dialog" aria-label={label}>
      <p className="calendar-label">{label}</p>
      <div className="calendar-heading"><button type="button" aria-label={t.previousMonth} disabled={Boolean(min && previousEnd < min)} onClick={() => move(-1)}><Icon name="arrow" size={16} className="calendar-previous" /></button><strong aria-live="polite">{monthLabel}</strong><button type="button" aria-label={t.nextMonth} onClick={() => move(1)}><Icon name="arrow" size={16} /></button><button type="button" autoFocus aria-label={t.closeCalendar} onClick={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}><Icon name="close" size={16} /></button></div>
      <div className="calendar-weekdays" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index}>{new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 5 + index)))}</span>)}</div>
      <div className="calendar-days">{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: totalDays }, (_, index) => {
        const date = `${month}-${String(index + 1).padStart(2, '0')}`;
        return <button type="button" key={date} disabled={Boolean(min && date < min)} className={date === value ? 'calendar-selected' : ''} aria-pressed={date === value} aria-current={date === todayInVietnam() ? 'date' : undefined} aria-label={fullDate(date)} onClick={() => choose(date)}>{index + 1}</button>;
      })}</div>
    </div>, document.body)}
  </div>;
}
