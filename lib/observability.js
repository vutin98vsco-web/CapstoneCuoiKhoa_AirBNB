export function reportServerError(operation, error) {
  // Log fixed operation names and machine codes, never messages, URLs or payloads.
  const code = typeof error?.code === 'string' && /^[a-zA-Z0-9_]{1,40}$/.test(error.code) ? error.code : 'unavailable';
  const name = typeof operation === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(operation) ? operation : 'request';
  console.error(JSON.stringify({ event: 'tnbnb_error', operation: name, code, at: new Date().toISOString() }));
}
