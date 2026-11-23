import Link from 'next/link';
import Icon from './Icon';
import { getI18n } from '../lib/i18n-server';
import { detailCopy } from '../lib/detail-copy';
import { bookingCopy } from '../lib/booking-copy';
import { accountCopy } from '../lib/account-copy';

export default async function SiteFooter() {
  const { locale, t } = await getI18n();
  return <footer className="site-footer" id="support"><div className="shell">
    <div className="footer-columns">
      <div className="footer-brand"><Link href="/" className="brand" aria-label={t.homeLabel}><img src="/images/tnbnb-logo.svg" alt="" width="32" height="32" />TNbnb</Link><p>{t.footerLine1}<br />{t.footerLine2}</p><span className="footer-tagline">{t.tagline}.</span></div>
      <div><h3>{t.explore}</h3><Link href="/rooms">{t.allStays}</Link><Link href="/rooms?type=beach">{t.stays.beach[0]}</Link><Link href="/rooms?type=spa">{t.stays.spa[0]}</Link><Link href="/rooms?type=pets">{t.travelPets}</Link></div>
      <div><h3>{t.yourTrip}</h3><Link href="/tai-khoan">{accountCopy[locale].account}</Link><Link href="/chuyen-di">{bookingCopy[locale].tripsTitle}</Link><Link href="/#destinations">{t.featuredDestinations}</Link><Link href="/rooms?favorites=1">{t.wishlist}</Link><Link href="/#stays">{t.staysTitle}</Link><Link href="/#about">{t.aboutBrand}</Link></div>
      <div><h3>{t.support}</h3><Link href="/rooms">{t.findWithBrand}</Link><Link href="/data-sources">{detailCopy[locale].sourceTitle}</Link><Link href="/image-credits">{t.photoCredits}</Link><a href="https://demo5.cybersoft.edu.vn/" target="_blank" rel="noreferrer">{t.referenceWebsite} ↗</a><p className="footer-help">{t.footerHelp1}<br />{t.footerHelp2}<br />{t.footerHelp3}</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} TNbnb · {t.learningProject}</span><span className="footer-locale"><Icon name="globe" size={16} /> {t.languages[locale]} <span>·</span> {t.currency}</span><a href="#top" className="back-top">{t.backTop} <Icon name="up" size={16} /></a></div>
  </div></footer>;
}
