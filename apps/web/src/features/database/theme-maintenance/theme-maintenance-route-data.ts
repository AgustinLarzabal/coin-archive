import { createServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { toMaintenancePageLoaderData } from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import {
  createThemeAuthorizationError,
  hasThemeMaintenanceAccess,
} from "./actions"

type LoadResult = MaintenancePageLoadResult<
  {
    themes: ThemeOption[]
  },
  ReturnType<typeof createThemeAuthorizationError>
>

export type LoaderData = MaintenancePageLoaderData<{
  themes: ThemeOption[]
}>

type ReadDependencies = {
  getThemes: () => Promise<ThemeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getThemes } = await import("@coin-archive/db")

  return {
    getThemes,
  }
}

export async function loadThemeMaintenanceThemes(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasThemeMaintenanceAccess(collector)) {
    return createThemeAuthorizationError()
  }

  const { getThemes } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    themes: await getThemes(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadThemeMaintenanceThemes(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadThemeMaintenanceRouteData() {
  return getLoaderData()
}
