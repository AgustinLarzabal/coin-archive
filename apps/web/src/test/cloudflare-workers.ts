export const env = {
  API: {
    fetch: (request: Request) => globalThis.fetch(request.url),
  },
}
