import Link from 'next/link';
import { getI18n } from '../lib/i18n-server';

export default async function NotFound() {
  const { t } = await getI18n();
  return <main className="shell detail" id="main-content"><div className="empty-state"><p className="eyebrow coral">{t.notFoundEyebrow}</p><h1>{t.notFoundTitle}</h1><p>{t.notFoundDescription}</p><Link className="button-primary" href="/rooms">{t.otherStays} →</Link></div></main>;
}
