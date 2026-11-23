const nativeFetch = globalThis.fetch,
  fixture = process.env.TNB_EMAIL_FIXTURE_URL;
if (!fixture || new URL(fixture).hostname !== '127.0.0.1')
  throw Error('Email fixture must be local');
globalThis.fetch = (input, options) => {
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  return url.origin === 'https://api.resend.com'
    ? nativeFetch(fixture + url.pathname, options)
    : nativeFetch(input, options);
};
