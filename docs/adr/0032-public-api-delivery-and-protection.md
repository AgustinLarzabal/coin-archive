# Public API Delivery and Protection

Coin Archive will expose its future public API at `api.coinarchive.app` in production and `api.staging.coinarchive.app` in staging. Browser requests may originate only from the matching application hostname: `https://coinarchive.app` for production and `https://staging.coinarchive.app` for staging. Server-to-server requests are not subject to this browser CORS policy.

Public API read responses will use `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400`. A client IP may make up to 120 requests per minute in each API environment; requests beyond that limit receive `429 Too Many Requests` with a `Retry-After` header.

Workers invocation logging remains enabled at full sampling. Application logging may include the request method, route template, status, duration, request ID, and unexpected error details, and has a 30-day retention period. It must not include request or response bodies, cookies, authorization headers, database connection strings, or raw personal data.

The existing environment-specific Surface Image delivery policy remains in force. Production API responses may use the public `images.coinarchive.app` hostname; staging API responses may use only the Cloudflare Access-protected `images.staging.coinarchive.app` hostname. An environment must neither accept nor return the other environment's Surface Image URLs. Production Surface Images are publicly cacheable for one year because replacements receive new opaque URLs.
