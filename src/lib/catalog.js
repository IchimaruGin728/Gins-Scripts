export const TYPES = [
  { id: "widgets", label: "Widgets", description: "Visual widgets, tiles, and panels." },
  {
    id: "modules",
    label: "Modules",
    description: "Importable modules and configuration packages.",
  },
  { id: "scripts", label: "Scripts", description: "Standalone automation scripts and utilities." },
]

export const SOFTWARES = [
  { id: "scriptable", label: "Scriptable" },
  { id: "scripting", label: "Scripting" },
  { id: "egern", label: "Egern" },
  { id: "quantumultx", label: "QuantumultX" },
  { id: "stash", label: "Stash" },
  { id: "surge", label: "Surge" },
  { id: "loon", label: "Loon" },
  { id: "shadowrocket", label: "Shadowrocket" },
]

export const FILES = [
  {
    type: "widgets",
    software: "scriptable",
    product: "qweather",
    label: "QWeather Weather Widget",
    source: "scriptable/QWeatherWeatherWidget.js",
    slug: "qweather-weather-widget",
  },
  {
    type: "widgets",
    software: "scriptable",
    product: "datagovsg",
    label: "DataGovSG Dashboard",
    source: "scriptable/DataGovSGDashboard.js",
    slug: "datagovsg-dashboard",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "qweather",
    label: "QWeather Widget Index",
    source: "scripting/qweather-weather-widget/index.tsx",
    slug: "qweather-weather-widget/index",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "qweather",
    label: "QWeather Widget Shared",
    source: "scripting/qweather-weather-widget/shared.ts",
    slug: "qweather-weather-widget/shared",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "qweather",
    label: "QWeather Widget View",
    source: "scripting/qweather-weather-widget/widget.tsx",
    slug: "qweather-weather-widget/widget",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "datagovsg",
    label: "DataGovSG Index",
    source: "scripting/datagovsg-dashboard/index.tsx",
    slug: "datagovsg-dashboard/index",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "datagovsg",
    label: "DataGovSG Shared",
    source: "scripting/datagovsg-dashboard/shared.ts",
    slug: "datagovsg-dashboard/shared",
  },
  {
    type: "widgets",
    software: "scripting",
    product: "datagovsg",
    label: "DataGovSG Widget View",
    source: "scripting/datagovsg-dashboard/widget.tsx",
    slug: "datagovsg-dashboard/widget",
  },
  {
    type: "widgets",
    software: "egern",
    product: "qweather",
    label: "QWeather Widget",
    source: "egern/qweather-weather-widget.js",
    slug: "qweather-weather-widget",
  },
  {
    type: "modules",
    software: "egern",
    product: "qweather",
    label: "QWeather Module",
    source: "egern/qweather-weather-module.yaml",
    slug: "qweather-weather-module",
  },
  {
    type: "widgets",
    software: "egern",
    product: "datagovsg",
    label: "DataGovSG Dashboard",
    source: "egern/datagovsg-dashboard.js",
    slug: "datagovsg-dashboard",
  },
  {
    type: "widgets",
    software: "stash",
    product: "qweather",
    label: "QWeather Tile",
    source: "stash/qweather-weather-tile.js",
    slug: "qweather-weather-tile",
  },
  {
    type: "widgets",
    software: "surge",
    product: "qweather",
    label: "QWeather Panel",
    source: "surge/qweather-weather-panel.js",
    slug: "qweather-weather-panel",
  },
]

export function getDownloadPath(file) {
  return `/downloads/${file.source}`
}

export function getCanonicalPath(file) {
  return `/${file.type}/${file.software}/${file.slug}`
}

export function getTypePath(typeId) {
  return `/${typeId}`
}

export function getSoftwarePath(typeId, softwareId) {
  return `/${typeId}/${softwareId}`
}

export function getPagePaths() {
  const pages = new Map()
  for (const type of TYPES) {
    pages.set(getTypePath(type.id), `${getTypePath(type.id)}/index.html`)
    for (const software of SOFTWARES) {
      pages.set(
        getSoftwarePath(type.id, software.id),
        `${getSoftwarePath(type.id, software.id)}/index.html`
      )
    }
  }
  return pages
}

export function getAliasMap() {
  const aliases = new Map()
  for (const file of FILES) {
    aliases.set(getCanonicalPath(file), getDownloadPath(file))
  }
  return aliases
}

export function filesFor(typeId, softwareId) {
  return FILES.filter((file) => {
    if (softwareId) return file.type === typeId && file.software === softwareId
    return file.type === typeId
  })
}

export function typeById(typeId) {
  return TYPES.find((type) => type.id === typeId)
}

export function softwareById(softwareId) {
  return SOFTWARES.find((software) => software.id === softwareId)
}
