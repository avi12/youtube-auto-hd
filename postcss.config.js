import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

/**
 * @type {import('postcss').ProcessOptions}
 */
export default {
  plugins: [
    tailwindcss,
    autoprefixer
  ]
};
