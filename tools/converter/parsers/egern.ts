import type { ModuleConfig, ParseResult, RewriteRule, ScriptRule, MITMConfig } from "../types"

interface EgernConfig {
  name?: string
  desc?: string
  url_rewrites?: Array<{
    match: string
    replace: string
    disabled?: boolean
  }>
  header_rewrites?: Array<{
    match: string
    header: string
    value: string
    disabled?: boolean
  }>
  body_rewrites?: Array<{
    match: string
    script: string
    disabled?: boolean
  }>
  scripts?: Array<{
    name: string
    match?: string
    type: string
    script: string
    disabled?: boolean
  }>
  mitm?: {
    hostname: string[]
    skip_server_cert_check?: boolean
  }
  rules?: string[]
}

function parseEgernYAML(raw: string): EgernConfig {
  // Simple YAML parser for Egern format
  const config: EgernConfig = {}
  const lines = raw.split("\n")

  let currentSection = ""
  let currentItem: Record<string, string> = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    // Top level keys
    if (trimmed.startsWith("name:")) {
      config.name = trimmed.split(":")[1]?.trim()
      continue
    }
    if (trimmed.startsWith("desc:")) {
      config.desc = trimmed.split(":")[1]?.trim()
      continue
    }

    // Section detection
    if (trimmed === "url_rewrites:") {
      currentSection = "url_rewrites"
      config.url_rewrites = []
      continue
    }
    if (trimmed === "header_rewrites:") {
      currentSection = "header_rewrites"
      config.header_rewrites = []
      continue
    }
    if (trimmed === "body_rewrites:") {
      currentSection = "body_rewrites"
      config.body_rewrites = []
      continue
    }
    if (trimmed === "scripts:") {
      currentSection = "scripts"
      config.scripts = []
      continue
    }
    if (trimmed === "mitm:") {
      currentSection = "mitm"
      config.mitm = { hostname: [] }
      continue
    }
    if (trimmed === "rules:") {
      currentSection = "rules"
      config.rules = []
      continue
    }

    // Parse items
    if (trimmed.startsWith("- match:")) {
      if (currentSection && config[currentSection as keyof EgernConfig]) {
        currentItem = { match: trimmed.split(":")[1]?.trim() || "" }
      }
      continue
    }

    if (trimmed.startsWith("replace:")) {
      currentItem.replace = trimmed.split(":")[1]?.trim() || ""
      if (currentSection === "url_rewrites" && config.url_rewrites) {
        config.url_rewrites.push({
          match: currentItem.match || "",
          replace: currentItem.replace,
          disabled: false,
        })
      }
      continue
    }

    if (trimmed.startsWith("header:")) {
      currentItem.header = trimmed.split(":")[1]?.trim() || ""
      continue
    }

    if (trimmed.startsWith("value:")) {
      currentItem.value = trimmed.split(":")[1]?.trim() || ""
      if (currentSection === "header_rewrites" && config.header_rewrites) {
        config.header_rewrites.push({
          match: currentItem.match || "",
          header: currentItem.header || "",
          value: currentItem.value,
          disabled: false,
        })
      }
      continue
    }

    if (trimmed.startsWith("script:")) {
      currentItem.script = trimmed.split(":")[1]?.trim() || ""
      if (currentSection === "body_rewrites" && config.body_rewrites) {
        config.body_rewrites.push({
          match: currentItem.match || "",
          script: currentItem.script,
          disabled: false,
        })
      }
      continue
    }

    if (trimmed.startsWith("hostname:")) {
      if (config.mitm) {
        const hostnames = trimmed.split(":")[1]?.trim() || ""
        config.mitm.hostname = hostnames.split(",").map((h) => h.trim())
      }
      continue
    }
  }

  return config
}

export function parseEgernModule(raw: string): ParseResult {
  const egernConfig = parseEgernYAML(raw)

  const rewrites: RewriteRule[] = []

  // Convert URL rewrites
  for (const rewrite of egernConfig.url_rewrites || []) {
    rewrites.push({
      type: "url-rewrite",
      pattern: rewrite.match,
      replacement: rewrite.replace,
      enabled: !rewrite.disabled,
    })
  }

  // Convert header rewrites
  for (const rewrite of egernConfig.header_rewrites || []) {
    rewrites.push({
      type: "header-rewrite",
      pattern: rewrite.match,
      header: `${rewrite.header}: ${rewrite.value}`,
      enabled: !rewrite.disabled,
    })
  }

  const scripts: ScriptRule[] = []

  // Convert scripts
  for (const script of egernConfig.scripts || []) {
    scripts.push({
      name: script.name,
      type: script.type as ScriptRule["type"],
      pattern: script.match,
      scriptPath: script.script,
      enabled: !script.disabled,
    })
  }

  const config: ModuleConfig = {
    name: egernConfig.name || "Egern Module",
    desc: egernConfig.desc,
    rewrites,
    scripts,
    mitm: egernConfig.mitm,
    rules: egernConfig.rules,
  }

  return {
    source: "egern",
    config,
    raw,
  }
}
