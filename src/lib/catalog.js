export const SOFTWARES = [
  { id: "Scripting", label: "Scripting" },
  { id: "Scriptable", label: "Scriptable" },
  { id: "Egern", label: "Egern" },
  { id: "Stash", label: "Stash" },
  { id: "Surge", label: "Surge" },
  { id: "Shadowrocket", label: "Shadowrocket" },
  { id: "Loon", label: "Loon" },
  { id: "QuantumultX", label: "QuantumultX" },
]

export const CATEGORIES = [
  { id: "Widget", label: "Widget", description: "Home screen and app widgets." },
  { id: "Script", label: "Script", description: "Standalone automation scripts." },
  { id: "Module", label: "Module", description: "Importable modules and configuration packages." },
  { id: "Override", label: "Override", description: "Stash override configuration." },
  { id: "Tile", label: "Tile", description: "Stash tile display scripts." },
  { id: "Rewrite", label: "Rewrite", description: "QuantumultX rewrite resources." },
]

export const CATEGORIES_BY_SOFTWARE = {
  Scripting: ["Script", "Widget"],
  Scriptable: ["Widget"],
  Egern: ["Script", "Widget", "Module"],
  Stash: ["Override", "Tile"],
  Surge: ["Script", "Module"],
  Shadowrocket: ["Script", "Module"],
  Loon: ["Script", "Module"],
  QuantumultX: ["Rewrite"],
}

export const FILES = [
  {
    software: "Scriptable",
    category: "Widget",
    product: "QWeather",
    label: "QWeather",
    source: "Scriptable/QWeather.js",
    slug: "QWeather",
  },
  {
    software: "Scriptable",
    category: "Widget",
    product: "DataGovSG",
    label: "DataGovSG",
    source: "Scriptable/DataGovSG.js",
    slug: "DataGovSG",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "QWeather",
    label: "QWeather Index",
    source: "Scripting/QWeather/index.tsx",
    slug: "QWeather/index",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "QWeather",
    label: "QWeather Shared",
    source: "Scripting/QWeather/shared.ts",
    slug: "QWeather/shared",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "QWeather",
    label: "QWeather View",
    source: "Scripting/QWeather/widget.tsx",
    slug: "QWeather/widget",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "DataGovSG",
    label: "DataGovSG Index",
    source: "Scripting/DataGovSG/index.tsx",
    slug: "DataGovSG/index",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "DataGovSG",
    label: "DataGovSG Shared",
    source: "Scripting/DataGovSG/shared.ts",
    slug: "DataGovSG/shared",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "DataGovSG",
    label: "DataGovSG View",
    source: "Scripting/DataGovSG/widget.tsx",
    slug: "DataGovSG/widget",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "Countdown",
    label: "Countdown Index",
    source: "Scripting/Countdown/index.tsx",
    slug: "Countdown/index",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "Countdown",
    label: "Countdown Shared",
    source: "Scripting/Countdown/shared.ts",
    slug: "Countdown/shared",
  },
  {
    software: "Scripting",
    category: "Widget",
    product: "Countdown",
    label: "Countdown View",
    source: "Scripting/Countdown/widget.tsx",
    slug: "Countdown/widget",
  },
  {
    software: "Egern",
    category: "Widget",
    product: "QWeather",
    label: "QWeather",
    source: "Egern/QWeather.js",
    slug: "QWeather",
  },
  {
    software: "Egern",
    category: "Module",
    product: "QWeather",
    label: "QWeather",
    source: "Egern/QWeather.yaml",
    slug: "QWeather",
  },
  {
    software: "Egern",
    category: "Widget",
    product: "DataGovSG",
    label: "DataGovSG",
    source: "Egern/DataGovSG.js",
    slug: "DataGovSG",
  },
  {
    software: "Stash",
    category: "Tile",
    product: "QWeather",
    label: "QWeather",
    source: "Stash/QWeather.js",
    slug: "QWeather",
  },
  {
    software: "Surge",
    category: "Script",
    product: "QWeather",
    label: "QWeather",
    source: "Surge/QWeather.js",
    slug: "QWeather",
  },
]

export function getDownloadPath(file) {
  const basename = file.source.split("/").at(-1)
  if (file.software === "Scripting") {
    return `/${file.software}/${file.category}/${file.product}/${basename}`
  }
  const extension = basename.includes(".") ? `.${basename.split(".").at(-1)}` : ""
  return `/${file.software}/${file.category}/${file.product}${extension}`
}

export function getCanonicalPath(file) {
  return `/${file.software}/${file.category}/${file.slug}`
}

export function getScriptingPackageBasePath(project, category = "Widget") {
  return `/Scripting/${category}/${project}`
}

export function getScriptingPackageDirectoryPath(project, category = "Widget") {
  return `${getScriptingPackageBasePath(project, category)}/`
}

export function getScriptingPackageZipPath(project, category = "Widget") {
  return `${getScriptingPackageBasePath(project, category)}.zip`
}

export function getScriptingPackageFilePath(project, category = "Widget") {
  return `${getScriptingPackageBasePath(project, category)}.scripting`
}

export function getSoftwarePath(softwareId) {
  return `/${softwareId}`
}

export function getCategoryPath(softwareId, categoryId) {
  return `/${softwareId}/${categoryId}`
}

export function getPagePaths() {
  const pages = new Map()
  for (const software of SOFTWARES) {
    pages.set(getSoftwarePath(software.id), `${getSoftwarePath(software.id)}/index.html`)
    for (const category of categoriesForSoftware(software.id)) {
      pages.set(
        getCategoryPath(software.id, category.id),
        `${getCategoryPath(software.id, category.id)}/index.html`
      )
    }
  }
  for (const file of FILES) {
    pages.set(getCanonicalPath(file), `${getCanonicalPath(file)}/index.html`)
  }
  return pages
}

export function getAliasMap() {
  const aliases = new Map()
  for (const file of FILES) {
    aliases.set(`${getCanonicalPath(file)}/raw`, getDownloadPath(file))
  }
  return aliases
}

export function filesFor(softwareId, categoryId) {
  return FILES.filter((file) => {
    if (categoryId) return file.software === softwareId && file.category === categoryId
    return file.software === softwareId
  })
}

export function softwareById(softwareId) {
  return SOFTWARES.find((software) => software.id === softwareId)
}

export function categoryById(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId)
}

export function categoriesForSoftware(softwareId) {
  const allowedIds = CATEGORIES_BY_SOFTWARE[softwareId] ?? []
  return CATEGORIES.filter((category) => allowedIds.includes(category.id))
}

export const TYPES = CATEGORIES
export const SOFTWARES_BY_TYPE = {}
export const getTypePath = (typeId) => `/${typeId}`
export const typeById = categoryById
export const softwaresForType = () => SOFTWARES
