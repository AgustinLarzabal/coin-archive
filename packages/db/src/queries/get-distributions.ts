import { asc } from "drizzle-orm"

import { db } from "../client"
import { distribution } from "../schema/distribution"
import type { Distribution } from "../schema/distribution"

const getDistributionsSelection = {
  id: distribution.id,
  code: distribution.code,
  name: distribution.name,
  createdAt: distribution.createdAt,
  updatedAt: distribution.updatedAt,
}

export type DistributionOption = Pick<
  Distribution,
  "id" | "code" | "name" | "createdAt" | "updatedAt"
>

export async function getDistributions(): Promise<DistributionOption[]> {
  return db
    .select(getDistributionsSelection)
    .from(distribution)
    .orderBy(asc(distribution.name), asc(distribution.code))
}
