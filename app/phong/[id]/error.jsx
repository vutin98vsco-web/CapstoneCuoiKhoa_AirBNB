'use client';
import Link from 'next/link';
import { useLanguage } from '../../../components/LanguageProvider';
import { cyberSoftCopy } from '../../../lib/cybersoft-copy';
export default function PropertyError({ reset }) {
  const { locale } = useLanguage(); const c = cyberSoftCopy[locale];
  return <main id="main-content" className="shell detail"><div className="empty-state" role="alert"><h1>{c.loadError}</h1><p>{c.loadErrorNote}</p><div className="receipt-actions"><button type="button" className="button-primary" onClick={reset}>{c.retry}</button><Link className="button-white" href="/rooms?source=tnbnb">{c.back}</Link></div></div></main>;
}
