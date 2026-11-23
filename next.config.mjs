/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  poweredByHeader: false,
  outputFileTracingExcludes: { '/*': ['./.data/**/*','./.reference/**/*','./.env*','./.backups/**/*','./.git/**/*'] },
  outputFileTracingIncludes: { '/api/account/avatar': ['./node_modules/sharp/**/*','./node_modules/@img/**/*'] },
  async headers() { return [{ source: '/:path*',headers: [
    { key: 'X-Content-Type-Options',value: 'nosniff' },
    { key: 'Referrer-Policy',value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options',value: 'SAMEORIGIN' },
    { key: 'Permissions-Policy',value: 'camera=(), microphone=(), geolocation=()' },
  ] }]; },
};
export default config;
