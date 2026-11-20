export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (
      request.method !== "GET" ||
      !(
        pathname === "/v1/coins" ||
        pathname === "/v1/issuers" ||
        /^\/v1\/coins\/[0-9a-f-]{36}$/.test(pathname)
      )
    ) {
      return new Response("Not found", { status: 404 })
    }
    return env.API.fetch(request)
  },
}
