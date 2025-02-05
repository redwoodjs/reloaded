import { dirname, resolve } from "node:path";
import { InlineConfig } from 'vite';

import reactPlugin from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

import {
  DEV_SERVER_PORT,
  VENDOR_DIST_DIR,
} from "../lib/constants.mjs";
import { transformJsxScriptTagsPlugin } from "./transformJsxScriptTagsPlugin.mjs";
import { useServerPlugin } from "./useServerPlugin.mjs";
import { useClientPlugin } from "./useClientPlugin.mjs";
import { useClientLookupPlugin } from "./useClientLookupPlugin.mjs";
import { miniflarePlugin } from "./miniflarePlugin.mjs";
import { asyncSetupPlugin } from "./asyncSetupPlugin.mjs";
import { restartPlugin } from "./restartPlugin.mjs";
import { acceptWasmPlugin } from "./acceptWasmPlugin.mjs";
import { copyPrismaWasmPlugin } from "./copyPrismaWasmPlugin.mjs";
import { moveStaticAssetsPlugin } from "./moveStaticAssetsPlugin.mjs";
import { configPlugin } from "./configPlugin.mjs";
import { $ } from '../lib/$.mjs';

export type RedwoodPluginOptions = {
  silent?: boolean;
  port?: number;
  restartOnChanges?: boolean;
  rootDir?: string;
  mode?: 'development' | 'production';
  configPath?: string;
  entry?: {
    client?: string;
    worker?: string;
  };
}

export const redwoodPlugin = (options: RedwoodPluginOptions = {}): InlineConfig['plugins'] => {
  const projectRootDir = process.cwd();
  const mode = options.mode ?? (process.env.NODE_ENV === "development" ? "development" : "production");
  const clientEntryPathname = resolve(projectRootDir, options?.entry?.client ?? 'src/client.tsx');
  const workerEntryPathname = resolve(projectRootDir, options?.entry?.worker ?? 'src/worker.tsx');

  return [
    configPlugin({
      mode,
      silent: options.silent ?? false,
      projectRootDir,
      clientEntryPathname,
      workerEntryPathname,
      port: options.port ?? DEV_SERVER_PORT,
    }),
    tsconfigPaths({ root: projectRootDir }),
    miniflarePlugin({
      rootDir: projectRootDir,
      viteEnvironment: { name: "worker" },
      workerEntryPathname,
      configPath: options.configPath ?? resolve(projectRootDir, "wrangler.toml"),
    }),
    reactPlugin(),
    useServerPlugin(),
    useClientPlugin(),
    acceptWasmPlugin(),
    asyncSetupPlugin({
      async setup({ command }) {
        console.log('Generating prisma client...')
        await $`pnpm prisma generate`;

        if (command !== 'build') {
          console.log('Generating wrangler types...')
          await $`pnpm wrangler types`;
        }
      }
    }),
    ...options.restartOnChanges
      ? [restartPlugin({
        filter: (filepath: string) =>
          !filepath.endsWith(".d.ts") &&
          (filepath.endsWith(".ts") ||
            filepath.endsWith(".tsx") ||
            filepath.endsWith(".mts") ||
            filepath.endsWith(".js") ||
            filepath.endsWith(".mjs") ||
            filepath.endsWith(".jsx") ||
            filepath.endsWith(".json")) &&
          dirname(filepath) === projectRootDir,
      })]
      : [],
    useClientLookupPlugin({
      rootDir: projectRootDir,
      containingPath: "./src/app",
    }),
    transformJsxScriptTagsPlugin({
      manifestPath: resolve(projectRootDir, "dist", "client", ".vite", "manifest.json"),
    }),
    copyPrismaWasmPlugin({ rootDir: projectRootDir }),
    moveStaticAssetsPlugin({ rootDir: projectRootDir }),
  ];
}
