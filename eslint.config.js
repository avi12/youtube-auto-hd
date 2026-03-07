import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import svelteEslint from "eslint-plugin-svelte";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import tsEslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...svelteEslint.configs["flat/recommended"],
  {
    ignores: [".wxt/**", "build/**", "test-browsers/**", "node_modules/**", ".playwright-*/**"],
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
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "svelte/mustache-spacing": "error",
      "svelte/html-self-closing": ["error", { void: "always", normal: "never", svg: "always", svelte: "always" }],
      "svelte/shorthand-attribute": ["error", { prefer: "always" }],
      "svelte/shorthand-directive": ["error", { prefer: "always" }],
      "svelte/spaced-html-comment": ["error", "always"],
      "svelte/no-spaces-around-equal-signs-in-attribute": "error",
      "svelte/html-closing-bracket-spacing": "error",
      "svelte/first-attribute-linebreak": ["error", { multiline: "below", singleline: "beside" }],
      "svelte/max-attributes-per-line": ["error", { multiline: 1, singleline: 5 }]
    }
  },
  {
    files: ["**/*.{ts,js}", "eslint.config.js"],
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
      ],
      "id-length": ["error", { min: 3, exceptions: ["i", "e", "id", "to"], exceptionPatterns: ["^_"] }],
      "prefer-const": "error"
    }
  }
];
