import copy from "rollup-plugin-copy";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import resolve from "@rollup/plugin-node-resolve";
import svgr from "@svgr/rollup";

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
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    image(),
    svgr({
      icon: false,
      svgoConfig: {
        plugins: [
          // {
          //     name: "removeViewBox",
          //     active: false,
          // },
        ],
      },
    }),
    postcss({
      modules: true,
    }),
    copy({
      targets: [{ src: "src/style", dest: "build" }],
      verbose: true,
    }),
  ],
};
