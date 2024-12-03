import {
  type InlineConfig,
  type Plugin,
  type ViteDevServer,
  mergeConfig,
} from "vite";
import { resolve } from "node:path";
import {
  CLIENT_DIST_DIR,
  D1_PERSIST_PATH,
  DEV_SERVER_PORT,
  RELATIVE_CLIENT_PATHNAME,
  RELATIVE_WORKER_PATHNAME,
  VENDOR_DIST_DIR,
  WORKER_DIST_DIR,
} from "./constants.mjs";
import { transformJsxScriptTagsPlugin } from "./vitePlugins/transformJsxScriptTagsPlugin.mjs";
import { useServerPlugin } from "./vitePlugins/useServerPlugin.mjs";
import { useClientPlugin } from "./vitePlugins/useClientPlugin.mjs";
import commonjsPlugin from "vite-plugin-commonjs";
import { useClientLookupPlugin } from "./vitePlugins/useClientLookupPlugin.mjs";
import { MiniflareOptions } from "miniflare";
import { getD1Databases } from "./getD1Databases";

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
          manifestPath: resolve(CLIENT_DIST_DIR, ".vite/manifest.json"),
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
const hmrPlugin = ({ updateWorker }: DevConfigContext): Plugin => ({
  name: "rw-reloaded-hmr",
  handleHotUpdate: async ({
    file,
    server,
  }: {
    file: string;
    server: ViteDevServer;
  }) => {
    const module = server.moduleGraph.getModuleById(file);

    const isImportedByWorkerFile = [...(module?.importers || [])].some(
      (importer) => importer.file === resolve("/", RELATIVE_WORKER_PATHNAME),
    );

    // todo(justinvdm, 2024-11-19): Send RSC update to client
    if (isImportedByWorkerFile) {
      await updateWorker();
    }
  },
});

export const miniflareOptions: Partial<MiniflareOptions> = {
  // context(justinvdm, 2024-11-21): `npx wrangler d1 migrations apply` creates a sqlite file in `.wrangler/state/v3/d1`
  d1Persist: D1_PERSIST_PATH,
  modules: true,
  compatibilityFlags: [
    "streams_enable_constructors",
    "transformstream_enable_standard_constructor",
    "nodejs_compat",
  ],
  d1Databases: await getD1Databases(),
};
