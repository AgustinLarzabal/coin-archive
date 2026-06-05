import { asc } from "drizzle-orm"

import { db } from "../client"
import { distribution } from "../schema/distribution"
import type { Distribution } from "../schema/distribution"

const getDistributionsSelection = {
  createdAt: distribution.createdAt,
  code: distribution.code,
  id: distribution.id,
  name: distribution.name,
  updatedAt: distribution.updatedAt,
}

export type DistributionOption = Pick<
  Distribution,
  "code" | "createdAt" | "id" | "name" | "updatedAt"
>

export async function getDistributions(): Promise<DistributionOption[]> {
  return db
    .select(getDistributionsSelection)
    .from(distribution)
    .orderBy(asc(distribution.name), asc(distribution.code))
}
