import eslint from "@eslint/js";
import avi12 from "eslint-config-avi12";
import svelteEslint from "eslint-plugin-svelte";
import { globalIgnores } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  globalIgnores([".wxt/**", "build/**", "test-browsers/**", "node_modules/**", "eslint.config.js"]),
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...svelteEslint.configs["flat/recommended"],
  ...avi12,
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsEslint.parser
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: true
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }]
    }
  },
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      parser: tsEslint.parser
    },
    plugins: {
      perfectionist
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "perfectionist/sort-imports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          newlinesBetween: "ignore",
          sortSideEffects: true,
          groups: [["side-effect", "builtin", "external", "internal", "parent", "sibling", "index", "unknown"]]
        }
      ]
    }
  }
];
