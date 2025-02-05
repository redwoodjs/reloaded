import { $ } from "../lib/$.mjs";

export const initDev = async () => {
  console.log("Initializing development environment...");

  await $`rw migrate:dev`;
  await $`prisma generate`;
  await $`rw seed`;

  console.log("Done.");
  console.log("Run `pnpm dev` to get started...")
  console.log();
};

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  initDev();
}
