export type SoftwareId =
  | "surge"
  | "qx"
  | "loon"
  | "stash"
  | "egern"
  | "shadowrocket"

export type RewriteType =
  | "url-rewrite"
  | "header-rewrite"
  | "body-rewrite"
  | "reject"
  | "mock"
  | "redirect"

export type ScriptType =
  | "http-request"
  | "http-response"
  | "cron"
  | "event"
  | "rule"
  | "dns"

export interface RewriteRule {
  type: RewriteType
  pattern: string
  replacement?: string
  header?: string
  value?: string
  statusCode?: number
  enabled: boolean
}

export interface ScriptRule {
  type: ScriptType
  name: string
  pattern?: string
  scriptPath: string
  timeout?: number
  cronExp?: string
  argument?: string
  enabled: boolean
}

export interface MITMConfig {
  hostname: string[]
  skipServerCertCheck?: boolean
  caPassphrase?: string
}

export interface ModuleConfig {
  name: string
  desc?: string
  icon?: string
  author?: string
  url?: string
  category?: string
  rewrites: RewriteRule[]
  scripts: ScriptRule[]
  mitm?: MITMConfig
  rules?: string[]
  dns?: Record<string, string>
}

export interface ParseResult {
  source: SoftwareId
  config: ModuleConfig
  raw: string
}

export interface GenerateOptions {
  target: SoftwareId
  name?: string
  desc?: string
  icon?: string
  author?: string
}
