import { $ } from "./lib/$.mjs";

export const codegenTypes = async () => {
  console.log("Generating types...");
  console.log("Generating db types...");

  // context(justinvdm, 26 Nov 2024): Get the latest sqlite file
  // todo(justinvdm, 26 Nov 2024): Something better than this
  const latestSqliteFile = (
    await $`find ./.wrangler/state/v3/d1/ -name *.sqlite -exec ls -t {} +`
  ).stdout?.split("\n")[0]!;

  // context(justinvdm, 26 Nov 2024): This will actually use better-sqlite3 on the .sqlite file
  // This may / may not hold up well depending on how close d1 is to sqlite
  await $`pnpm kysely-codegen --dialect sqlite --url ${latestSqliteFile}`;

  console.log("Generating wrangler types...");
  await $`pnpm wrangler types`;

  console.log("Types generated!");
  console.log();
};

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  codegenTypes();
}
