import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { account } from "./schema/account"
import { catalogue } from "./schema/catalogue"
import { coin } from "./schema/coin"
import { coinReference } from "./schema/coin-reference"
import { coinMint } from "./schema/coin-mint"
import { coinRuler } from "./schema/coin-ruler"
import { coinSurface } from "./schema/coin-surface"
import { coinSurfaceEngraver } from "./schema/coin-surface-engraver"
import { coinTheme } from "./schema/coin-theme"
import { composition } from "./schema/composition"
import { currency } from "./schema/currency"
import { distribution } from "./schema/distribution"
import { edge } from "./schema/edge"
import { engraver } from "./schema/engraver"
import { issuer } from "./schema/issuer"
import { mint } from "./schema/mint"
import { maintenanceIdempotency } from "./schema/maintenance-idempotency"
import { orientation } from "./schema/orientation"
import { rim } from "./schema/rim"
import { ruler } from "./schema/ruler"
import { rulerGroup } from "./schema/ruler-group"
import { session } from "./schema/session"
import { shape } from "./schema/shape"
import { surfaceImageCleanupFailure } from "./schema/surface-image-cleanup-failure"
import { technique } from "./schema/technique"
import { theme } from "./schema/theme"
import { user } from "./schema/user"
import { verification } from "./schema/verification"

export const databaseSchema = {
  account,
  catalogue,
  coin,
  coinMint,
  coinReference,
  coinRuler,
  coinSurface,
  coinSurfaceEngraver,
  coinTheme,
  composition,
  currency,
  distribution,
  edge,
  engraver,
  issuer,
  mint,
  maintenanceIdempotency,
  orientation,
  rim,
  ruler,
  rulerGroup,
  session,
  shape,
  surfaceImageCleanupFailure,
  technique,
  theme,
  user,
  verification,
} as const

export function createDatabaseClient(databaseUrl: string) {
  return postgres(databaseUrl, {
    connection: {
      // This catalog app issues wide, low-row-count queries. PostgreSQL JIT adds
      // over a second of compilation overhead here while saving almost no
      // execution time, so disable it for these sessions.
      jit: "off",
    },
    prepare: false,
  })
}

export function createDatabase(databaseUrl: string) {
  const client = createDatabaseClient(databaseUrl)

  return {
    client,
    db: drizzle(client, {
      schema: databaseSchema,
    }),
  }
}
