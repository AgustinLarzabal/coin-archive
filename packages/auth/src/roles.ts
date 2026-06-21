export const collectorRoleValues = ["collector", "editor", "admin"] as const

export type CollectorRole = (typeof collectorRoleValues)[number]

export function isCollectorRole(value: string): value is CollectorRole {
  return collectorRoleValues.includes(value as CollectorRole)
}

export function hasEditorAccess(role: CollectorRole) {
  return role === "editor" || role === "admin"
}

export function hasAdminAccess(role: CollectorRole) {
  return role === "admin"
}
