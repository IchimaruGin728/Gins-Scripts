import { Hono } from "@hono/hono"
import { getAliasMap, getPagePaths } from "./lib/catalog"

type Bindings = {
  ASSETS: Fetcher
  GINS_SCRIPTS_REPO: string
}

const app = new Hono<{ Bindings: Bindings }>()
const aliases = getAliasMap()
const pages = getPagePaths()

app.get("/api/manifest", async (c) => {
  return c.env.ASSETS.fetch(new URL("/manifest.json", c.req.url))
})

app.get("*", async (c) => {
  const url = new URL(c.req.url)
  const pagePath = pages.get(url.pathname)
  const assetPath = aliases.get(url.pathname)

  if (pagePath) {
    return c.env.ASSETS.fetch(new URL(pagePath, url))
  }

  if (assetPath) {
    return c.env.ASSETS.fetch(new URL(assetPath, url))
  }

  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
