export const collectorRoleValues = ["collector", "editor", "admin"] as const

export type CollectorRole = (typeof collectorRoleValues)[number]

const collectorRoleValueSet = new Set<string>(collectorRoleValues)

export function isCollectorRole(value: string): value is CollectorRole {
  return collectorRoleValueSet.has(value)
}

export function hasEditorAccess(role: CollectorRole) {
  return role === "editor" || role === "admin"
}

export function hasAdminAccess(role: CollectorRole) {
  return role === "admin"
}
