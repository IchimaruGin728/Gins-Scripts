import fs from "node:fs/promises"
import path from "node:path"
import { zipSync } from "fflate"
import {
  FILES,
  getCanonicalPath,
  getDownloadPath,
  getScriptingPackageDirectoryPath,
  getScriptingPackageZipPath,
} from "../src/lib/catalog.js"

const root = process.cwd()
const publicDir = path.join(root, "public")
const downloadsDir = path.join(publicDir, "downloads")

const manifest = {
  name: "Gins-Scripts",
  generatedAt: new Date().toISOString(),
  files: [],
  scriptingPackages: [],
}

function contentType(file) {
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "application/javascript; charset=UTF-8"
  if (file.endsWith(".ts") || file.endsWith(".tsx")) return "application/typescript; charset=UTF-8"
  if (file.endsWith(".yaml") || file.endsWith(".yml")) return "text/yaml; charset=UTF-8"
  if (file.endsWith(".json")) return "application/json; charset=UTF-8"
  return "text/plain; charset=UTF-8"
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function resetGeneratedAssets() {
  await fs.rm(downloadsDir, { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "packages"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "widgets"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "modules"), { recursive: true, force: true })
  await fs.rm(path.join(publicDir, "scripts"), { recursive: true, force: true })
  for (const software of [
    "Scripting",
    "Scriptable",
    "Egern",
    "Stash",
    "Surge",
    "Shadowrocket",
    "Loon",
    "QuantumultX",
  ]) {
    await fs.rm(path.join(publicDir, software), { recursive: true, force: true })
  }
  await fs.rm(path.join(publicDir, "index.html"), { force: true })
  await fs.mkdir(downloadsDir, { recursive: true })
}

async function copyFiles() {
  for (const file of FILES) {
    const sourcePath = path.join(root, file.source)
    const targetPath = path.join(publicDir, getDownloadPath(file))
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

function collectScriptingProjects() {
  const groups = new Map()
  for (const file of FILES) {
    if (file.software !== "Scripting") continue
    const parts = file.source.split("/")
    const project = file.product
    const relativePath = parts.slice(2).join("/")
    const key = `${file.category}/${project}`
    if (!groups.has(key)) groups.set(key, { category: file.category, project, items: [] })
    groups.get(key).items.push({ file, source: file.source, relativePath })
  }
  return groups
}

async function buildScriptingPackages() {
  const projects = collectScriptingProjects()
  for (const { category, project, items } of projects.values()) {
    const directoryUrl = getScriptingPackageDirectoryPath(project, category)
    const zipUrl = getScriptingPackageZipPath(project, category)
    const projectDir = path.join(publicDir, directoryUrl)
    await fs.mkdir(projectDir, { recursive: true })

    const zipFiles = {}
    const files = []
    for (const item of items) {
      const sourcePath = path.join(root, item.source)
      const content = await fs.readFile(sourcePath)
      const targetPath = path.join(projectDir, item.relativePath)
      await ensureDir(targetPath)
      await fs.writeFile(targetPath, content)
      zipFiles[item.relativePath] = new Uint8Array(content)
      files.push({
        path: item.relativePath,
        source: item.source,
        url: getDownloadPath(item.file),
        packageUrl: `${directoryUrl}${item.relativePath}`,
      })
    }

    const zipBytes = zipSync(zipFiles, { level: 9 })
    const zipPath = path.join(publicDir, zipUrl)
    await ensureDir(zipPath)
    await fs.writeFile(zipPath, Buffer.from(zipBytes))

    const packageManifest = {
      name: project,
      software: "Scripting",
      category,
      directoryUrl,
      zipUrl,
      manifestUrl: `${directoryUrl}manifest.json`,
      scriptConfigUrl: `${directoryUrl}script.json`,
      files,
      entrypoints: {
        index: files.find((f) => f.path === "index.tsx")?.packageUrl ?? null,
        widget: files.find((f) => f.path === "widget.tsx")?.packageUrl ?? null,
      },
    }

    await fs.writeFile(
      path.join(projectDir, "manifest.json"),
      `${JSON.stringify(packageManifest, null, 2)}\n`,
      "utf8"
    )
    await fs.writeFile(
      path.join(projectDir, "script.json"),
      `${JSON.stringify(
        {
          name: project,
          type: category,
          entry: "index.tsx",
          widget: files.some((f) => f.path === "widget.tsx") ? "widget.tsx" : null,
          files: files.map((file) => file.path),
        },
        null,
        2
      )}\n`,
      "utf8"
    )
    manifest.scriptingPackages.push(packageManifest)
  }
}

async function writeManifest() {
  await fs.writeFile(
    path.join(publicDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  )
}

await resetGeneratedAssets()
await copyFiles()
await buildScriptingPackages()
await writeManifest()
