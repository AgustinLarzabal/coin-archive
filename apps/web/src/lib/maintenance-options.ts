type MaintenanceOptionsPage<TOption> = {
  data: TOption[]
  nextCursor: string | null
}

type ListMaintenanceOptions<TOption> = (input: {
  cursor?: string
  limit: number
}) => Promise<MaintenanceOptionsPage<TOption>>

export async function loadAllMaintenanceOptions<TOption>(
  listOptions: ListMaintenanceOptions<TOption>
): Promise<TOption[]> {
  const options: TOption[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await listOptions({
      ...(cursor === undefined ? {} : { cursor }),
      limit: 100,
    })
    options.push(...page.data)
    cursor = page.nextCursor ?? undefined
    if (cursor !== undefined && seenCursors.has(cursor)) {
      throw new Error("Maintenance options API repeated a cursor.")
    }
    if (cursor !== undefined) seenCursors.add(cursor)
  } while (cursor !== undefined)

  return options
}
