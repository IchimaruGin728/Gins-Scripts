import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const publicDir = path.join(root, "public")
const downloadsDir = path.join(publicDir, "downloads")

const files = [
  {
    platform: "scriptable",
    product: "qweather",
    label: "QWeather Weather Widget",
    source: "scriptable/QWeatherWeatherWidget.js",
    slug: "qweather-weather-widget",
  },
  {
    platform: "scriptable",
    product: "datagovsg",
    label: "DataGovSG Dashboard",
    source: "scriptable/DataGovSGDashboard.js",
    slug: "datagovsg-dashboard",
  },
  {
    platform: "scripting",
    product: "qweather",
    label: "QWeather Widget Index",
    source: "scripting/qweather-weather-widget/index.tsx",
    slug: "qweather-weather-widget/index",
  },
  {
    platform: "scripting",
    product: "qweather",
    label: "QWeather Widget Shared",
    source: "scripting/qweather-weather-widget/shared.ts",
    slug: "qweather-weather-widget/shared",
  },
  {
    platform: "scripting",
    product: "qweather",
    label: "QWeather Widget View",
    source: "scripting/qweather-weather-widget/widget.tsx",
    slug: "qweather-weather-widget/widget",
  },
  {
    platform: "scripting",
    product: "datagovsg",
    label: "DataGovSG Index",
    source: "scripting/datagovsg-dashboard/index.tsx",
    slug: "datagovsg-dashboard/index",
  },
  {
    platform: "scripting",
    product: "datagovsg",
    label: "DataGovSG Shared",
    source: "scripting/datagovsg-dashboard/shared.ts",
    slug: "datagovsg-dashboard/shared",
  },
  {
    platform: "scripting",
    product: "datagovsg",
    label: "DataGovSG Widget View",
    source: "scripting/datagovsg-dashboard/widget.tsx",
    slug: "datagovsg-dashboard/widget",
  },
  {
    platform: "egern",
    product: "qweather",
    label: "QWeather Widget",
    source: "egern/qweather-weather-widget.js",
    slug: "qweather-weather-widget",
  },
  {
    platform: "egern",
    product: "qweather",
    label: "QWeather Module",
    source: "egern/qweather-weather-module.yaml",
    slug: "qweather-weather-module",
  },
  {
    platform: "egern",
    product: "datagovsg",
    label: "DataGovSG Dashboard",
    source: "egern/datagovsg-dashboard.js",
    slug: "datagovsg-dashboard",
  },
  {
    platform: "stash",
    product: "qweather",
    label: "QWeather Tile",
    source: "stash/qweather-weather-tile.js",
    slug: "qweather-weather-tile",
  },
  {
    platform: "surge",
    product: "qweather",
    label: "QWeather Panel",
    source: "surge/qweather-weather-panel.js",
    slug: "qweather-weather-panel",
  },
]

const manifests = {
  name: "Gins-Scripts",
  generatedAt: new Date().toISOString(),
  files: [],
}

function contentType(file) {
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "application/javascript; charset=UTF-8"
  if (file.endsWith(".ts") || file.endsWith(".tsx")) return "text/plain; charset=UTF-8"
  if (file.endsWith(".yaml") || file.endsWith(".yml")) return "text/yaml; charset=UTF-8"
  if (file.endsWith(".json")) return "application/json; charset=UTF-8"
  if (file.endsWith(".md")) return "text/markdown; charset=UTF-8"
  if (file.endsWith(".html")) return "text/html; charset=UTF-8"
  return "text/plain; charset=UTF-8"
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
}

async function resetPublicDir() {
  await fs.rm(publicDir, { recursive: true, force: true })
  await fs.mkdir(downloadsDir, { recursive: true })
}

async function copyFiles() {
  for (const file of files) {
    const sourcePath = path.join(root, file.source)
    const targetPath = path.join(downloadsDir, file.source)
    await fs.mkdir(path.dirname(targetPath), { recursive: true })
    await fs.copyFile(sourcePath, targetPath)
    manifests.files.push({
      ...file,
      path: `/downloads/${file.source}`,
      aliasPath: `/${file.platform}/${file.slug}`,
      contentType: contentType(file.source),
    })
  }
}

