'use client';
import Link from 'next/link';
import { useLanguage } from '../components/LanguageProvider';
export default function PageError({ reset }) {
  const { locale } = useLanguage(); const vi = locale === 'vi';
  return <main id="main-content" className="shell detail"><div className="empty-state" role="alert"><h1>{vi ? 'Chưa thể tải trang' : 'Unable to load this page'}</h1><p>{vi ? 'Vui lòng thử lại sau ít phút.' : 'Please try again in a few moments.'}</p><div className="receipt-actions"><button className="button-primary" onClick={reset}>{vi ? 'Thử lại' : 'Try again'}</button><Link href="/" className="button-white">{vi ? 'Về trang chủ' : 'Home'}</Link></div></div></main>;
}
