import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";

const packageJson = require("./package.json");

export default {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
    {
      file: "build/index-browser.js", // Specify the output file
      format: "umd", // Use 'umd' format for browser compatibility
      name: "Tableflow", // Replace 'MyLibrary' with a name for your bundle
      sourcemap: true, // Include source maps if needed
    },
  ],
  browser: true,
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    image(),
    postcss({}),
    json(),
  ],
};
