export const authSchemaTimestamptzDateColumn = {
  withTimezone: true,
  mode: "date",
} as const

export const collectorRoleValues = ["collector", "editor", "admin"] as const
export const defaultCollectorRole = "collector" as const
