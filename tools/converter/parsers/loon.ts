import type { ModuleConfig, ParseResult, RewriteRule, ScriptRule, MITMConfig } from "../types"

const SECTION_RE = /^\[([\w\s]+)\]/

function parseRewriteLine(line: string): RewriteRule | null {
  const parts = line.split(",").map((p) => p.trim())
  if (parts.length < 3) return null

  const [pattern, replacement, type, ...flags] = parts
  const enabled = !flags.includes("disabled")

  let rewriteType: RewriteRule["type"] = "url-rewrite"
  if (type === "header") {
    rewriteType = "header-rewrite"
  } else if (type === "reject") {
    rewriteType = "reject"
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
    /^(.+?)\s*=\s*type=(\w+)(?:,\s*pattern=(.+?))?(?:,\s*timeout=(\d+))?\s*(?:,\s*argument=(.+))?,\s*script-path=(.+)$/
  )
  if (!match) return null

  const [, name, type, pattern, timeout, argument, scriptPath] = match
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

export function parseLoonPlugin(raw: string): ParseResult {
  const lines = raw.split("\n")

  const header = {
    name: "Loon Plugin",
    desc: undefined as string | undefined,
    icon: undefined as string | undefined,
    author: undefined as string | undefined,
  }

  const rewrites: RewriteRule[] = []
  const scripts: ScriptRule[] = []
  const rules: string[] = []
  const mitmLines: string[] = []

  let currentSection = ""

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue

    // Parse header
    if (trimmed.startsWith("#!")) {
      const match = trimmed.match(/^#!\s*(\w+)\s*=\s*(.+)$/)
      if (match) {
        const key = match[1].toLowerCase()
        const value = match[2].trim()
        if (key === "name") header.name = value
        else if (key === "desc" || key === "description") header.desc = value
        else if (key === "icon") header.icon = value
        else if (key === "author") header.author = value
      }
      continue
    }

    const sectionMatch = trimmed.match(SECTION_RE)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim().toLowerCase()
      continue
    }

    switch (currentSection) {
      case "rewrite": {
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
    rewrites,
    scripts,
    mitm: parseMITM(mitmLines),
    rules,
  }

  return {
    source: "loon",
    config,
    raw,
  }
}
