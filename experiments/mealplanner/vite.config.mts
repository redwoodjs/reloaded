import { defineConfig } from "vite";
import { redwood } from "@redwoodjs/sdk/vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  environments: {
    // workaround(justinvdm, 26 Feb 2025):
    // * tailwindcss currently uses the non-deprecated internal createResolver() vite API method:
    // https://github.com/tailwindlabs/tailwindcss/blob/main/packages/%40tailwindcss-vite/src/index.ts#L22
    // * The code and its docstring indicate that it relies on an `ssr` being present:
    // https://github.com/vitejs/vite/blob/c0e3dba3108e479ab839205cfb046db327bdaf43/packages/vite/src/node/config.ts#L1498
    // * This isn't the case for us, since we only have a `worker` environment instead of `ssr`
    // * To prevent builds getting blocked on this, we stub out the ssr environment here
    ssr: {},
  },
  plugins: [
    tailwindcss(),
    redwood(),
  ],
});