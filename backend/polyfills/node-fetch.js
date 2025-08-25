if (typeof globalThis.fetch === 'undefined') {
  const fetchModule = await import('node-fetch');
  globalThis.fetch = fetchModule.default;
  globalThis.Headers = fetchModule.Headers;
  globalThis.Request = fetchModule.Request;
  globalThis.Response = fetchModule.Response;
}
