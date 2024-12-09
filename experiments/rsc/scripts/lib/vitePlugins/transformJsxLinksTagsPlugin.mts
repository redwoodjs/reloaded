import MagicString from "magic-string";
import { type Plugin } from "vite";
import { readFile } from "node:fs/promises";
import memoize from "lodash/memoize";
import { pathExists } from "fs-extra";

const readManifest = memoize(async (manifestPath: string) => {
  return (await pathExists(manifestPath))
    ? readFile(manifestPath, "utf-8").then(JSON.parse)
    : {};
});

export const transformJsxLinksTagsPlugin = ({
  manifestPath,
}: {
  manifestPath: string;
}): Plugin => ({
  name: "rw-reloaded-transform-jsx-link-tags",
  async transform(code) {
    const jsxLinkHrefRE =
      /(jsx|jsxDEV)\("link",\s*{[^}]*rel:\s*["']stylesheet["'][^}]*href:\s*["']([^"']+)["'][^}]*}/g;

    const matches = [...code.matchAll(jsxLinkHrefRE)];

    if (!matches.length) {
      return;
    }

    const manifest = await readManifest(manifestPath);
    const s = new MagicString(code);

    for (const match of matches) {
      const href = match[2].slice("/".length);

      if (manifest[href]) {
        const transformedHref = manifest[href].file;
        s.replaceAll(href, transformedHref);
      }
    }

    return {
      code: s.toString(),
      map: s.generateMap(),
    };
  },
});
