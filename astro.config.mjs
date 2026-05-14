import UnoCSS from "@unocss/astro"
import { defineConfig } from "astro/config"

export default defineConfig({
  srcDir: "./frontend/src",
  publicDir: "./frontend/public",
  integrations: [UnoCSS()],
  output: "static",
})
