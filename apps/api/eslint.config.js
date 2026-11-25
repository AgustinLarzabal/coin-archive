// @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  ...tanstackConfig,
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      "import/no-cycle": "off",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          distinctGroup: true,
          sortTypesGroup: false,
          named: true,
          warnOnUnassignedImports: false,
        },
      ],
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: { "@typescript-eslint/no-unnecessary-type-assertion": "off" },
  },
  {
    ignores: ["dist/**", "eslint.config.js"],
  },
]
