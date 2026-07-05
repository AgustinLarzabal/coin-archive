import { createServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  type MaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import { createThemeAuthorizationError, hasThemeMaintenanceAccess } from "./actions"
import { ThemesTable } from "./table-workflow/themes-table"

type LoadResult = MaintenancePageLoadResult<{
  themes: ThemeOption[]
}, ReturnType<typeof createThemeAuthorizationError>>

type LoaderData = MaintenancePageLoaderData<{
  themes: ThemeOption[]
}>

type ReadDependencies = {
  getThemes: () => Promise<ThemeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getThemes } = await import("@workspace/db")

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

type ThemeMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function ThemeMaintenanceRouteComponent({
  loaderData,
}: ThemeMaintenanceRouteComponentProps) {
  return renderThemeMaintenancePage(loaderData)
}

export function renderThemeMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ themes }) => (
    <main className="mt-8">
      <ThemesTable themes={themes} />
    </main>
  ))
}
