import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers"
import { Hono } from "@hono/hono"
import { getAliasMap, getPagePaths } from "./lib/catalog"

type Bindings = {
  ASSETS: Fetcher
  SCRIPTS_R2: R2Bucket
  R2_SYNC_QUEUE: Queue<R2SyncMessage>
  R2_SYNC_WORKFLOW: Workflow
  GINS_SCRIPTS_REPO: string
}

type R2SyncMessage = {
  key: string
  path: string
  contentType?: string
}

const app = new Hono<{ Bindings: Bindings }>()
const aliases = getAliasMap()
const pages = getPagePaths()

app.get("/api/manifest", async (c) => {
  return c.env.ASSETS.fetch(new URL("/manifest.json", c.req.url))
})

app.post("/api/r2/sync", async (c) => {
  const instance = await c.env.R2_SYNC_WORKFLOW.create({
    params: {
      requestedAt: new Date().toISOString(),
    },
  })
  return c.json({ ok: true, id: instance.id })
})

app.get("*", async (c) => {
  const url = new URL(c.req.url)
  const decodedPath = decodeURIComponent(url.pathname)
  const pagePath = pages.get(url.pathname) ?? pages.get(decodedPath)
  const assetPath = aliases.get(url.pathname) ?? aliases.get(decodedPath)
  const r2Path = decodedPath.replace(/^\/+/, "")

  if (r2Path.startsWith("downloads/") || r2Path.startsWith("packages/")) {
    const object = await c.env.SCRIPTS_R2.get(r2Path)
    if (object) {
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set("etag", object.httpEtag)
      headers.set("cache-control", "public, max-age=300")
      return new Response(object.body, { headers })
    }
  }

  if (pagePath) {
    return c.env.ASSETS.fetch(new URL(pagePath, url))
  }

  if (assetPath) {
    return c.env.ASSETS.fetch(new URL(assetPath, url))
  }

  return c.env.ASSETS.fetch(c.req.raw)
})

async function listSyncMessages(env: Bindings): Promise<R2SyncMessage[]> {
  const response = await env.ASSETS.fetch("https://assets.local/manifest.json")
  const manifest = (await response.json()) as {
    files?: Array<{ path: string; contentType?: string }>
    scriptingPackages?: Array<{
      name: string
      directoryUrl: string
      zipUrl: string
      manifestUrl?: string
      scriptConfigUrl?: string
      files: Array<{ path: string }>
    }>
  }

  const paths = new Map<string, string | undefined>()
  for (const file of manifest.files ?? []) paths.set(file.path, file.contentType)

  for (const pkg of manifest.scriptingPackages ?? []) {
    paths.set(pkg.zipUrl, "application/zip")
    paths.set(
      pkg.manifestUrl ?? `${pkg.directoryUrl}manifest.json`,
      "application/json; charset=UTF-8"
    )
    paths.set(
      pkg.scriptConfigUrl ?? `${pkg.directoryUrl}script.json`,
      "application/json; charset=UTF-8"
    )
    for (const file of pkg.files)
      paths.set(`${pkg.directoryUrl}${file.path}`, "application/typescript; charset=UTF-8")
  }

  return Array.from(paths.entries())
    .sort()
    .map(([pathname, contentType]) => ({
      path: pathname,
      key: pathname.replace(/^\/+/, ""),
      contentType,
    }))
}

async function syncObject(env: Bindings, message: R2SyncMessage) {
  const response = await env.ASSETS.fetch(`https://assets.local${message.path}`)
  if (!response.ok || !response.body) {
    throw new Error(`Asset fetch failed for ${message.path}: ${response.status}`)
  }

  const headers = new Headers()
  const contentType = message.contentType ?? response.headers.get("content-type")
  const cacheControl = response.headers.get("cache-control")
  if (contentType) headers.set("content-type", contentType)
  if (cacheControl) headers.set("cache-control", cacheControl)

  await env.SCRIPTS_R2.put(message.key, response.body, {
    httpMetadata: headers,
  })
}

export class R2SyncWorkflow extends WorkflowEntrypoint<Bindings> {
  async run(_event: WorkflowEvent, step: WorkflowStep) {
    const messages = await step.do("Collect distribution assets", async () => {
      return await listSyncMessages(this.env)
    })

    await step.do("Enqueue R2 sync messages", async () => {
      for (let i = 0; i < messages.length; i += 100) {
        const batch = messages.slice(i, i + 100).map((body) => ({ body }))
        await this.env.R2_SYNC_QUEUE.sendBatch(batch)
      }
      return { count: messages.length }
    })
  }
}

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  },
  async queue(batch: MessageBatch<R2SyncMessage>, env: Bindings): Promise<void> {
    await Promise.all(batch.messages.map((message) => syncObject(env, message.body)))
  },
}
