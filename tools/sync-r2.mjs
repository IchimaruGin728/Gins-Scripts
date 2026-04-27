import { spawn } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const bucket = process.env.GINS_SCRIPTS_R2_BUCKET || "gins-scripts-storage"
const concurrency = Number(process.env.GINS_SCRIPTS_R2_CONCURRENCY || 8)
const roots = [
  "Scripting",
  "Scriptable",
  "Egern",
  "Stash",
  "Surge",
  "Shadowrocket",
  "Loon",
  "QuantumultX",
]

const contentTypes = new Map([
  [".js", "application/javascript; charset=UTF-8"],
  [".mjs", "application/javascript; charset=UTF-8"],
  [".ts", "application/typescript; charset=UTF-8"],
  [".tsx", "application/typescript; charset=UTF-8"],
  [".yaml", "text/yaml; charset=UTF-8"],
  [".yml", "text/yaml; charset=UTF-8"],
  [".json", "application/json; charset=UTF-8"],
  [".zip", "application/zip"],
  [".scripting", "application/zip"],
])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(fullPath)))
    else if (entry.isFile()) files.push(fullPath)
  }
  return files
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" })
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))
    })
  })
}

async function runWithRetry(command, args, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await run(command, args)
      return
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
    }
  }
  throw lastError
}

async function main() {
  const publicDir = path.join(root, "public")
  const files = []
  for (const relativeRoot of roots) {
    const dir = path.join(publicDir, relativeRoot)
    try {
      files.push(...(await walk(dir)))
    } catch (error) {
      if (error?.code !== "ENOENT") throw error
    }
  }

  let nextIndex = 0

  async function worker() {
    while (nextIndex < files.length) {
      const file = files[nextIndex++]
      await upload(file)
    }
  }

  async function upload(file) {
    const key = path.relative(publicDir, file).split(path.sep).join("/")
    const ext = path.extname(file)
    const contentType = contentTypes.get(ext) || "application/octet-stream"
    await runWithRetry("wrangler", [
      "r2",
      "object",
      "put",
      `${bucket}/${key}`,
      "--remote",
      "--file",
      file,
      "--content-type",
      contentType,
    ])
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()))
}

await main()
