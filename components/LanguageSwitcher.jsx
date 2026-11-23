'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import Icon from './Icon';

export default function LanguageSwitcher() {
  const { locale, t } = useLanguage();
  const pathname = usePathname();
  const id = useId();
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const locales = ['vi', 'en'];

  useEffect(() => {
    const outside = event => { if (!wrapper.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (open) options.current[activeIndex]?.focus(); }, [open, activeIndex]);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }
  function show(index = locales.indexOf(locale)) { setActiveIndex(index); setOpen(true); }
  function navigate(event) {
    const keys = { ArrowDown: (activeIndex + 1) % 2, ArrowUp: (activeIndex + 1) % 2, Home: 0, End: 1 };
    if (event.key in keys) { event.preventDefault(); setActiveIndex(keys[event.key]); }
    else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.key === 'Tab') close();
  }

  return <div className="language-switcher" ref={wrapper}>
    <button ref={trigger} type="button" id={`${id}-trigger`} className={`language-trigger ${open ? 'is-open' : ''}`} aria-label={`${t.language}: ${t.languages[locale]}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? `${id}-menu` : undefined} onClick={() => open ? close() : show()} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(event.key === 'ArrowUp' ? 1 : 0); }
      else if (event.key === 'Escape') close();
    }}>
      <span className="language-globe"><Icon name="globe" size={18} /></span>
      <span className="language-trigger-label">{t.languages[locale]}</span>
      <span className="language-trigger-code" aria-hidden="true">{locale.toUpperCase()}</span>
      <Icon name="chevronDown" size={14} className="language-chevron" />
    </button>
    {open && <div className="language-panel">
      <div className="language-panel-heading"><span>{t.language}</span><p>{t.languageScope}</p></div>
      <form action="/language" method="post" role="menu" id={`${id}-menu`} aria-labelledby={`${id}-trigger`} aria-busy={Boolean(pending)} onKeyDown={navigate} onSubmit={event => {
        const choice = event.nativeEvent.submitter?.value;
        if (pending || choice === locale) { event.preventDefault(); if (!pending) close(true); return; }
        event.currentTarget.elements.returnTo.value = window.location.pathname + window.location.search + window.location.hash;
        setPending(choice);
      }}>
        <input type="hidden" name="returnTo" defaultValue={pathname} />
        {locales.map((language, index) => <button ref={element => { options.current[index] = element; }} key={language} type="submit" name="locale" value={language} role="menuitemradio" aria-checked={language === locale} aria-disabled={Boolean(pending)} tabIndex={activeIndex === index ? 0 : -1} className={`language-option ${language === locale ? 'is-selected' : ''}`} onFocus={() => setActiveIndex(index)}>
          <span className="language-badge" aria-hidden="true">{language.toUpperCase()}</span><span className="language-option-name">{t.languages[language]}</span>
          {pending === language ? <span className="language-spinner" aria-hidden="true" /> : language === locale ? <span className="language-check"><Icon name="check" size={15} /></span> : <span className="language-option-dot" aria-hidden="true" />}
        </button>)}
      </form>
      <span className="sr-only" role="status">{pending ? t.changingLanguage : ''}</span>
    </div>}
  </div>;
}
