export function loadLocalEnvironmentFile(
  loadEnvironmentFile: typeof process.loadEnvFile | undefined,
  moduleUrl: string | null | undefined
) {
  if (
    loadEnvironmentFile === undefined ||
    moduleUrl === null ||
    moduleUrl === undefined ||
    !moduleUrl.startsWith("file:")
  ) {
    return
  }

  try {
    loadEnvironmentFile(new URL("../../../.env", moduleUrl))
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      throw error
    }
  }
}
