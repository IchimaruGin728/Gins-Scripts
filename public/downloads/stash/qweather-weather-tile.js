/*
  Stash Tile
  Update a tile with compact weather details from QWeather.

  Recommended tile config:
  [Script]
  weather_tile = type=tile,script-path=qweather-weather-tile.js,timeout=20
*/

const CONFIG = {
  apiKey: "",
  location: "",
  lang: "zh",
  unit: "m",
  weatherName: "天气",
  apiHost: "https://devapi.qweather.com",
};

const ICONS = {
  "100": "sun.max.fill",
  "101": "cloud.sun.fill",
  "102": "cloud.sun.fill",
  "103": "cloud.fill",
  "104": "smoke.fill",
  "150": "moon.stars.fill",
  "151": "cloud.moon.fill",
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
  "399": "cloud.rain.fill",
  "400": "snowflake",
  "401": "cloud.snow.fill",
  "500": "cloud.fog.fill",
  "503": "sun.haze.fill",
  "507": "wind",
  "800": "tornado",
  "900": "thermometer.medium",
};

function readEnv(name, fallback) {
  if (typeof $argument !== "undefined" && $argument) {
    const args = Object.fromEntries(
      $argument
        .split("&")
        .map((pair) => pair.split("="))
        .filter((item) => item.length === 2)
        .map(([key, value]) => [decodeURIComponent(key), decodeURIComponent(value)])
    );
    if (args[name]) return args[name];
  }
  return fallback;
}

function buildURL(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function request(url, headers) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (error, response, data) => {
      if (error) return reject(error);
      try {
        resolve(JSON.parse(data));
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

async function qFetch(path, params, cfg) {
  const json = await request(buildURL(`${cfg.apiHost}${path}`, params), {
    Authorization: `Bearer ${cfg.apiKey}`,
  });
  if (!json || json.code !== "200") throw new Error(`QWeather error: ${json?.code || "unknown"}`);
  return json;
}

function temperatureUnit(unit) {
  return unit === "i" ? "°F" : "°C";
}

function pickColor(icon) {
  const rainy = ["300", "301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312", "313", "314", "315", "316", "317", "399"];
  const snowy = ["400", "401", "402", "403", "404"];
  if (snowy.includes(String(icon))) return "#486A9A";
  if (rainy.includes(String(icon))) return "#28587B";
  if (String(icon) === "100") return "#C27421";
  return "#1E4C7A";
}

(async () => {
  const cfg = {
    apiKey: readEnv("WEATHER_API_KEY", readEnv("QWEATHER_KEY", CONFIG.apiKey)),
    location: readEnv("WEATHER_LOCATION", readEnv("QWEATHER_LOCATION", CONFIG.location)),
    lang: readEnv("QWEATHER_LANG", CONFIG.lang),
    unit: readEnv("QWEATHER_UNIT", CONFIG.unit),
    weatherName: readEnv("WEATHER_NAME", CONFIG.weatherName),
    apiHost: readEnv("WEATHER_API_HOST", readEnv("QWEATHER_HOST", CONFIG.apiHost)),
  };

  if (!cfg.apiKey || !cfg.location) {
    $done({
      title: "天气 Tile",
      content: "缺少 WEATHER_API_KEY/QWEATHER_KEY 或 WEATHER_LOCATION/QWEATHER_LOCATION",
      icon: "exclamationmark.triangle.fill",
      backgroundColor: "#6B2331",
    });
    return;
  }

  try {
    const params = {
      location: cfg.location,
      lang: cfg.lang,
      unit: cfg.unit,
    };
    const [nowRes, dailyRes] = await Promise.all([
      qFetch("/v7/weather/now", params, cfg),
      qFetch("/v7/weather/3d", params, cfg),
    ]);
    const now = nowRes.now;
    const today = dailyRes.daily[0];
    const title = `${cfg.weatherName} ${now.temp}${temperatureUnit(cfg.unit)}`;
    const content = `${now.text} | 体感 ${now.feelsLike}${temperatureUnit(cfg.unit)}\n${today.tempMin}/${today.tempMax}${temperatureUnit(cfg.unit)} 湿度 ${now.humidity}% 风 ${now.windDir} ${now.windSpeed}`;
    $done({
      title,
      content,
      icon: ICONS[String(now.icon)] || "cloud.fill",
      backgroundColor: pickColor(now.icon),
    });
  } catch (error) {
    $done({
      title: "天气 Tile",
      content: String(error.message || error),
      icon: "wifi.exclamationmark",
      backgroundColor: "#6B2331",
    });
  }
})();
