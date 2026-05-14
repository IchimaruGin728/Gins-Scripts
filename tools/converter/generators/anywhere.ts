import type { ModuleConfig, GenerateOptions } from "../types"

export function generateAnywhereMITMRuleSet(config: ModuleConfig, options: GenerateOptions = {} as GenerateOptions): string {
  const lines: string[] = []

  // Header
  lines.push(`name = ${options.name || config.name}`)
  if (config.mitm) {
    lines.push(`hostname = ${config.mitm.hostname.join(", ")}`)
  }
  lines.push("")

  // Rules
  for (const rewrite of config.rewrites) {
    switch (rewrite.type) {
      case "url-rewrite":
        lines.push(`0, 0, ${rewrite.pattern}, ${rewrite.replacement}`)
        break
      case "header-rewrite":
        if (rewrite.header) {
          const [headerName, ...valueParts] = rewrite.header.split(":")
          const headerValue = valueParts.join(":").trim()
          if (headerValue) {
            lines.push(`1, 1, ${headerName?.trim()}, ${headerValue}`)
          } else {
            lines.push(`1, 2, ${headerName?.trim()}`)
          }
        }
        break
    }
  }

  return lines.join("\n")
}
