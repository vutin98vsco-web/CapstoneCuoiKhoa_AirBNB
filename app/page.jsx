import Link from 'next/link';
import { redirect } from 'next/navigation';
import { destinations, stayTypes } from '../lib/rooms';
import { getI18n } from '../lib/i18n-server';
import { localizeLocation, localizeStay } from '../lib/i18n';
import SearchForm from '../components/SearchForm';
import HeroVideo from '../components/HeroVideo';
import Icon from '../components/Icon';
import StayFilters from '../components/StayFilters';

export default async function Home({ searchParams }) {
  const params = await searchParams;
  if (params.q || params.guests) redirect(`/rooms?${new URLSearchParams(Object.entries(params).filter(([, value]) => typeof value === 'string'))}`);
  const { locale, t } = await getI18n();
  return <main id="main-content">
    <section className="hero" aria-labelledby="hero-heading" data-header-backdrop>
      <HeroVideo /><div className="hero-shade" />
      <div className="shell hero-content"><div className="hero-lockup"><h1 id="hero-heading">TNbnb</h1><p className="hero-tagline">{t.tagline}</p></div></div>
      <div className="hero-wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 80C300 100 890 110 1440 0V90H0Z" fill="white" /></svg></div>
    </section>
    <div className="shell home-search"><SearchForm formId="home-stay-search" /><StayFilters locale={locale} searchFormId="home-stay-search" /></div>
    <section className="shell section destinations-section" id="destinations" aria-labelledby="destinations-heading">
      <h2 id="destinations-heading" className="sr-only">{t.destinationsTitle}</h2>
      <div className="destination-grid">{destinations.map(destination => { const name = localizeLocation(destination.name, locale); const landmark = destination.landmark[locale]; return <Link key={destination.id} href={`/rooms?q=${encodeURIComponent(name)}`} className="destination-card" title={`${landmark} · ${name}`}><img src={destination.image} alt={`${landmark}, ${name}`} width="48" height="48" loading="lazy" decoding="async" /><div><h3>{name}</h3><p>{t.exploreStays}</p></div><Icon name="arrow" size={17} /></Link>; })}</div>
      <div className="destination-photo-credit"><Link href="/image-credits">{t.photoCredits} ↗</Link></div>
    </section>
    <section className="shell section stays-section" id="stays" aria-labelledby="stays-heading">
      <div className="section-heading"><h2 id="stays-heading">{t.staysTitle}</h2><Link className="text-link" href="/rooms">{t.findYourPlace} <Icon name="arrow" size={18} /></Link></div>
      <div className="stay-grid">{stayTypes.map(type => { const stay = localizeStay(type, locale); return <Link href={`/rooms?type=${stay.id}`} className="stay-card" key={stay.id}><div className="stay-image"><img src={stay.image} alt={stay.title} width="600" height="600" loading="lazy" /><span className="stay-arrow"><Icon name="arrow" size={20} /></span></div><h3>{stay.title}</h3><p>{stay.subtitle}</p></Link>; })}</div>
    </section>
    <section className="shell about-section" id="about" aria-labelledby="about-heading"><div className="about-banner"><img src="/images/stay-3.jpg" alt={t.natureImage} width="1200" height="600" loading="lazy" /><div className="about-overlay" /><div className="about-content"><p className="eyebrow">{t.aboutEyebrow}</p><h2 id="about-heading">{t.aboutTitle1}<br />{t.aboutTitle2}</h2><p>{t.aboutLine1}<br />{t.aboutLine2}</p><Link href="/rooms" className="button-white">{t.tripInspiration} <Icon name="arrow" size={18} /></Link></div></div></section>
    <section className="shell benefits" aria-label={t.experience}>{t.benefits.map(([title, description], index) => <div key={index}><span className="benefit-icon"><Icon name={['home','leaf','heart'][index]} size={24} /></span><div><h3>{title}</h3><p>{description}</p></div></div>)}</section>
  </main>;
}
