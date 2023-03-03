/**
 * @type {import('prettier').Options}
 */
module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "none",
  bracketSpacing: true,
  bracketSameLine: true,
  plugins: [require.resolve("@plasmohq/prettier-plugin-sort-imports"), "prettier-plugin-svelte"],
  importOrder: ["^@plasmohq/(.*)$", "^~(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  arrowParens: "avoid"
}
