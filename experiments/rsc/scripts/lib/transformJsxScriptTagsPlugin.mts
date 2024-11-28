import { type Plugin, normalizePath } from "vite";
import { join, dirname, basename, relative } from "node:path";
import { readFile } from "node:fs/promises";
import memoize from "lodash/memoize";
import { pathExists } from "fs-extra";

type ObjectHook<Fn> = Fn & { handler?: Fn };

type ExtractFnFromObjectHook<T> = T extends ObjectHook<infer Fn> ? Fn : never;

type TransformPluginContext = ThisParameterType<
  ExtractFnFromObjectHook<Plugin["transform"]>
>;

const readManifest = memoize(async (manifestPath: string) => {
  return (await pathExists(manifestPath))
    ? readFile(manifestPath, "utf-8").then(JSON.parse)
    : {};
});

export const transformJsxScriptTagsPlugin = ({
  manifestPath,
}: {
  manifestPath: string;
}): Plugin => ({
  name: "rw-reloaded-transform-jsx-script-tags",
  async transform(code) {
    const jsxScriptSrcRE =
      /(jsx|jsxDEV)\("script",\s*{[^}]*src:\s*["']([^"']+)["'][^}]/g;

    const matches = [...code.matchAll(jsxScriptSrcRE)];

    if (!matches.length) {
      return;
    }

    const manifest = await readManifest(manifestPath);
    for (const match of matches) {
      const src = match[2].slice("/".length);

      if (manifest[src]) {
        const transformedSrc = manifest[src].file;
        code = code.replace(src, transformedSrc);
      }
    }

    return { code };
  },
});