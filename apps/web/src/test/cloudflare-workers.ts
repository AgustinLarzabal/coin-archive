export const env = {
  API: {
    fetch: (request: Request) => globalThis.fetch(request.url),
  },
  ARCHIVE_RATE_LIMIT: {
    limit: async () => ({ success: true }),
  },
}
