import { siteUrl } from '../lib/site';
export default function robots() {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/','/quan-tri','/tai-khoan','/dang-nhap','/dang-ky','/quen-mat-khau','/dat-lai-mat-khau','/xac-minh-email','/dat-phong','/chuyen-di','/rooms?favorites=1'] }, sitemap: `${siteUrl()}/sitemap.xml`, host: siteUrl() };
}
