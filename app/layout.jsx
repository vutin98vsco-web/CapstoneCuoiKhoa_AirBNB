import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import LanguageProvider from '../components/LanguageProvider';
import AuthProvider from '../components/AuthProvider';
import { cookies } from 'next/headers';
import { currentUser } from '../lib/auth/session.server';
import BackToTop from '../components/BackToTop';
import { getI18n } from '../lib/i18n-server';
import './style.css';
import './header.css';
import './i18n.css';
import './language-switcher.css';
import './property.css';
import './booking.css';
import './account.css';
import './workspace.css';

export async function generateMetadata() {
  const { t } = await getI18n();
  return { applicationName: 'TNbnb', title: { default: `TNbnb — ${t.tagline}`, template: '%s | TNbnb' }, description: t.description, icons: { icon: [{ url: '/images/tnbnb-logo.svg', type: 'image/svg+xml' }, { url: '/images/tnbnb-favicon.png', type: 'image/png', sizes: '32x32' }], apple: '/images/tnbnb-apple-icon.png' } };
}

export default async function RootLayout({ children }) {
  const { locale, t } = await getI18n();
  const user = currentUser(await cookies());
  return (
    <html lang={locale}>
      <body>
        <LanguageProvider locale={locale}>
        <AuthProvider initialUser={user}>
        <a className="skip-link" href="#main-content">{t.skip}</a>
        <div id="top" />
        <SiteHeader />
        {children}
        <SiteFooter />
        <BackToTop />
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
