import type { ModuleConfig, ParseResult, RewriteRule, ScriptRule, MITMConfig } from "../types"

const SECTION_RE = /^\[([\w\s]+)\]/

function parseHeader(raw: string): { name: string; desc?: string; icon?: string; author?: string; url?: string; category?: string } {
  const lines =raw.split("\n")
  const meta: Record<string, string> = {}

  for (const line of lines) {
    const match = line.match(/^#!\s*(\w+)\s*=\s*(.+)$/)
    if (match) {
      meta[match[1].toLowerCase()] = match[2].trim()
    }
  }

  return {
    name: meta.name || "Untitled",
    desc: meta.desc || meta.description,
    icon: meta.icon,
    author: meta.author,
    url: meta.url,
    category: meta.category,
  }
}

function parseRewriteLine(line: string): RewriteRule | null {
  const parts = line.split(",").map((p) => p.trim())
  if (parts.length < 3) return null

  const [pattern, replacement, type, ...flags] = parts
  const enabled = !flags.includes("disabled")

  let rewriteType: RewriteRule["type"] = "url-rewrite"
  if (type === "REQUEST_HEADER" || type === "RESPONSE_HEADER") {
    rewriteType = "header-rewrite"
  } else if (type === "REQUEST_BODY" || type === "RESPONSE_BODY") {
    rewriteType = "body-rewrite"
  } else if (type === "reject") {
    rewriteType = "reject"
  } else if (type === "mock") {
    rewriteType = "mock"
  }

  return {
    type: rewriteType,
    pattern,
    replacement,
    enabled,
  }
}

function parseScriptLine(line: string): ScriptRule | null {
  const match = line.match(
    /^(.+?)\s*=\s*(type|cronexp)=(\w+)(?:,\s*pattern=(.+?))?(?:,\s*timeout=(\d+))?\s*(?:,\s*argument=(.+))?,\s*(?:script-path|script-path-header)=(.+)$/
  )
  if (!match) return null

  const [, name, , type, pattern, timeout, argument, scriptPath] = match
  const enabled = !line.includes("disabled")

  return {
    name: name.trim(),
    type: type as ScriptRule["type"],
    pattern: pattern?.trim(),
    scriptPath: scriptPath.trim(),
    timeout: timeout ? Number.parseInt(timeout) : undefined,
    argument: argument?.trim(),
    enabled,
  }
}

function parseMITM(lines: string[]): MITMConfig | undefined {
  if (lines.length === 0) return undefined

  const hostname: string[] = []
  let skipServerCertCheck = false

  for (const line of lines) {
    if (line.startsWith("hostname")) {
      const match = line.match(/hostname\s*=%?APPEND%?\s*(.+)/)
      if (match) {
        hostname.push(...match[1].split(",").map((h) => h.trim()))
      }
    }
    if (line.includes("skip-server-cert-check")) {
      skipServerCertCheck = true
    }
  }

  return hostname.length > 0 ? { hostname, skipServerCertCheck } : undefined
}

export function parseSurgeModule(raw: string): ParseResult {
  const lines = raw.split("\n")
  const header = parseHeader(raw)

  const rewrites: RewriteRule[] = []
  const scripts: ScriptRule[] = []
  const rules: string[] = []
  const dns: Record<string, string> = {}

  let currentSection = ""
  const mitmLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue

    const sectionMatch = trimmed.match(SECTION_RE)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase()
      continue
    }

    switch (currentSection) {
      case "url rewrite":
      case "map local": {
        const rule = parseRewriteLine(trimmed)
        if (rule) rewrites.push(rule)
        break
      }
      case "script": {
        const script = parseScriptLine(trimmed)
        if (script) scripts.push(script)
        break
      }
      case "rule":
        rules.push(trimmed)
        break
      case "dns":
        dns[trimmed.split("=")[0].trim()] = trimmed.split("=")[1]?.trim() || ""
        break
      case "mitm":
        mitmLines.push(trimmed)
        break
    }
  }

  const config: ModuleConfig = {
    name: header.name,
    desc: header.desc,
    icon: header.icon,
    author: header.author,
    url: header.url,
    category: header.category,
    rewrites,
    scripts,
    mitm: parseMITM(mitmLines),
    rules,
    dns: Object.keys(dns).length > 0 ? dns : undefined,
  }

  return {
    source: "surge",
    config,
    raw,
  }
}
