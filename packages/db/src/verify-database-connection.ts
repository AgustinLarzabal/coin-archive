import { createDatabaseClient } from "./database"
import { getDatabaseUrl } from "./env"

async function main() {
  const client = createDatabaseClient(getDatabaseUrl())

  try {
    await client`select 1`
    console.log("Direct PostgreSQL connection verified.")
  } finally {
    await client.end()
  }
}

void main()
