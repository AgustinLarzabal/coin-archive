import { createServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createThemeAuthorizationError, hasThemeMaintenanceAccess } from "./actions"
import { ThemesTable } from "./table-workflow/themes-table"

type LoadResult =
  | ReturnType<typeof createThemeAuthorizationError>
  | {
      status: "success"
      themes: ThemeOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      themes: ThemeOption[]
    }

type ReadDependencies = {
  getThemes: () => Promise<ThemeOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getThemes } = await import("@workspace/db")

  return {
    getThemes,
  }
}

function toLoaderData(result: Awaited<LoadResult>): LoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    themes: result.themes,
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

  return toLoaderData(result)
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
