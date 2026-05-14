import fs from "node:fs/promises"
import path from "node:path"
import { convert } from "./converter/index.ts"

const root = process.cwd()
const modulesPath = path.join(root, "modules.json")
const modulesDir = path.join(root, "frontend/public/modules")

const SOFTWARES = ["surge", "loon", "qx", "stash", "egern", "shadowrocket"]

const EXTENSIONS = {
  surge: ".sgmodule",
  loon: ".plugin",
  qx: ".snippet",
  stash: ".stoverride",
  egern: ".yaml",
  shadowrocket: ".srmodule",
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Gins-Scripts-ModuleSync/1.0",
        },
        redirect: "follow",
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.text()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

function detectSoftware(content, filename) {
  const ext = path.extname(filename).toLowerCase()

  if (ext === ".sgmodule" || ext === ".srmodule") return "surge"
  if (ext === ".plugin" || ext === ".lpx") return "loon"
  if (ext === ".snippet" || ext === ".conf") return "qx"
  if (ext === ".stoverride") return "stash"
  if (ext === ".yaml" || ext === ".yml") return "egern"

  // Content-based detection
  if (content.includes("[Script]") || content.includes("[URL Rewrite]")) return "surge"
  if (content.includes("[Plugin]") || content.includes("#!name =")) return "loon"
  if (content.includes("hostname = %APPEND%") || content.includes("[rewrite_local]")) return "qx"
  if (content.includes("[Map Local]") && content.includes("[MITM]")) return "stash"
  if (content.includes("url_rewrites:") || content.includes("scripts:")) return "egern"

  return null
}

async function syncModule(moduleConfig) {
  const { name, upstreams } = moduleConfig
  const results = {}

  console.log(`\n📦 Syncing ${name}...`)

  // Download all upstream versions
  for (const [software, url] of Object.entries(upstreams)) {
    if (Array.isArray(url)) {
      // Multiple URLs (like kelee plugins)
      for (const singleUrl of url) {
        try {
          const content = await fetchWithRetry(singleUrl)
          const filename = path.basename(singleUrl)
          const detectedSoftware = detectSoftware(content, filename) || software
          const ext = path.extname(filename)
          const moduleName = path.basename(filename, ext)

          const softwareDir = path.join(modulesDir, detectedSoftware, "modules")
          await ensureDir(softwareDir)

          const filePath = path.join(softwareDir, `${name}${ext}`)
          await fs.writeFile(filePath, content, "utf8")
          results[detectedSoftware] = content

          console.log(`  ✅ ${detectedSoftware}: ${filename}`)
        } catch (error) {
          console.error(`  ❌ ${software}: ${error.message}`)
        }
      }
    } else {
      try {
        const content = await fetchWithRetry(url)
        const filename = path.basename(url)
        const ext = path.extname(filename)

        const softwareDir = path.join(modulesDir, software, "modules")
        await ensureDir(softwareDir)

        const filePath = path.join(softwareDir, `${name}${ext}`)
        await fs.writeFile(filePath, content, "utf8")
        results[software] = content

        console.log(`  ✅ ${software}: ${filename}`)
      } catch (error) {
        console.error(`  ❌ ${software}: ${error.message}`)
      }
    }
  }

  // Convert missing formats
  const sourceSoftware = Object.keys(results)[0]
  const sourceContent = results[sourceSoftware]

  if (sourceContent) {
    for (const targetSoftware of SOFTWARES) {
      if (results[targetSoftware]) continue // Already has original

      try {
        const converted = convert(sourceContent, targetSoftware, sourceSoftware, {
          target: targetSoftware,
          name: name,
        })

        const ext = EXTENSIONS[targetSoftware]
        const softwareDir = path.join(modulesDir, targetSoftware, "modules")
        await ensureDir(softwareDir)

        const filePath = path.join(softwareDir, `${name}${ext}`)
        await fs.writeFile(filePath, converted, "utf8")
        results[targetSoftware] = converted

        console.log(`  ✅ ${targetSoftware}: converted from ${sourceSoftware}`)
      } catch (error) {
        console.log(`  ⚠️ ${targetSoftware}: cannot convert - ${error.message}`)
      }
    }
  }

  return results
}

async function main() {
  console.log("📡 Syncing modules...")

  const modulesData = await fs.readFile(modulesPath, "utf8")
  const modules = JSON.parse(modulesData)

  // Clean modules directory
  await fs.rm(modulesDir, { recursive: true, force: true })
  await ensureDir(modulesDir)

  // Create software directories
  for (const software of SOFTWARES) {
    await ensureDir(path.join(modulesDir, software, "modules"))
  }

  // Sync all modules
  for (const moduleConfig of modules) {
    await syncModule(moduleConfig)
  }

  console.log("\n✨ Module sync completed.")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