async function writeManifest() {
  await fs.writeFile(
    path.join(publicDir, "manifest.json"),
    `${JSON.stringify(manifests, null, 2)}\n`,
    "utf8"
  )
}

function groupFiles() {
  const grouped = new Map()
  for (const file of manifests.files) {
    const key = `${file.platform}:${file.product}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(file)
  }
  return [...grouped.entries()]
}

async function writeIndex() {
  const cards = groupFiles()
    .map(([key, group]) => {
      const [platform, product] = key.split(":")
      const links = group
        .map((file) => `<li><a href="${file.aliasPath}">${escapeHtml(file.label)}</a><span>${escapeHtml(file.aliasPath)}</span></li>`)
        .join("")
      return `
        <section class="card">
          <div class="eyebrow">${escapeHtml(platform)}</div>
          <h2>${escapeHtml(product)}</h2>
          <ul>${links}</ul>
        </section>
      `
    })
    .join("")

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Gins-Scripts</title>
  <style>
    :root {
      --bg: #0f1020;
      --bg2: #1b1442;
      --accent: #6f5cff;
      --accent2: #b4a8ff;
      --text: #f5f7ff;
      --muted: rgba(245,247,255,.72);
      --card: rgba(255,255,255,.08);
      --border: rgba(255,255,255,.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-rounded, "SF Pro Rounded", "Avenir Next", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top right, rgba(111,92,255,.35), transparent 28rem),
        radial-gradient(circle at bottom left, rgba(79,148,255,.18), transparent 24rem),
        linear-gradient(135deg, var(--bg), var(--bg2));
    }
    main { max-width: 1120px; margin: 0 auto; padding: 48px 20px 72px; }
    .hero {
      display: grid;
      gap: 14px;
      margin-bottom: 28px;
    }
    .pill {
      display: inline-flex;
      width: fit-content;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.08);
      border: 1px solid var(--border);
      color: var(--accent2);
      font-size: 12px;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    h1 { margin: 0; font-size: clamp(36px, 6vw, 64px); line-height: .95; }
    p { margin: 0; color: var(--muted); max-width: 760px; font-size: 16px; line-height: 1.6; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
    .button {
      display: inline-flex;
      padding: 12px 16px;
      border-radius: 14px;
      background: var(--text);
      color: #16142c;
      text-decoration: none;
      font-weight: 700;
    }
    .button.secondary {
      background: rgba(255,255,255,.08);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 28px;
    }
    .card {
      padding: 18px;
      border-radius: 24px;
      background: var(--card);
      border: 1px solid var(--border);
      backdrop-filter: blur(10px);
    }
    .eyebrow {
      color: var(--accent2);
      text-transform: uppercase;
      letter-spacing: .06em;
      font-size: 11px;
      margin-bottom: 10px;
    }
    h2 { margin: 0 0 12px; font-size: 20px; }
    ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
    li { display: grid; gap: 3px; }
    a { color: var(--text); text-decoration: none; font-weight: 700; }
    a:hover { color: var(--accent2); }
    span { color: var(--muted); font-size: 12px; word-break: break-all; }
    .footer { margin-top: 24px; color: var(--muted); font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="pill">Cloudflare Distribution Ready</div>
      <h1>Gins-Scripts</h1>
      <p>Cross-platform widget scripts for Scriptable, Scripting, Egern, Stash, and Surge. Canonical URLs follow the pattern scripts.ichimarugin728.dev/software-name/script-or-widget-name.</p>
      <div class="actions">
        <a class="button" href="/manifest.json">Open manifest.json</a>
        <a class="button secondary" href="/scriptable/qweather-weather-widget">Canonical script URL</a>
      </div>
    </section>
    <section class="grid">${cards}</section>
    <div class="footer">Generated ${escapeHtml(manifests.generatedAt)}</div>
  </main>
</body>
</html>`

  await fs.writeFile(path.join(publicDir, "index.html"), html, "utf8")
}

await resetPublicDir()
await copyFiles()
await writeManifest()
await writeIndex()
