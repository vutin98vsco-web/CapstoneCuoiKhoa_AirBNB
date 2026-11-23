import Link from 'next/link';
import { destinations } from '../../lib/rooms';
import { localizeLocation } from '../../lib/i18n';
import { getI18n } from '../../lib/i18n-server';

export async function generateMetadata() { const { t } = await getI18n(); return { title: t.photoCredits }; }

export default async function ImageCreditsPage() {
  const { locale, t } = await getI18n();
  return <main className="shell detail image-credits-page" id="main-content">
    <Link href="/#destinations" className="back text-link">← {t.featuredDestinations}</Link>
    <h1>{t.photoCredits}</h1><p className="credits-intro">{t.photoCreditsIntro}</p><p className="credits-note">{t.photoChanges}</p>
    <div className="photo-credits-grid">{destinations.map(destination => <article className="photo-credit-card" key={destination.id}>
      <img src={destination.image} alt={destination.landmark[locale]} width="128" height="128" loading="lazy" />
      <div><p className="photo-credit-city">{localizeLocation(destination.name, locale)}</p><h2>{destination.landmark[locale]}</h2><p>{t.photographer}: {destination.photo.author}</p><p>{t.photoLicense}: <a href={destination.photo.licenseUrl} target="_blank" rel="noreferrer">{destination.photo.license}</a></p><div className="photo-credit-links"><a href={destination.photo.source} target="_blank" rel="noreferrer">{t.photoOriginal} ↗</a><a href={destination.image} download>{t.photoDownload} ↓</a></div></div>
    </article>)}</div>
  </main>;
}
