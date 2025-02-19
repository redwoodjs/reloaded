import { defineConfig } from "vite";
import { redwood } from "@redwoodjs/sdk/vite";

export default defineConfig({
  plugins: [
    redwood(),
  ],
});