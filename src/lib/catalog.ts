export type SoftwareId =
  | "Scripting"
  | "Scriptable"
  | "Egern"
  | "Stash"
  | "Surge"
  | "Shadowrocket"
  | "Loon"
  | "QuantumultX"

export type CatalogCategory = "Widget" | "Script" | "Module" | "Override" | "Tile" | "Rewrite"

export interface CatalogCategoryEntry {
  id: CatalogCategory
  label: string
  description: string
}

export interface SoftwareEntry {
  id: SoftwareId
  label: string
}

export interface CatalogFile {
  software: SoftwareId
  category: CatalogCategory
  product: string
  label: string
  source: string
  slug: string
}

export {
  CATEGORIES,
  CATEGORIES_BY_SOFTWARE,
  categoriesForSoftware,
  categoryById,
  FILES,
  filesFor,
  getAliasMap,
  getCanonicalPath,
  getCategoryPath,
  getDownloadPath,
  getPagePaths,
  getSoftwarePath,
  SOFTWARES,
  softwareById,
} from "./catalog.js"
