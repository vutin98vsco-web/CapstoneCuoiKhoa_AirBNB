// Loaded only by the isolated HTTP checker; never imported by application code.
const nativeFetch = globalThis.fetch;
const fixture = process.env.TNB_CYBERSOFT_FIXTURE_URL;
if (!fixture || new URL(fixture).hostname !== '127.0.0.1') throw new Error('CyberSoft test fixture must be on loopback.');
globalThis.fetch = (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  return url.origin === 'https://airbnbnew.cybersoft.edu.vn' ? nativeFetch(`${fixture}${url.pathname}${url.search}`, options) : nativeFetch(input, options);
};
