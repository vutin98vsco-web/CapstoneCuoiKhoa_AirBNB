export function siteUrl() {
  const value = process.env.SITE_URL || 'https://tnbnb.vercel.app';
  const url = new URL(value);
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('SITE_URL must use HTTPS');
  if (url.username || url.password) throw new Error('Invalid SITE_URL');
  return url.origin;
}
