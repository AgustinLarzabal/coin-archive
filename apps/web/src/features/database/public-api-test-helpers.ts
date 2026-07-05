import { readdirSync, readFileSync } from "node:fs"

export function getFeatureSourceFiles(
  directoryUrl: URL,
  recursive = false,
  prefix = ""
): string[] {
  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      if (!recursive) {
        return []
      }

      return getFeatureSourceFiles(
        new URL(`${entry.name}/`, directoryUrl),
        recursive,
        nextPath
      )
    }

    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
      return []
    }

    return [nextPath]
  })
}

export function readFeatureSource(directoryUrl: URL, filePath: string) {
  return readFileSync(new URL(filePath, directoryUrl), "utf8")
}
