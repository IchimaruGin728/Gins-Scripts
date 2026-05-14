import type { ModuleConfig, GenerateOptions } from "../types"

export function generateLoonPlugin(config: ModuleConfig, options: GenerateOptions = {} as GenerateOptions): string {
  const lines: string[] = []

  // Header
  lines.push(`#!name = ${options.name || config.name}`)
  if (config.desc || options.desc) {
    lines.push(`#!desc = ${options.desc || config.desc}`)
  }
  if (config.icon || options.icon) {
    lines.push(`#!icon = ${options.icon || config.icon}`)
  }
  if (config.author || options.author) {
    lines.push(`#!author = ${options.author || config.author}`)
  }
  lines.push("")

  // Rewrite section
  if (config.rewrites.length > 0) {
    lines.push("[Rule]")
    for (const rewrite of config.rewrites) {
      if (rewrite.type === "url-rewrite") {
        const flags = rewrite.enabled ? "" : ", disabled"
        lines.push(`${rewrite.pattern}, ${rewrite.replacement}, header${flags}`)
      }
    }
    lines.push("")
  }

  // Script section
  if (config.scripts.length > 0) {
    lines.push("[Script]")
    for (const script of config.scripts) {
      const parts = [`${script.name} =`]
      parts.push(`type=${script.type}`)
      if (script.pattern) parts.push(`pattern=${script.pattern}`)
      if (script.timeout) parts.push(`timeout=${script.timeout}`)
      if (script.argument) parts.push(`argument=${script.argument}`)
      parts.push(`script-path=${script.scriptPath}`)
      const flags = script.enabled ? "" : ", disabled"
      lines.push(`${parts.join(", ")}${flags}`)
    }
    lines.push("")
  }

  // Rule section
  if (config.rules && config.rules.length > 0) {
    lines.push("[Rule]")
    for (const rule of config.rules) {
      lines.push(rule)
    }
    lines.push("")
  }

  // MITM section
  if (config.mitm) {
    lines.push("[MITM]")
    lines.push(`hostname = %APPEND% ${config.mitm.hostname.join(", ")}`)
    if (config.mitm.skipServerCertCheck) {
      lines.push("skip-server-cert-check = true")
    }
  }

  return lines.join("\n")
}
