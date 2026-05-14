export const SOFTWARES = [
  { id: "Scripting", label: "Scripting" },
  { id: "Scriptable", label: "Scriptable" },
  { id: "ScriptWidget", label: "ScriptWidget" },
  { id: "Surge", label: "Surge" },
  { id: "Egern", label: "Egern" },
  { id: "Stash", label: "Stash" },
  { id: "QuantumultX", label: "QuantumultX" },
  { id: "Loon", label: "Loon" },
  { id: "Shadowrocket", label: "Shadowrocket" },
  { id: "Anywhere", label: "Anywhere" },
]

export const CATEGORIES = [
  { id: "Widgets", label: "Widgets", description: "Home screen and app widgets." },
  { id: "Scripts", label: "Scripts", description: "Standalone automation scripts." },
  {
    id: "Modules",
    label: "Modules",
    description: "Importable modules and configuration packages.",
  },
  { id: "Panels", label: "Panels", description: "Dashboard panel scripts." },
  { id: "Overrides", label: "Overrides", description: "Stash override configuration." },
  { id: "Tiles", label: "Tiles", description: "Stash tile display scripts." },
  { id: "Rewrite", label: "Rewrite", description: "QuantumultX rewrite resources." },
  { id: "Gallery", label: "Gallery", description: "QuantumultX gallery resources." },
  { id: "Plugins", label: "Plugins", description: "Loon plugins." },
]

export const CATEGORIES_BY_SOFTWARE = {
  Scripting: ["Scripts", "Widgets"],
  Scriptable: ["Scripts", "Widgets"],
  ScriptWidget: ["Widgets"],
  Surge: ["Modules", "Scripts", "Panels"],
  Egern: ["Modules", "Scripts"],
  Stash: ["Overrides", "Scripts", "Tiles"],
  QuantumultX: ["Rewrite", "Gallery"],
  Loon: ["Plugins", "Scripts"],
  Shadowrocket: ["Modules"],
  Anywhere: [],
}

export const FILES = [
  // Scripting Widgets
  {
    software: "Scripting",
    category: "Widgets",
    product: "QWeather",
    label: "QWeather Index",
    source: "Scripting/Widgets/QWeather/index.tsx",
    slug: "QWeather/index",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "QWeather",
    label: "QWeather Shared",
    source: "Scripting/Widgets/QWeather/shared.ts",
    slug: "QWeather/shared",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "QWeather",
    label: "QWeather View",
    source: "Scripting/Widgets/QWeather/widget.tsx",
    slug: "QWeather/widget",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "DataGovSG",
    label: "DataGovSG Index",
    source: "Scripting/Widgets/DataGovSG/index.tsx",
    slug: "DataGovSG/index",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "DataGovSG",
    label: "DataGovSG Shared",
    source: "Scripting/Widgets/DataGovSG/shared.ts",
    slug: "DataGovSG/shared",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "DataGovSG",
    label: "DataGovSG View",
    source: "Scripting/Widgets/DataGovSG/widget.tsx",
    slug: "DataGovSG/widget",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "Countdown",
    label: "Countdown Index",
    source: "Scripting/Widgets/Countdown/index.tsx",
    slug: "Countdown/index",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "Countdown",
    label: "Countdown Shared",
    source: "Scripting/Widgets/Countdown/shared.ts",
    slug: "Countdown/shared",
  },
  {
    software: "Scripting",
    category: "Widgets",
    product: "Countdown",
    label: "Countdown View",
    source: "Scripting/Widgets/Countdown/widget.tsx",
    slug: "Countdown/widget",
  },
  // Scriptable Widgets
  {
    software: "Scriptable",
    category: "Widgets",
    product: "QWeather",
    label: "QWeather",
    source: "Scriptable/Widgets/QWeather.js",
    slug: "QWeather",
  },
  {
    software: "Scriptable",
    category: "Widgets",
    product: "DataGovSG",
    label: "DataGovSG",
    source: "Scriptable/Widgets/DataGovSG.js",
    slug: "DataGovSG",
  },
  // Egern
  {
    software: "Egern",
    category: "Widgets",
    product: "QWeather",
    label: "QWeather",
    source: "Egern/Scripts/Widgets/QWeather.js",
    slug: "QWeather",
  },
  {
    software: "Egern",
    category: "Modules",
    product: "QWeather",
    label: "QWeather",
    source: "Egern/Modules/QWeather.yaml",
    slug: "QWeather",
  },
  {
    software: "Egern",
    category: "Widgets",
    product: "DataGovSG",
    label: "DataGovSG",
    source: "Egern/Scripts/Widgets/DataGovSG.js",
    slug: "DataGovSG",
  },
  // Stash
  {
    software: "Stash",
    category: "Tiles",
    product: "QWeather",
    label: "QWeather",
    source: "Stash/Tiles/QWeather.js",
    slug: "QWeather",
  },
  // Surge
  {
    software: "Surge",
    category: "Scripts",
    product: "QWeather",
    label: "QWeather",
    source: "Surge/Scripts/QWeather.js",
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

export function getScriptingPackageBasePath(project, category = "Widgets") {
  return `/Scripting/${category}/${project}`
}

export function getScriptingPackageDirectoryPath(project, category = "Widgets") {
  return `${getScriptingPackageBasePath(project, category)}/`
}

export function getScriptingPackageZipPath(project, category = "Widgets") {
  return `${getScriptingPackageBasePath(project, category)}.zip`
}

export function getScriptingPackageFilePath(project, category = "Widgets") {
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
