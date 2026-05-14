export type SoftwareId =
  | "Scripting"
  | "Scriptable"
  | "ScriptWidget"
  | "Surge"
  | "Egern"
  | "Stash"
  | "QuantumultX"
  | "Loon"
  | "Shadowrocket"
  | "Anywhere"

export type CatalogCategory =
  | "Widgets"
  | "Scripts"
  | "Modules"
  | "Panels"
  | "Overrides"
  | "Tiles"
  | "Rewrite"
  | "Gallery"
  | "Plugins"

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
  getScriptingPackageBasePath,
  getScriptingPackageDirectoryPath,
  getScriptingPackageFilePath,
  getScriptingPackageZipPath,
  getSoftwarePath,
  SOFTWARES,
  softwareById,
} from "./catalog.js"
