import type { ModuleConfig, ParseResult, RewriteRule, ScriptRule, MITMConfig } from "../types"

interface AnywhereMITMRule {
  phase: number // 0 = request, 1 = response
  operation: number // 0 = url-replace, 1 = header-add, 2 = header-delete, 3 = header-replace, 4 = body-script
  field1: string
  field2?: string
  field3?: string
}

interface AnywhereMITMRuleSet {
  name: string
  hostname: string[]
  redirect?: string
  redirect302?: string
  reject200?: string
  contentType?: string
  rules: AnywhereMITMRule[]
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

export function parseAnywhereMITMRuleSet(raw: string): AnywhereMITMRuleSet {
  const lines = raw.split("\n")
  const result: AnywhereMITMRuleSet = {
    name: "",
    hostname: [],
    rules: [],
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue

    // Header lines
    if (trimmed.includes("=") && !trimmed.match(/^\d+\s*,/)) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=").trim()
      const lowerKey = key.trim().toLowerCase()

      if (lowerKey === "name") {
        result.name = value
      } else if (lowerKey === "hostname") {
        result.hostname = value.split(",").map((h) => h.trim())
      } else if (lowerKey === "redirect") {
        result.redirect = value
      } else if (lowerKey === "redirect-302") {
        result.redirect302 = value
      } else if (lowerKey === "reject-200") {
        result.reject200 = value
      } else if (lowerKey === "content-type") {
        result.contentType = value
      }
      continue
    }

    // Rule lines: phase, operation, field1 [, field2 [, field3]]
    const fields = parseCSVLine(trimmed)
    if (fields.length >= 3) {
      const phase = Number.parseInt(fields[0])
      const operation = Number.parseInt(fields[1])

      if (!isNaN(phase) && !isNaN(operation)) {
        const rule: AnywhereMITMRule = {
          phase,
          operation,
          field1: fields[2],
          field2: fields[3],
          field3: fields[4],
        }
        result.rules.push(rule)
      }
    }
  }

  return result
}

export function parseAnywhereModule(raw: string): ParseResult {
  const anywhereConfig = parseAnywhereMITMRuleSet(raw)

  const rewrites: RewriteRule[] = []

  for (const rule of anywhereConfig.rules) {
    switch (rule.operation) {
      case 0: // url-replace
        rewrites.push({
          type: "url-rewrite",
          pattern: rule.field1,
          replacement: rule.field2 || "",
          enabled: true,
        })
        break
      case 1: // header-add
        rewrites.push({
          type: "header-rewrite",
          pattern: "*",
          header: `${rule.field1}: ${rule.field2}`,
          enabled: true,
        })
        break
      case 2: // header-delete
        rewrites.push({
          type: "header-rewrite",
          pattern: "*",
          header: `${rule.field1}:`,
          enabled: true,
        })
        break
      case 3: // header-replace
        rewrites.push({
          type: "header-rewrite",
          pattern: rule.field1,
          header: `${rule.field2}: ${rule.field3}`,
          enabled: true,
        })
        break
    }
  }

  const config: ModuleConfig = {
    name: anywhereConfig.name || "Anywhere Rule Set",
    rewrites,
    scripts: [],
    mitm: anywhereConfig.hostname.length > 0 ? { hostname: anywhereConfig.hostname } : undefined,
  }

  return {
    source: "anywhere" as any,
    config,
    raw,
  }
}
