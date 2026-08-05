type Environment = {
  STAGING_WEB: { fetch: (request: Request) => Promise<Response> }
}

export default {
  fetch(request: Request, environment: Environment) {
    const stagingUrl = new URL(request.url)
    stagingUrl.protocol = "https:"
    stagingUrl.host = "staging.coinarchive.app"
    stagingUrl.port = ""

    return environment.STAGING_WEB.fetch(new Request(stagingUrl, request))
  },
}
