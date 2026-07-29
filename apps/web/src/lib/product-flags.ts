import { productFlagDefaults } from "@coin-archive/feature-flags"

function getBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  return defaultValue
}

export function getProductFlags() {
  return {
    ...productFlagDefaults,
    showSignInButton: getBooleanFlag(
      import.meta.env.VITE_SHOW_SIGN_IN_BUTTON,
      productFlagDefaults.showSignInButton
    ),
  }
}
