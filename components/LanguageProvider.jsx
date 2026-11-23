'use client';

import { createContext, useContext } from 'react';
import { dictionary } from '../lib/i18n';

const LanguageContext = createContext('vi');
export default function LanguageProvider({ locale, children }) { return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>; }
export function useLanguage() { const locale = useContext(LanguageContext); return { locale, t: dictionary(locale) }; }
