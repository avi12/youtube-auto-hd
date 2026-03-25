import eslint from "@eslint/js";
import avi12 from "eslint-config-avi12";
import perfectionist from "eslint-plugin-perfectionist";
import svelteEslint from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...svelteEslint.configs["flat/recommended"],
  ...avi12,
  {
    ignores: [".wxt/**", "build/**", "test-browsers/**", "node_modules/**", ".playwright-*/**"]
  },
  {
    rules: {
      "import/order": "off"
    }
  },
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
    }
  },
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      parser: tsEslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: true
      }
    },
    plugins: {
      perfectionist
    },
    rules: {
      "@stylistic/no-extra-parens": "warn",
      "@stylistic/max-len": ["warn", { code: 120 }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
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
