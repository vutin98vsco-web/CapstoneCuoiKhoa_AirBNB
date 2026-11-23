import { currentProperties } from '../lib/admin/catalog.server';
import { siteUrl } from '../lib/site';
export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const base = siteUrl();
  return [
    ...['','/rooms','/data-sources','/image-credits'].map(path => ({ url: base + path })),
    ...(await currentProperties()).map(property => ({ url: `${base}/phong/${encodeURIComponent(property.id)}`, ...(property.updatedAt ? { lastModified: property.updatedAt } : {}) })),
  ];
}
