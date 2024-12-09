import { resolve } from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

export const ROOT_DIR = resolve(__dirname, "..", "..");
export const SRC_DIR = resolve(ROOT_DIR, "src");
export const DIST_DIR = resolve(ROOT_DIR, "dist");

export const CLIENT_DIST_DIR = resolve(DIST_DIR, "client");
export const WORKER_DIST_DIR = resolve(DIST_DIR, "worker");

export const VENDOR_DIST_DIR = resolve(ROOT_DIR, "vendor/dist");

export const DEV_SERVER_PORT = 2332;
export const WORKER_DEV_SERVER_PORT = 5174;

export const RELATIVE_WORKER_PATHNAME = resolve(SRC_DIR, "worker.tsx");
export const RELATIVE_CLIENT_PATHNAME = resolve(SRC_DIR, "client.tsx");

export const MANIFEST_PATH = resolve(CLIENT_DIST_DIR, ".vite", "manifest.json");

export const D1_PERSIST_PATH = resolve(ROOT_DIR, ".wrangler/state/v3/d1");
