import {
  type InlineConfig,
  type Plugin,
  type ViteDevServer,
  mergeConfig,
} from "vite";
import { resolve } from "node:path";
import {
  CLIENT_DIST_DIR,
  DEV_SERVER_PORT,
  MANIFEST_PATH,
  RELATIVE_CLIENT_PATHNAME,
  RELATIVE_WORKER_PATHNAME,
  SRC_DIR,
  VENDOR_DIST_DIR,
  WORKER_DIST_DIR,
} from "../lib/constants.mjs";

import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

import { transformJsxScriptTagsPlugin } from "../lib/vitePlugins/transformJsxScriptTagsPlugin.mjs";
import { useServerPlugin } from "../lib/vitePlugins/useServerPlugin.mjs";
import { useClientPlugin } from "../lib/vitePlugins/useClientPlugin.mjs";
import commonjsPlugin from "vite-plugin-commonjs";
import { useClientLookupPlugin } from "../lib/vitePlugins/useClientLookupPlugin.mjs";
import { transformJsxLinksTagsPlugin } from "../lib/vitePlugins/transformJsxLinksTagsPlugin.mjs";

const MODE =
  process.env.NODE_ENV === "development" ? "development" : "production";

export type DevConfigContext = {
  updateWorker: () => Promise<void>;
};

export const viteConfigs = {
  main: (): InlineConfig => ({
    mode: MODE,
    logLevel: process.env.VERBOSE ? "info" : "warn",
    build: {
      minify: MODE !== "development",
      sourcemap: true,
    },
    define: {
      "process.env.PREVIEW": JSON.stringify(
        Boolean(process.env.PREVIEW ?? false),
      ),
      "process.env.NODE_ENV": JSON.stringify(MODE),
    },
    plugins: [
      commonjsPlugin({
        filter: (id) => {
          return id.includes("react-server-dom-webpack-server.edge");
        },
      }),
      useServerPlugin(),
      useClientPlugin(),
    ],
    environments: {
      client: {
        consumer: "client",
        build: {
          outDir: CLIENT_DIST_DIR,
          manifest: true,
          rollupOptions: {
            input: {
              client: RELATIVE_CLIENT_PATHNAME,
              style: resolve(SRC_DIR, "app", "style.css"),
            },
          },
        },
      },
      worker: {
        resolve: {
          conditions: ["module", "workerd", "react-server"],
          noExternal: true,
        },
        build: {
          outDir: WORKER_DIST_DIR,
          ssr: true,
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
            input: {
              worker: RELATIVE_WORKER_PATHNAME,
            },
          },
        },
      },
    },
    resolve: {
      alias: {
        "vendor/react-ssr": resolve(VENDOR_DIST_DIR, "react-ssr.js"),
      },
    },
    server: {
      middlewareMode: true,
      port: DEV_SERVER_PORT,
    },
    builder: {
      async buildApp(builder) {
        await builder.build(builder.environments["client"]);
        await builder.build(builder.environments["worker"]);
      },
    },
    css: {
      postcss: {
        plugins: [tailwind, autoprefixer],
      },
    },
  }),
  dev: (context: DevConfigContext): InlineConfig =>
    mergeConfig(viteConfigs.main(), {
      plugins: [
        hmrPlugin(context),
        // context(justinvdm, 2024-12-03): vite needs the virtual module created by this plugin to be around,
        // even if the code path that use the virtual module are not reached in dev
        useClientLookupPlugin({ filesContainingUseClient: [] }),
      ],
    }),
  deploy: ({
    filesContainingUseClient,
  }: {
    filesContainingUseClient: string[];
  }): InlineConfig =>
    mergeConfig(viteConfigs.main(), {
      plugins: [
        transformJsxScriptTagsPlugin({
          manifestPath: MANIFEST_PATH,
        }),
        transformJsxLinksTagsPlugin({
          manifestPath: MANIFEST_PATH,
        }),
        useClientLookupPlugin({
          filesContainingUseClient,
        }),
      ],
    }),
};

// context(justinvdm, 2024-11-20): While it may seem odd to use the dev server and HMR only to do full rebuilds,
// we leverage the dev server's module graph to efficiently determine if the worker bundle needs to be
// rebuilt. This allows us to avoid unnecessary rebuilds when changes don't affect the worker.
// Still, first prize would be to not need to rebundle at all.
// https://vite.dev/guide/api-plugin.html#handlehotupdate
const hmrPlugin = ({ updateWorker }: DevConfigContext): Plugin => ({
  name: "rw-reloaded-hmr",
  handleHotUpdate: async ({
    file,
    server,
  }: {
    file: string;
    server: ViteDevServer;
  }) => {
    // todo(peterp, 2024-12-05): Use proper exclude, filter pattern,
    // as documented here: https://vite.dev/guide/api-plugin.html#filtering-include-exclude-pattern
    if (file.endsWith(".d.ts") || file.includes("/.wrangler/")) {
      return [];
    }

    console.log("[HMR]", file);
    const module = server.moduleGraph.getModuleById(file);

    const isImportedByWorkerFile = [...(module?.importers || [])].some(
      (importer) => importer.file === resolve("/", RELATIVE_WORKER_PATHNAME),
    );

    try {
      await updateWorker();
    } catch (e: any) {
      // todo(peterp, 2024-12-05): Figure out what to do with errors.
    }
    server.ws.send({ type: "full-reload" });
    return [];
  },
});
