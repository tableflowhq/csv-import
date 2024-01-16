import peerDepsExternal from "rollup-plugin-peer-deps-external";

import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import resolve, { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const packageJson = require("./package.json");

export default {
  input: "src/js.tsx",
  output: [
    {
      file: "build/index.js",
      format: "umd",
      name: "CSVImporter",
      sourcemap: true,
    },
  ],
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    image(),
    postcss({}),
    json(),
  ],
};