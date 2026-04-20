export type CatalogType = "widgets" | "modules" | "scripts"

export type SoftwareId =
  | "scriptable"
  | "scripting"
  | "egern"
  | "quantumultx"
  | "stash"
  | "surge"
  | "loon"
  | "shadowrocket"

export interface CatalogTypeEntry {
  id: CatalogType
  label: string
  description: string
}

export interface SoftwareEntry {
  id: SoftwareId
  label: string
}

export interface CatalogFile {
  type: CatalogType
  software: SoftwareId
  product: string
  label: string
  source: string
  slug: string
}

export {
  FILES,
  SOFTWARES,
  TYPES,
  filesFor,
  getAliasMap,
  getCanonicalPath,
  getDownloadPath,
  getPagePaths,
  getSoftwarePath,
  getTypePath,
  softwareById,
  typeById,
} from "./catalog.js"
