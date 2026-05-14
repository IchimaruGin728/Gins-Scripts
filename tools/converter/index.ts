import type { SoftwareId, ModuleConfig, ParseResult, GenerateOptions } from "./types"

// Parsers
import { parseSurgeModule } from "./parsers/surge"
import { parseQXRewrite } from "./parsers/qx"
import { parseLoonPlugin } from "./parsers/loon"
import { parseStashOverride } from "./parsers/stash"
import { parseEgernModule } from "./parsers/egern"
import { parseShadowrocketModule } from "./parsers/shadowrocket"
import { parseAnywhereModule } from "./parsers/anywhere"

// Generators
import { generateSurgeModule } from "./generators/surge"
import { generateQXRewrite } from "./generators/qx"
import { generateLoonPlugin } from "./generators/loon"
import { generateStashOverride } from "./generators/stash"
import { generateEgernModule } from "./generators/egern"
import { generateShadowrocketModule } from "./generators/shadowrocket"
import { generateAnywhereMITMRuleSet } from "./generators/anywhere"

export type { SoftwareId, ModuleConfig, ParseResult, GenerateOptions }

export function detectFormat(raw: string): SoftwareId | null {
  const trimmed = raw.trim()

  // Surge: has [Script] or [URL Rewrite] sections
  if (trimmed.includes("[Script]") || trimmed.includes("[URL Rewrite]")) {
    return "surge"
  }

  // QX: has hostname = %APPEND% or [rewrite_local]
  if (trimmed.includes("hostname = %APPEND%") || trimmed.includes("[rewrite_local]")) {
    return "qx"
  }

  // Loon: has [Plugin] section or #!name =
  if (trimmed.includes("[Plugin]") || (trimmed.includes("#!name =") && trimmed.includes("script-path="))) {
    return "loon"
  }

  // Stash: similar to Surge but different section names
  if (trimmed.includes("[Map Local]") && trimmed.includes("[MITM]")) {
    return "stash"
  }

  // Egern: YAML format with url_rewrites or scripts
  if (trimmed.includes("url_rewrites:") || trimmed.includes("scripts:")) {
    return "egern"
  }

  // Anywhere: has phase, operation format
  if (trimmed.match(/^\d+,\s*\d+,\s*.+/m)) {
    return "anywhere" as SoftwareId
  }

  return null
}

export function parse(raw: string, source?: SoftwareId): ParseResult {
  const format = source || detectFormat(raw)

  if (!format) {
    throw new Error("Unable to detect format. Please specify source software.")
  }

  switch (format) {
    case "surge":
      return parseSurgeModule(raw)
    case "qx":
      return parseQXRewrite(raw)
    case "loon":
      return parseLoonPlugin(raw)
    case "stash":
      return parseStashOverride(raw)
    case "egern":
      return parseEgernModule(raw)
    case "shadowrocket":
      return parseShadowrocketModule(raw)
    case "anywhere" as SoftwareId:
      return parseAnywhereModule(raw)
    default:
      throw new Error(`Unsupported source format: ${format}`)
  }
}

export function generate(config: ModuleConfig, target: SoftwareId, options: GenerateOptions = {} as GenerateOptions): string {
  switch (target) {
    case "surge":
      return generateSurgeModule(config, options)
    case "qx":
      return generateQXRewrite(config, options)
    case "loon":
      return generateLoonPlugin(config, options)
    case "stash":
      return generateStashOverride(config, options)
    case "egern":
      return generateEgernModule(config, options)
    case "shadowrocket":
      return generateShadowrocketModule(config, options)
    case "anywhere" as SoftwareId:
      return generateAnywhereMITMRuleSet(config, options)
    default:
      throw new Error(`Unsupported target format: ${target}`)
  }
}

export function convert(raw: string, target: SoftwareId, source?: SoftwareId, options: GenerateOptions = {} as GenerateOptions): string {
  const parseResult = parse(raw, source)
  return generate(parseResult.config, target, options)
}

// CLI entry point
if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log("Usage: converter <source-file> <target-format> [--name <name>] [--desc <desc>]")
    console.log("")
    console.log("Supported formats: surge, qx, loon, stash, egern, shadowrocket, anywhere")
    console.log("")
    console.log("Examples:")
    console.log("  converter module.surge surge")
    console.log("  converter rewrite.qx loon --name 'My Plugin'")
    process.exit(0)
  }

  const fs = require("node:fs")
  const sourceFile = args[0]
  const targetFormat = args[1] as SoftwareId

  const nameIdx = args.indexOf("--name")
  const descIdx = args.indexOf("--desc")
  const options: GenerateOptions = {
    target: targetFormat,
    name: nameIdx >= 0 ? args[nameIdx + 1] : undefined,
    desc: descIdx >= 0 ? args[descIdx + 1] : undefined,
  }

  try {
    const raw = fs.readFileSync(sourceFile, "utf8")
    const result = convert(raw, targetFormat, undefined, options)
    console.log(result)
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
