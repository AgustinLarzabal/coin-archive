# Private Staging Domain

Coin Archive production will use `coinarchive.app`, while staging will use `staging.coinarchive.app`. Staging will be protected by Cloudflare Access before requests reach the application and will initially allow only the maintainer's Google identity. This keeps the shared production-like environment available for verification without making staging catalogue data or unfinished functionality public.
