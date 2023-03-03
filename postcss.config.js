/**
 * @type {import('postcss').ProcessOptions}
 */
module.exports = {
  plugins: [
    require("tailwindcss"),
    require("autoprefixer")
  ]
};
