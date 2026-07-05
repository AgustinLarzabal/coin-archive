import type { ReactNode } from "react"

import { AccessDenied } from "@/components/access-denied"

type MaintenancePageLoadError<TError extends object> = {
  status: "error"
} & TError

type MaintenancePageLoadSuccess<TData extends object> = {
  status: "success"
} & TData

export type MaintenancePageLoadResult<
  TData extends object,
  TError extends object = object,
> =
  | MaintenancePageLoadError<TError>
  | MaintenancePageLoadSuccess<TData>

export type MaintenancePageLoaderData<TData extends object> =
  | {
      isAllowed: false
    }
  | ({
      isAllowed: true
    } & TData)

export function toMaintenancePageLoaderData<TData extends object>(
  result: MaintenancePageLoadResult<TData, object>
): MaintenancePageLoaderData<TData> {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  const { status: _status, ...data } = result

  return {
    isAllowed: true,
    ...data,
  }
}

export function renderMaintenancePage<TData extends object>(
  loaderData: MaintenancePageLoaderData<TData>,
  renderAllowed: (loaderData: { isAllowed: true } & TData) => ReactNode
) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return renderAllowed(loaderData)
}
