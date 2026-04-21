export type DashboardSettings = {
  apiKey: string
  area: string
  trafficCameraId: string
  showTraffic: boolean
}

export type DashboardBundle = {
  currentTemp: number
  tempLow: number
  tempHigh: number
  humidityLow: number
  humidityHigh: number
  twoHourArea: { area: string; forecast: string; period: string }
  twentyFour: any
  fourDay: any[]
  uvSeries: Array<{ hour: string; value: number }>
  uvNow: number
  pm25: Record<string, number>
  pm25Max: number
  rainfallTop: Array<{ name: string; value: number }>
  rainfallMax: number
  updatedAt: string
  outdoorScore: number
}

const REALTIME_BASE = "https://api-open.data.gov.sg/v2/real-time/api"

export const PALETTE = {
  purple: "#4D3DD8",
  purpleBright: "#7C71FF",
  purpleSoft: "#B8B1FF",
  purpleDeep: "#21185E",
  card: "rgba(255,255,255,0.08)",
  cardStrong: "rgba(255,255,255,0.14)",
  white: "#F7F7FF",
  whiteSoft: "rgba(247,247,255,0.82)",
  success: "#69E3B1",
  warning: "#FFD166",
  danger: "#FF7B8A",
}

export function alpha(hex: string, opacity: number) {
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${value}`.replace("##", "#")
}

export function readSettings(parameter?: string): DashboardSettings {
  let parsed: any = {}
  if (parameter) {
    try {
      parsed = JSON.parse(parameter)
    } catch {
      parsed = {}
    }
  }
  return {
    apiKey: parsed.DATAGOVSG_API_KEY || "",
    area: parsed.AREA || "City",
    trafficCameraId: parsed.TRAFFIC_CAMERA_ID || "1704",
    showTraffic: parsed.SHOW_TRAFFIC === true || parsed.SHOW_TRAFFIC === "true",
  }
}

async function fetchJson(path: string, settings: DashboardSettings) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (settings.apiKey) headers["x-api-key"] = settings.apiKey
  const response = await fetch(`${REALTIME_BASE}/${path}`, { headers })
  const json = await response.json()
  if (!json || json.code !== 0) {
    throw new Error(`DataGovSG error: ${json?.errorMsg || response.status}`)
  }
  return json.data
}

export function forecastSymbol(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes("thunder")) return "cloud.bolt.rain.fill"
  if (lower.includes("shower")) return "cloud.rain.fill"
  if (lower.includes("rain")) return "cloud.heavyrain.fill"
  if (lower.includes("cloud")) return "cloud.fill"
  if (lower.includes("fair")) return "sun.max.fill"
  if (lower.includes("wind")) return "wind"
  return "cloud.sun.fill"
}

export function pm25Tone(value: number) {
  if (value <= 12) return PALETTE.success
  if (value <= 35) return PALETTE.warning
  return PALETTE.danger
}

function normalizeArea(area: string) {
  return area.trim().toLowerCase()
}

function computeOutdoorScore(bundle: {
  uvNow: number
  pm25: Record<string, number>
  areaForecast: string
  rainfallMax: number
}) {
  const pm = Object.values(bundle.pm25)
  const maxPm = pm.length ? Math.max(...pm) : 0
  let score = 100
  score -= Math.min(bundle.uvNow * 7, 35)
  score -= Math.min(maxPm * 1.2, 30)
  score -= Math.min(bundle.rainfallMax * 5, 20)
  if (/thunder/i.test(bundle.areaForecast)) score -= 15
  else if (/showers?/i.test(bundle.areaForecast)) score -= 10
  return Math.max(8, Math.round(score))
}

export async function loadDashboard(settings: DashboardSettings): Promise<DashboardBundle> {
  const [air, rainfall, uv, pm25, twoHour, twentyFour, fourDay] = await Promise.all([
    fetchJson("air-temperature", settings),
    fetchJson("rainfall", settings),
    fetchJson("uv", settings),
    fetchJson("pm25", settings),
    fetchJson("two-hr-forecast", settings),
    fetchJson("twenty-four-hr-forecast", settings),
    fetchJson("four-day-outlook", settings),
  ])

  const airReading = air.readings[0]?.data || []
  const temps = airReading.map((entry: any) => entry.value)
  const currentTemp = Number((temps.reduce((sum: number, value: number) => sum + value, 0) / Math.max(temps.length, 1)).toFixed(1))
  const tempLow = temps.length ? Math.min(...temps) : currentTemp
  const tempHigh = temps.length ? Math.max(...temps) : currentTemp

  const uvIndex = (uv.records[0]?.index || []).slice().reverse().map((item: any) => ({
    hour: item.hour.slice(11, 13),
    value: item.value,
  }))
  const uvNow = uvIndex.length ? uvIndex[uvIndex.length - 1].value : 0

  const pm25Values = pm25.items[0]?.readings?.pm25_one_hourly || {}
  const pm25Max = Math.max(...Object.values(pm25Values), 0)

  const rainfallStations = rainfall.stations || []
  const stationNameMap = Object.fromEntries(rainfallStations.map((station: any) => [station.id, station.name]))
  const rainfallReadings = (rainfall.readings[0]?.data || [])
    .map((entry: any) => ({
      name: stationNameMap[entry.stationId] || entry.stationId,
      value: entry.value,
    }))
    .sort((a: any, b: any) => b.value - a.value)
  const rainfallTop = rainfallReadings.slice(0, 4)
  const rainfallMax = rainfallTop.length ? rainfallTop[0].value : 0

  const requestedArea = normalizeArea(settings.area)
  const twoHourItem = twoHour.items[0]
  const areaForecast = twoHourItem.forecasts.find((item: any) => normalizeArea(item.area) === requestedArea)
    || twoHourItem.forecasts.find((item: any) => normalizeArea(item.area) === "city")
    || twoHourItem.forecasts[0]

  const twentyFourRecord = twentyFour.records[0]
  const fourDayForecasts = fourDay.records[0]?.forecasts || []
  const humidityLow = twentyFourRecord?.general?.relativeHumidity?.low ?? 0
  const humidityHigh = twentyFourRecord?.general?.relativeHumidity?.high ?? 0
  const updatedAt = [
    air.readings[0]?.timestamp,
    rainfall.readings[0]?.timestamp,
    uv.records[0]?.updatedTimestamp,
    pm25.items[0]?.updatedTimestamp,
    twoHourItem?.update_timestamp,
    twentyFourRecord?.updatedTimestamp,
  ].filter(Boolean).sort().pop() || new Date().toISOString()

  const outdoorScore = computeOutdoorScore({
    uvNow,
    pm25: pm25Values,
    areaForecast: areaForecast.forecast,
    rainfallMax,
  })

  return {
    currentTemp,
    tempLow,
    tempHigh,
    humidityLow,
    humidityHigh,
    twoHourArea: {
      area: areaForecast.area,
      forecast: areaForecast.forecast,
      period: twoHourItem.valid_period.text,
    },
    twentyFour: twentyFourRecord,
    fourDay: fourDayForecasts,
    uvSeries: uvIndex,
    uvNow,
    pm25: pm25Values,
    pm25Max,
    rainfallTop,
    rainfallMax,
    updatedAt,
    outdoorScore,
  }
}
