import fs from "node:fs/promises"
import path from "node:path"
import { FILES, getCanonicalPath, getDownloadPath } from "../src/lib/catalog.ts"

const root = process.cwd()
const publicDir = path.join(root, "public")
const downloadsDir = path.join(publicDir, "downloads")

const manifest = {
  name: "Gins-Scripts",
  generatedAt: new Date().toISOString(),
  files: [],
}

function contentType(file) {
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "application/javascript; charset=UTF-8"
  if (file.endsWith(".ts") || file.endsWith(".tsx")) return "text/plain; charset=UTF-8"
  if (file.endsWith(".yaml") || file.endsWith(".yml")) return "text/yaml; charset=UTF-8"
  if (file.endsWith(".json")) return "application/json; charset=UTF-8"
  return "text/plain; charset=UTF-8"
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function resetGeneratedAssets() {
  await fs.rm(downloadsDir, { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "widgets"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "modules"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "scripts"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "index.html"), { force: true })
  await fs.mkdir(downloadsDir, { recursive: true })
}

async function copyFiles() {
  for (const file of FILES) {
    const sourcePath = path.join(root, file.source)
    const targetPath = path.join(downloadsDir, file.source)
    await ensureDir(targetPath)
    await fs.copyFile(sourcePath, targetPath)
    manifest.files.push({
      ...file,
      path: getDownloadPath(file),
      aliasPath: getCanonicalPath(file),
      contentType: contentType(file.source),
    })
  }
}

async function writeManifest() {
  await fs.writeFile(path.join(publicDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
}

await resetGeneratedAssets()
await copyFiles()
await writeManifest()
