export type WeatherBundle = {
  now: any
  daily: any[]
  hourly: any[]
  updateTime: string
}

export type WidgetSettings = {
  apiKey: string
  location: string
  lang: string
  unit: string
  weatherName: string
  apiHost: string
}

export const WEATHER_SYMBOLS: Record<string, string> = {
  "100": "sun.max.fill",
  "101": "cloud.sun.fill",
  "102": "cloud.sun.fill",
  "103": "cloud.fill",
  "104": "smoke.fill",
  "150": "moon.stars.fill",
  "151": "cloud.moon.fill",
  "152": "cloud.moon.fill",
  "153": "cloud.fill",
  "300": "cloud.drizzle.fill",
  "301": "cloud.rain.fill",
  "302": "cloud.heavyrain.fill",
  "303": "cloud.bolt.rain.fill",
  "304": "cloud.sleet.fill",
  "305": "cloud.drizzle.fill",
  "306": "cloud.rain.fill",
  "307": "cloud.heavyrain.fill",
  "308": "cloud.heavyrain.fill",
  "309": "cloud.sun.rain.fill",
  "310": "cloud.sun.rain.fill",
  "311": "cloud.hail.fill",
  "312": "cloud.sleet.fill",
  "313": "cloud.sleet.fill",
  "314": "cloud.hail.fill",
  "315": "cloud.heavyrain.fill",
  "316": "cloud.heavyrain.fill",
  "317": "cloud.heavyrain.fill",
  "318": "cloud.bolt.rain.fill",
  "399": "cloud.rain.fill",
  "400": "snowflake",
  "401": "cloud.snow.fill",
  "402": "cloud.snow.fill",
  "403": "snowflake",
  "404": "snowflake",
  "405": "cloud.sleet.fill",
  "406": "cloud.sleet.fill",
  "407": "wind.snow",
  "408": "wind.snow",
  "409": "wind.snow",
  "499": "cloud.snow.fill",
  "500": "cloud.fog.fill",
  "501": "cloud.fog.fill",
  "502": "cloud.fog.fill",
  "503": "sun.haze.fill",
  "504": "sun.haze.fill",
  "507": "wind",
  "508": "wind",
  "509": "wind",
  "510": "wind",
  "511": "wind",
  "512": "wind",
  "513": "wind",
  "514": "wind",
  "515": "wind",
  "800": "tornado",
  "801": "tornado",
  "802": "tornado",
  "803": "moonphase.waning.gibbous.inverse",
  "804": "moonphase.waxing.gibbous.inverse",
  "805": "moon.stars.fill",
  "806": "sun.max.fill",
  "807": "cloud.fill",
  "900": "thermometer.medium",
  "901": "thermometer.low",
  "999": "cloud.fill",
}

export function symbolFor(icon: string) {
  return WEATHER_SYMBOLS[String(icon)] || "cloud.fill"
}

export function unitText(unit: string) {
  return unit === "i" ? "°F" : "°C"
}

export function speedUnit(unit: string) {
  return unit === "i" ? "mph" : "km/h"
}

export function alpha(hex: string, opacity: number) {
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0")
  return `${hex}${value}`.replace("##", "#")
}

export function buildUrl(base: string, params: Record<string, string>) {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "") url.searchParams.set(key, value)
  })
  return url.toString()
}

export function readSettings(parameter?: string): WidgetSettings {
  let parsed: any = {}
  if (parameter) {
    try {
      parsed = JSON.parse(parameter)
    } catch {
      parsed = {}
    }
  }
  return {
    apiKey: parsed.WEATHER_API_KEY || parsed.QWEATHER_KEY || "",
    location: parsed.WEATHER_LOCATION || parsed.QWEATHER_LOCATION || "",
    lang: parsed.QWEATHER_LANG || "zh",
    unit: parsed.QWEATHER_UNIT || "m",
    weatherName: parsed.WEATHER_NAME || "城市天气",
    apiHost: parsed.WEATHER_API_HOST || parsed.QWEATHER_HOST || "https://devapi.qweather.com",
  }
}

export async function qFetch(path: string, params: Record<string, string>, settings: WidgetSettings) {
  const response = await fetch(buildUrl(`${settings.apiHost}${path}`, params), {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
  })
  const json = await response.json()
  if (!json || json.code !== "200") {
    throw new Error(`QWeather error: ${json?.code || response.status}`)
  }
  return json
}

export async function loadWeather(settings: WidgetSettings): Promise<WeatherBundle> {
  if (!settings.apiKey || !settings.location) {
    throw new Error("Missing WEATHER_API_KEY/QWEATHER_KEY or WEATHER_LOCATION/QWEATHER_LOCATION")
  }
  const params = {
    location: settings.location,
    lang: settings.lang,
    unit: settings.unit,
  }
  const [now, daily, hourly] = await Promise.all([
    qFetch("/v7/weather/now", params, settings),
    qFetch("/v7/weather/3d", params, settings),
    qFetch("/v7/weather/24h", params, settings),
  ])
  return {
    now: now.now,
    daily: daily.daily,
    hourly: hourly.hourly,
    updateTime: now.updateTime,
  }
}

export function chartData(hourly: any[], count: number) {
  return hourly.slice(0, count).map((item) => ({
    x: new Date(item.fxTime).getHours(),
    temp: Number(item.temp),
    icon: item.icon,
    label: `${String(new Date(item.fxTime).getHours()).padStart(2, "0")}h`,
  }))
}
