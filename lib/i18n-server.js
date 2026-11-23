import 'server-only';
import { cookies } from 'next/headers';
import { dictionary, localeCookie } from './i18n';

export async function getI18n() {
  const locale = (await cookies()).get(localeCookie)?.value === 'en' ? 'en' : 'vi';
  return { locale, t: dictionary(locale) };
}
