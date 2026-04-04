import eslint from "@eslint/js";
import avi12 from "eslint-config-avi12";
import importNewlines from "eslint-plugin-import-newlines";
import perfectionist from "eslint-plugin-perfectionist";
import svelteEslint from "eslint-plugin-svelte";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  globalIgnores([".wxt/**", "build/**"]),
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
        chrome: true
      }
    },
    rules: {
      "import/order": "off",
      "prefer-const": ["error", { destructuring: "all" }]
    }
  },
  {
    files: ["src/**/*.{ts,js}"],
    languageOptions: {
      parser: tsEslint.parser,
      globals: {
        ...globals.browser,
        chrome: true
      }
    }
  },
  {
    files: ["**/*.{ts,js}"],
    ignores: ["src/**"],
    languageOptions: {
      parser: tsEslint.parser,
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["**/*.{ts,js}"],
    plugins: {
      perfectionist,
      "import-newlines": importNewlines
    },
    rules: {
      "import-newlines/enforce": ["error", { items: 3, forceSingleLine: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "id-length": ["error", { min: 3, exceptions: ["_", "e"], properties: "never" }],
      "import/order": "off",
      "perfectionist/sort-imports": ["error", { internalPattern: ["^@/"], newlinesBetween: 0 }]
    }
  }
];
