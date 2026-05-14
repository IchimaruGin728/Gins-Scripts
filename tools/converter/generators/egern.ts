import type { ModuleConfig, GenerateOptions } from "../types"

export function generateEgernModule(config: ModuleConfig, options: GenerateOptions = {} as GenerateOptions): string {
  const lines: string[] = []

  // Header
  lines.push(`name: ${options.name || config.name}`)
  if (config.desc || options.desc) {
    lines.push(`desc: ${options.desc || config.desc}`)
  }
  lines.push("")

  // URL rewrites
  const urlRewrites = config.rewrites.filter((r) => r.type === "url-rewrite")
  if (urlRewrites.length > 0) {
    lines.push("url_rewrites:")
    for (const rewrite of urlRewrites) {
      lines.push(`  - match: ${rewrite.pattern}`)
      lines.push(`    replace: ${rewrite.replacement}`)
      if (!rewrite.enabled) {
        lines.push("    disabled: true")
      }
    }
    lines.push("")
  }

  // Header rewrites
  const headerRewrites = config.rewrites.filter((r) => r.type === "header-rewrite")
  if (headerRewrites.length > 0) {
    lines.push("header_rewrites:")
    for (const rewrite of headerRewrites) {
      const [headerName, ...valueParts] = (rewrite.header || "").split(":")
      const headerValue = valueParts.join(":").trim()
      lines.push(`  - match: ${rewrite.pattern}`)
      lines.push(`    header: ${headerName?.trim() || ""}`)
      lines.push(`    value: ${headerValue}`)
      if (!rewrite.enabled) {
        lines.push("    disabled: true")
      }
    }
    lines.push("")
  }

  // Scripts
  if (config.scripts.length > 0) {
    lines.push("scripts:")
    for (const script of config.scripts) {
      lines.push(`  - name: ${script.name}`)
      lines.push(`    type: ${script.type}`)
      if (script.pattern) {
        lines.push(`    match: ${script.pattern}`)
      }
      lines.push(`    script: ${script.scriptPath}`)
      if (!script.enabled) {
        lines.push("    disabled: true")
      }
    }
    lines.push("")
  }

  // MITM section
  if (config.mitm) {
    lines.push("mitm:")
    lines.push(`  hostname: ${config.mitm.hostname.join(", ")}`)
    if (config.mitm.skipServerCertCheck) {
      lines.push("  skip_server_cert_check: true")
    }
  }

  // Rules section
  if (config.rules && config.rules.length > 0) {
    lines.push("")
    lines.push("rules:")
    for (const rule of config.rules) {
      lines.push(`  - ${rule}`)
    }
  }

  return lines.join("\n")
}
