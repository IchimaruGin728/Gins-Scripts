import { Storage, Widget } from "scripting"

export type CountdownItem = {
  id: string
  name: string
  icon: string
  iconType: "sys" | "txt"
  date: string
  colorKey: ColorKey
  created: number
}

export type ColorKey = "pink" | "green" | "blue" | "orange" | "purple" | "teal"
export type ThemeMode = "light" | "dark"
export type HeatmapColorKey = "green" | "yellow" | "purple"

export const DATA_KEY = "gins.countdown.items.v1"
export const THEME_KEY = "gins.countdown.theme.v1"
export const HEATMAP_KEY = "gins.countdown.heatmap.v1"
export const ONE_DAY = 1000 * 60 * 60 * 24

export const ICON_OPTIONS = [
  { label: "沙漏", icon: "hourglass", iconType: "sys" as const },
  { label: "爱心", icon: "heart.fill", iconType: "sys" as const },
  { label: "太阳", icon: "sun.max.fill", iconType: "sys" as const },
  { label: "学士帽", icon: "graduationcap.fill", iconType: "sys" as const },
  { label: "公文包", icon: "briefcase.fill", iconType: "sys" as const },
  { label: "跑步", icon: "figure.run", iconType: "sys" as const },
  { label: "火车", icon: "train.side.front.car", iconType: "sys" as const },
  { label: "蛋糕", icon: "birthday.cake.fill", iconType: "sys" as const },
  { label: "标记", icon: "pin.fill", iconType: "sys" as const },
]

export const COLOR_KEYS: ColorKey[] = ["pink", "green", "blue", "orange", "purple", "teal"]
export const COLOR_MAP: Record<ColorKey, string> = {
  pink: "#FF6B8E",
  green: "#34C98A",
  blue: "#5B9CF8",
  orange: "#FF9A4A",
  purple: "#9B7FF0",
  teal: "#22C8D8",
}

export const HEATMAP_LABELS: Record<HeatmapColorKey, string> = {
  green: "绿色",
  yellow: "黄色",
  purple: "紫色",
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function normalizeDate(input: string) {
  return input.trim().replace(/-/g, ".").replace(/\//g, ".")
}

export function isValidDateText(input: string) {
  if (!/^\d{4}\.\d{2}\.\d{2}$/.test(input)) return false
  const [year, month, day] = input.split(".").map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function parseDate(input: string) {
  const [year, month, day] = normalizeDate(input).split(".").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join(".")
}

export function itemState(item: CountdownItem) {
  const target = parseDate(item.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / ONE_DAY)
  let progress = Math.max(0, Math.min(diff, 365)) / 365
  if (diff > 0 && progress < 0.04) progress = 0.04
  return {
    diff,
    progress,
    displayDate: `${item.date.replace(/-/g, "/").replace(/\./g, "/")}  ${DAY_NAMES[target.getDay()]}`,
    isUrgent: diff <= 10,
  }
}

export function defaultItems(): CountdownItem[] {
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)
  return [
    {
      id: `countdown-${Date.now()}`,
      name: "体验项目",
      icon: "hourglass",
      iconType: "sys",
      date: formatDate(nextMonth),
      colorKey: "blue",
      created: Date.now(),
    },
  ]
}

export function loadItems() {
  const stored = Storage.get<CountdownItem[]>(DATA_KEY, { shared: true })
  const items = Array.isArray(stored) && stored.length > 0 ? stored : defaultItems()
  const activeItems = items
    .filter((item) => item && item.name && item.date && isValidDateText(normalizeDate(item.date)))
    .map((item) => ({ ...item, date: normalizeDate(item.date), id: item.id || `countdown-${item.created || Date.now()}` }))
    .filter((item) => itemState(item).diff >= 0)

  if (activeItems.length !== items.length || !stored) saveItems(activeItems)
  return activeItems
}

export function saveItems(items: CountdownItem[]) {
  Storage.set(DATA_KEY, items, { shared: true })
  Widget.reloadAll()
}

export function loadTheme(): ThemeMode {
  return Storage.get<ThemeMode>(THEME_KEY, { shared: true }) === "dark" ? "dark" : "light"
}

export function toggleTheme() {
  const next = loadTheme() === "dark" ? "light" : "dark"
  Storage.set(THEME_KEY, next, { shared: true })
  Widget.reloadAll()
  return next
}

export function loadHeatmapColor(): HeatmapColorKey {
  const value = Storage.get<HeatmapColorKey>(HEATMAP_KEY, { shared: true })
  return value === "green" || value === "yellow" || value === "purple" ? value : "purple"
}

export function toggleHeatmapColor() {
  const value = loadHeatmapColor()
  const next = value === "green" ? "yellow" : value === "yellow" ? "purple" : "green"
  Storage.set(HEATMAP_KEY, next, { shared: true })
  Widget.reloadAll()
  return next
}

export function palette(mode: ThemeMode) {
  const dark = mode === "dark"
  return {
    bg: dark ? "#000000" : "#FFFFFF",
    card: dark ? "#1C1C1E" : "#F2F2F7",
    title: dark ? "#FFFFFF" : "#1C1C1E",
    date: dark ? "#8E8E93" : "#636366",
    text: dark ? "#FFFFFF" : "#000000",
    base: dark ? "#3A3A3C" : "#D1D1D6",
    accent: dark ? "#A855F7" : "#7D86F8",
    warning: dark ? "#FF6B6B" : "#FF3B30",
    heatBase: dark ? "#2C2C2E" : "#E0E0E0",
  }
}

export function heatmapPalette(mode: ThemeMode, key: HeatmapColorKey) {
  const colors = {
    green: {
      light: ["#9BE9A8", "#40C463", "#30A14E", "#216E39"],
      dark: ["#0E4429", "#006D32", "#26A641", "#39D353"],
    },
    yellow: {
      light: ["#FFDF8C", "#FFCA58", "#F5A700", "#C88500"],
      dark: ["#6E4C00", "#9B6B00", "#CC8E00", "#FFB41F"],
    },
    purple: {
      light: ["#E1BDFC", "#C685F9", "#A04AF2", "#7A22CE"],
      dark: ["#3C1361", "#5A1D91", "#822BC2", "#A855F7"],
    },
  }
  return colors[key][mode]
}

export function randomHeatColor(colors: string[], base: string) {
  const value = Math.random()
  if (value < 0.58) return base
  if (value < 0.72) return colors[0]
  if (value < 0.86) return colors[1]
  if (value < 0.95) return colors[2]
  return colors[3]
}
