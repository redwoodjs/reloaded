import { createBuilder } from "vite";
import { $, $sh } from "../lib/$.mjs";

export const build = async () => {
  // context(justinvdm, 2024-12-05): Call indirectly to silence verbose output when VERBOSE is not set
  console.log("Building vendor bundles...");
  await $`pnpm build:vendor`;

  console.log("Generating prisma client...");
  await $`pnpm prisma generate`;

  console.log("Building app...");
  const builder = await createBuilder(
    /* todo */
  );
  await builder.buildApp();

  console.log("Build done!");
  console.log();
};

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  build();
}
