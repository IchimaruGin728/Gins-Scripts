import type { ModuleConfig, GenerateOptions } from "../types"

export function generateQXRewrite(config: ModuleConfig, options: GenerateOptions = {} as GenerateOptions): string {
  const lines: string[] = []

  // Header comment
  lines.push(`# ${options.name || config.name}`)
  if (config.desc || options.desc) {
    lines.push(`# ${options.desc || config.desc}`)
  }
  lines.push("")

  // Rewrite section
  if (config.rewrites.length > 0) {
    lines.push("[rewrite_local]")
    for (const rewrite of config.rewrites) {
      const prefix = rewrite.enabled ? "" : "# "
      switch (rewrite.type) {
        case "url-rewrite":
          lines.push(`${prefix}${rewrite.pattern} url-rewrite ${rewrite.replacement}`)
          break
        case "reject":
          lines.push(`${prefix}${rewrite.pattern} reject`)
          break
        case "header-rewrite":
          lines.push(`${prefix}${rewrite.pattern} request-header ${rewrite.header}`)
          break
      }
    }
    lines.push("")
  }

  // Script section
  if (config.scripts.length > 0) {
    lines.push("[task_local]")
    for (const script of config.scripts) {
      const prefix = script.enabled ? "" : "# "
      if (script.type === "cron") {
        lines.push(`${prefix}${script.name} cron ${script.cronExp} ${script.scriptPath}`)
      } else {
        lines.push(`${prefix}${script.name} ${script.type} ${script.pattern} ${script.scriptPath}`)
      }
    }
    lines.push("")
  }

  // MITM section
  if (config.mitm) {
    lines.push("[mitm]")
    lines.push(`hostname = %APPEND% ${config.mitm.hostname.join(", ")}`)
  }

  return lines.join("\n")
}
