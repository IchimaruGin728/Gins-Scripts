import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const iconsDir = path.join(root, "frontend/public/icons")

// App Store IDs for each software
const APP_STORE_IDS = {
  Surge: "id1442620678",
  Scriptable: "id1405459188",
  Scripting: "id1444636544",
  Stash: "id1596063349",
  Egern: "id1614443376",
  QuantumultX: "id1252015438",
  Loon: "id1373567447",
  Shadowrocket: "id932747118",
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchAppStoreIcon(appId) {
  // Fetch App Store page
  const url = `https://apps.apple.com/app/${appId}`
  const response = await fetchWithRetry(url)
  const html = await response.text()

  // Extract high-res icon URL from meta tags
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)
  if (ogImageMatch) {
    return ogImageMatch[1]
  }

  // Fallback: look for artwork URL
  const artworkMatch = html.match(/"artworkUrl1024"\s*:\s*"([^"]+)"/)
  if (artworkMatch) {
    return artworkMatch[1]
  }

  return null
}

async function downloadIcon(software, appId) {
  const iconPath = path.join(iconsDir, `${software.toLowerCase()}.png`)

  try {
    console.log(`  [Icon] Fetching ${software} icon...`)
    const iconUrl = await fetchAppStoreIcon(appId)

    if (!iconUrl) {
      console.log(`  ⚠️ Could not find icon for ${software}`)
      return
    }

    const response = await fetchWithRetry(iconUrl)
    const buffer = await response.arrayBuffer()
    await fs.writeFile(iconPath, Buffer.from(buffer))

    console.log(`  ✅ Saved ${software} icon`)
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${software} icon: ${error.message}`)
  }
}

async function main() {
  console.log("🖼️ Fetching app icons from App Store...")

  await ensureDir(iconsDir)

  const entries = Object.entries(APP_STORE_IDS)
  const concurrency = 3

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency)
    await Promise.all(batch.map(([software, appId]) => downloadIcon(software, appId)))
  }

  console.log("\n✨ Icon fetch completed.")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
