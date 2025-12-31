import babel from "vite-plugin-babel";
import { resolve } from "node:path";

/**
 * @returns {import('vite').Plugin[]}
 */
export const creaoPlugins = () => [
  babel({
    enforce: "pre",
    include: ["src/**/*"],
    exclude: ["src/components/ui/**/*"],
    filter: /\.[jt]sx?$/,
    babelConfig: {
      plugins: [
        [
          "@babel/plugin-syntax-typescript",
          {
            isTSX: true,
          },
        ],
        [
          "@babel/plugin-transform-react-jsx-development",
          {
            runtime: "automatic",
            importSource: "react-jsx-source",
          },
        ],
      ],
    },
  }),
  {
    // add alias to config
    name: "creao-plugin",
    enforce: "post",
    config(config) {
      const rolldownOptions = config.optimizeDeps?.esbuildOptions;
      if (rolldownOptions) {
        // Remove jsx option as it's not supported in rolldown
        const { jsx, ...cleanOptions } = rolldownOptions;
        config.optimizeDeps.esbuildOptions = undefined;
        return {
          optimizeDeps: {
            rolldownOptions: cleanOptions,
          },
          resolve: {
            alias: {
              "react-jsx-source/jsx-dev-runtime": resolve(
                process.cwd(),
                "./src/sdk/core/internal/react-jsx-dev.js",
              ),
            },
          },
        };
      }
      return {
        resolve: {
          alias: {
            "react-jsx-source/jsx-dev-runtime": resolve(
              process.cwd(),
              "./src/sdk/core/internal/react-jsx-dev.js",
            ),
          },
        },
      };
    },
  },
];
