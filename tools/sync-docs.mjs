import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const sourcesPath = path.join(root, "sources.json")
const docsDir = path.join(root, "frontend/src/content/docs")

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Gins-Scripts-DocSync/1.0",
        },
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

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "-")
    .toLowerCase()
}

async function syncSource(source) {
  const softwareDir = path.join(docsDir, source.software)
  await ensureDir(softwareDir)

  const filename = sanitizeFilename(source.name) + ".md"
  const filePath = path.join(softwareDir, filename)

  try {
    console.log(`  [Doc] Downloading ${source.name}...`)
    const content = await fetchWithRetry(source.url)

    // Wrap in markdown with metadata
    const markdown = `---
title: "${source.name}"
source: "${source.url}"
software: "${source.software}"
type: "${source.type}"
fetched_at: "${new Date().toISOString()"
---

${content}
`

    await fs.writeFile(filePath, markdown, "utf8")
    console.log(`  ✅ Saved ${source.software}/${filename}`)
  } catch (error) {
    console.error(`  ❌ Failed to download ${source.name}: ${error.message}`)
  }
}

async function generateLLMsTxt() {
  const softwares = await fs.readdir(docsDir)

  for (const software of softwares) {
    const softwareDir = path.join(docsDir, software)
    const stat = await fs.stat(softwareDir)
    if (!stat.isDirectory()) continue

    const files = await fs.readdir(softwareDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    if (mdFiles.length === 0) continue

    const llmsContent = [`# ${software} Documentation\n`]
    const llmsFullContent = [`# ${software} Documentation (Full)\n`]

    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(softwareDir, file), "utf8")
      const titleMatch = content.match(/title:\s*"(.+?)"/)
      const sourceMatch = content.match(/source:\s*"(.+?)"/)
      const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, "")
      const source = sourceMatch ? sourceMatch[1] : ""

      llmsContent.push(`## ${title}`)
      if (source) llmsContent.push(`Source: ${source}`)
      llmsContent.push("")

      // Extract content after frontmatter
      const contentStart = content.indexOf("---", 3)
      if (contentStart >= 0) {
        llmsFullContent.push(`## ${title}\n`)
        llmsFullContent.push(content.slice(contentStart + 3).trim())
        llmsFullContent.push("")
      }
    }

    await fs.writeFile(path.join(softwareDir, "llms.txt"), llmsContent.join("\n"), "utf8")
    await fs.writeFile(path.join(softwareDir, "llms-full.txt"), llmsFullContent.join("\n"), "utf8")
    console.log(`  ✅ Generated llms.txt for ${software}`)
  }
}

async function main() {
  console.log("📡 Syncing documentation sources...")

  const sourcesData = await fs.readFile(sourcesPath, "utf8")
  const sources = JSON.parse(sourcesData)
  const activeSources = sources.filter((s) => s.enabled)

  console.log(`  Found ${activeSources.length} active sources`)

  // Process sources with concurrency limit
  const concurrency = 5
  for (let i = 0; i < activeSources.length; i += concurrency) {
    const batch = activeSources.slice(i, i + concurrency)
    await Promise.all(batch.map(syncSource))
  }

  console.log("\n📝 Generating llms.txt files...")
  await generateLLMsTxt()

  console.log("\n✨ Documentation sync completed.")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
