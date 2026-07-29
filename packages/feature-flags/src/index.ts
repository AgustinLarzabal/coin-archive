export const productFlags = {
  showSignInButton: {
    defaultValue: true,
    description:
      "Controls whether an unauthenticated person sees the header Sign in button.",
  },
} as const

export type ProductFlags = {
  [FlagName in keyof typeof productFlags]: (typeof productFlags)[FlagName]["defaultValue"]
}

export const productFlagDefaults: ProductFlags = Object.fromEntries(
  Object.entries(productFlags).map(([name, flag]) => [name, flag.defaultValue])
) as ProductFlags
