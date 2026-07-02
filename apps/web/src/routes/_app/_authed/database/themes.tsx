import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { ThemesTable } from "@/components/tables/themes/themes-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import {
  createThemeAuthorizationError,
  hasThemeMaintenanceAccess,
} from "@/lib/theme-maintenance"
import type { ThemeAuthorizationErrorResult } from "@/lib/theme-maintenance"

type LoadThemeMaintenanceThemesResult =
  | ThemeAuthorizationErrorResult
  | {
      status: "success"
      themes: ThemeOption[]
    }

type ThemeMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      themes: ThemeOption[]
    }

type ThemeReadDependencies = {
  getThemes: () => Promise<ThemeOption[]>
}

async function getDefaultThemeReadDependencies(): Promise<ThemeReadDependencies> {
  const { getThemes } = await import("@workspace/db")

  return {
    getThemes,
  }
}

export async function loadThemeMaintenanceThemes(
  collector: CollectorWithRole | null,
  dependencies?: ThemeReadDependencies
): Promise<LoadThemeMaintenanceThemesResult> {
  if (!hasThemeMaintenanceAccess(collector)) {
    return createThemeAuthorizationError()
  }

  const { getThemes } =
    dependencies ?? (await getDefaultThemeReadDependencies())

  return {
    status: "success",
    themes: await getThemes(),
  }
}

const getThemeMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadThemeMaintenanceThemes(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies ThemeMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    themes: result.themes,
  } satisfies ThemeMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/themes")({
  loader: () => getThemeMaintenanceLoaderData(),
  component: DatabaseThemesComponent,
})

function DatabaseThemesComponent() {
  return renderDatabaseThemesPage(Route.useLoaderData())
}

export function renderDatabaseThemesPage(
  loaderData: ThemeMaintenanceLoaderData
) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <ThemesTable themes={loaderData.themes} />
    </main>
  )
}
