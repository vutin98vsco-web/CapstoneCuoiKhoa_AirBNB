'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import Icon from './Icon';

export default function BackToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 300);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <button type="button" className="floating-back-top" hidden={!visible} aria-label={t.backTop} title={t.backTop} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><Icon name="up" size={24} /></button>;
}
