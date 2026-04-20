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

  if (pages.has(url.pathname)) {
    return c.env.ASSETS.fetch(new URL(pages.get(url.pathname)!, url))
  }

  if (aliases.has(url.pathname)) {
    return c.env.ASSETS.fetch(new URL(aliases.get(url.pathname)!, url))
  }

  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
