import { mergeConfig, type InlineConfig } from 'vite';
import { resolve } from 'node:path';

const __dirname = new URL('.', import.meta.url).pathname;
export const RESOLVED_WORKER_PATHNAME = resolve(__dirname, '../src/worker.tsx')
export const VENDOR_DIST_DIR = resolve(__dirname, '../vendor/dist')

export const DEV_SERVER_PORT = 2332;
export const CLIENT_DEV_SERVER_PORT = 5173;
export const WORKER_DEV_SERVER_PORT = 5174;
export const WORKER_URL = '/src/worker.tsx';

const MODE = process.env.NODE_ENV === 'development' ? 'development' : 'production'

export const viteConfigs = {
  workerBase: (): InlineConfig => ({
    mode: MODE,
    resolve: {
      conditions: ['workerd'],
      alias: {
        'vendor/react-ssr': resolve(VENDOR_DIST_DIR, 'react-ssr.mjs'),
        'vendor/react-rsc-worker': resolve(VENDOR_DIST_DIR, 'react-rsc-worker.mjs'),
        '@prisma/client': resolve(VENDOR_DIST_DIR, 'prisma-client')
      }
    }
  }),
  workerBuild: (): InlineConfig => mergeConfig(viteConfigs.workerBase(), {
    mode: MODE,
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          worker: RESOLVED_WORKER_PATHNAME,
        },
        preserveEntrySignatures: 'exports-only'
      },

      // todo(justinvdm, 2024-11-21): Figure out what is making our bundle so large. React SSR and SRC bundles account for ~1.5MB.
      // todo(justinvdm, 2024-11-21): Figure out if we can do some kind of code-splitting with Miniflare
      chunkSizeWarningLimit: 4_000,
    },
  }),
  workerDeploymentBuild: (): InlineConfig => mergeConfig(viteConfigs.workerBuild(), {
    mode: MODE,
    build: {
      outDir: resolve(__dirname, '../dist'),
      lib: {
        entry: RESOLVED_WORKER_PATHNAME,
        name: 'worker',
        formats: ['es'],
        fileName: 'worker'
      },
    },
  }),
}
