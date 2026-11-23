'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from './LanguageProvider';
import { bookingCopy } from '../lib/booking-copy';
import { useAuth } from './AuthProvider';
import { accountCopy } from '../lib/account-copy';
import { adminCopy } from '../lib/admin-copy';

export default function SiteHeader() {
  const { t, locale } = useLanguage();
  const { user, signOut } = useAuth(); const c = accountCopy[locale]; const router = useRouter();
  const [logoutBusy, setLogoutBusy] = useState(false); const [logoutError, setLogoutError] = useState(false);
  const pathname = usePathname();
  const [returnTo, setReturnTo] = useState(pathname);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => { setReturnTo(`${window.location.pathname}${window.location.search}`); }, [pathname, menu]);
  const [overHero, setOverHero] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef(null);
  const wrapper = useRef(null);
  const mobileTrigger = useRef(null);
  useEffect(() => {
    if (pathname !== '/') { setOverHero(true); setScrolled(true); return; }
    const hero = document.querySelector('[data-header-backdrop]');
    if (!hero) { setOverHero(false); return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      setOverHero(hero.getBoundingClientRect().bottom > (header.current?.offsetHeight || 0));
      setScrolled(window.scrollY > 100);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
  useEffect(() => {
    const outside = (event) => { if (!wrapper.current?.contains(event.target)) setMenu(false); if (!header.current?.contains(event.target)) setMobile(false); };
    const key = (event) => { if (event.key === 'Escape') { if (header.current?.querySelector('.nav-open')) mobileTrigger.current?.focus(); setMenu(false); setMobile(false); } };
    const resize = () => { if (window.innerWidth > 1050) setMobile(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); window.removeEventListener('resize', resize); };
  }, []);
  const close = () => { setMenu(false); setMobile(false); };
  async function logout() { if (logoutBusy) return; setLogoutBusy(true); setLogoutError(false); try { await signOut(); close(); router.push('/dang-nhap'); router.refresh(); } catch { setLogoutError(true); } finally { setLogoutBusy(false); } }
  return <header ref={header} className={`site-header reference-header ${pathname === '/' && overHero ? 'header-over-video' : 'header-over-content'} ${scrolled ? 'header-scrolled' : ''}`}>
    <div className="shell header-inner">
      <Link href="/" className="brand" aria-label={t.homeLabel} onClick={close}><img src="/images/tnbnb-logo.svg" alt="" width="40" height="40" /><span>TNbnb</span></Link>
      <nav id="main-navigation" className={`main-nav ${mobile ? 'nav-open' : ''}`} aria-label={t.mainNav}>
        <Link href="/" onClick={close} className={pathname === '/' ? 'active' : ''} aria-current={pathname === '/' ? 'page' : undefined}>{t.home}</Link>
        <Link href="/#about" onClick={close}>{t.about}</Link>
        <Link href="/#stays" onClick={close}>{t.services}</Link>
        <Link href="/rooms" onClick={close} className={pathname === '/rooms' ? 'active' : ''} aria-current={pathname === '/rooms' ? 'page' : undefined}>{t.pricing}</Link>
        <Link href="/#support" onClick={close}>{t.contact}</Link>
      </nav>
      <div className="header-actions">
        <div onClickCapture={() => { setMobile(false); setMenu(false); }}><LanguageSwitcher /></div>
        <div ref={wrapper} className="profile-wrap">
          <button className="profile-button" aria-label={t.accountMenu} aria-expanded={menu} aria-controls="profile-menu" onClick={() => { setMenu(!menu); setMobile(false); }}><span className="profile-avatar">{user ? user.hasAvatar ? <img src={`/api/account/avatar?v=${user.avatarVersion}`} alt="" width="36" height="36" /> : <span className="account-initial">{user.name.charAt(0).toUpperCase()}</span> : <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="4" /><path d="M4 20a8 8 0 0 1 16 0v1a1 1 0 0 1-1-1Z" /></svg>}</span></button>
          {menu && <div id="profile-menu" className="profile-menu">{user ? <><div className="profile-identity"><strong>{user.name}</strong><small>{c.account}</small></div><Link href="/tai-khoan" onClick={close}>{c.profile}<Icon name="user" size={17} /></Link></> : <><strong>{c.account}</strong><Link href={`/dang-nhap?returnTo=${encodeURIComponent(returnTo)}`} onClick={close}>{c.login}<Icon name="user" size={17} /></Link><Link href={`/dang-ky?returnTo=${encodeURIComponent(returnTo)}`} onClick={close}>{c.register}<Icon name="arrow" size={17} /></Link></>}<Link href="/chuyen-di" onClick={close}>{bookingCopy[locale].tripsTitle}<Icon name="calendar" size={17} /></Link><Link href="/rooms?favorites=1" onClick={close}>{t.savedStays} <Icon name="heart" size={17} /></Link><Link href="/rooms" onClick={close}>{t.findStays} <Icon name="search" size={17} /></Link>{user?.role === 'admin' && <Link href="/quan-tri" onClick={close}>{adminCopy[locale].title}<Icon name="shield" size={17} /></Link>}{user && <button className="profile-logout" type="button" disabled={logoutBusy} onClick={logout}>{logoutBusy ? c.working : c.logout}<Icon name="arrow" size={17} /></button>}{logoutError && <span className="profile-error" role="alert">{c.logoutError}</span>}</div>}
        </div>
        <button ref={mobileTrigger} className="mobile-toggle icon-button" aria-label={mobile ? t.closeNav : t.openNav} aria-expanded={mobile} aria-controls="main-navigation" onClick={() => { setMobile(!mobile); setMenu(false); }}><Icon name={mobile ? 'close' : 'menu'} /></button>
      </div>
    </div>
  </header>;
}
