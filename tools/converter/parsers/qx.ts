import type { ModuleConfig, ParseResult, RewriteRule, ScriptRule, MITMConfig } from "../types"

function parseRewriteLine(line: string): RewriteRule | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return null

  // url rewrite: pattern type replacement
  const urlMatch = trimmed.match(/^(.+?)\s+(url-rewrite|reject|redirect|mock)\s+(.+?)$/)
  if (urlMatch) {
    return {
      type: urlMatch[2] === "url-rewrite" ? "url-rewrite" : urlMatch[2] as RewriteRule["type"],
      pattern: urlMatch[1],
      replacement: urlMatch[3],
      enabled: !trimmed.startsWith("#"),
    }
  }

  // header rewrite
  const headerMatch = trimmed.match(/^(.+?)\s+(request-header|response-header)\s+(.+?)$/)
  if (headerMatch) {
    return {
      type: "header-rewrite",
      pattern: headerMatch[1],
      header: headerMatch[3],
      enabled: !trimmed.startsWith("#"),
    }
  }

  return null
}

function parseScriptLine(line: string): ScriptRule | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null

  // script: name type pattern script-path
  const match = trimmed.match(
    /^(.+?)\s+(http-request|http-response|cron)\s+(.+?)\s+(.+?)$/
  )
  if (!match) return null

  const [, name, type, patternOrCron, scriptPath] = match
  const enabled = !trimmed.startsWith("#")

  if (type === "cron") {
    return {
      name: name.trim(),
      type: "cron",
      cronExp: patternOrCron,
      scriptPath: scriptPath.trim(),
      enabled,
    }
  }

  return {
    name: name.trim(),
    type: type as ScriptRule["type"],
    pattern: patternOrCron,
    scriptPath: scriptPath.trim(),
    enabled,
  }
}

function parseHostname(line: string): string[] {
  const match = line.match(/^hostname\s*=%?APPEND%?\s*(.+)$/)
  if (!match) return []
  return match[1].split(",").map((h) => h.trim())
}

export function parseQXRewrite(raw: string): ParseResult {
  const lines = raw.split("\n")
  const rewrites: RewriteRule[] = []
  const scripts: ScriptRule[] = []
  const rules: string[] = []
  const mitmHostname: string[] = []

  let inRewrite = false
  let inScript = false
  let inRule = false
  let inMITM = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    // Section detection
    if (trimmed === "[rewrite_remote]" || trimmed === "[rewrite_local]") {
      inRewrite = true
      inScript = false
      inRule = false
      inMITM = false
      continue
    }
    if (trimmed === "[task_local]") {
      inScript = true
      inRewrite = false
      inRule = false
      inMITM = false
      continue
    }
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      inRewrite = false
      inScript = false
      inRule = false
      inMITM = false
      continue
    }

    // Parse based on section
    if (inRewrite) {
      const rewrite = parseRewriteLine(trimmed)
      if (rewrite) rewrites.push(rewrite)
    } else if (inScript) {
      const script = parseScriptLine(trimmed)
      if (script) scripts.push(script)
    } else if (trimmed.startsWith("hostname")) {
      mitmHostname.push(...parseHostname(trimmed))
    }
  }

  const config: ModuleConfig = {
    name: "QX Rewrite",
    rewrites,
    scripts,
    mitm: mitmHostname.length > 0 ? { hostname: mitmHostname } : undefined,
    rules,
  }

  return {
    source: "qx",
    config,
    raw,
  }
}
