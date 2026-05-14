/*
  Surge Information Panel

  Example:
  [Panel]
  Weather = title="Weather",content="Loading...",style=info,script-name=weather-panel,update-interval=30

  [Script]
  weather-panel = type=generic,script-path=qweather-weather-panel.js,timeout=20
*/

const CONFIG = {
  apiKey: "",
  location: "",
  lang: "zh",
  unit: "m",
  weatherName: "天气",
  apiHost: "https://devapi.qweather.com",
};

function readArgument(name, fallback) {
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

function trendArrow(hourly) {
  if (!hourly || hourly.length < 2) return "→";
  const start = Number(hourly[0].temp);
  const end = Number(hourly[Math.min(5, hourly.length - 1)].temp);
  if (end > start + 1) return "↗";
  if (end < start - 1) return "↘";
  return "→";
}

(async () => {
  const cfg = {
    apiKey: readArgument("WEATHER_API_KEY", readArgument("QWEATHER_KEY", CONFIG.apiKey)),
    location: readArgument("WEATHER_LOCATION", readArgument("QWEATHER_LOCATION", CONFIG.location)),
    lang: readArgument("QWEATHER_LANG", CONFIG.lang),
    unit: readArgument("QWEATHER_UNIT", CONFIG.unit),
    weatherName: readArgument("WEATHER_NAME", CONFIG.weatherName),
    apiHost: readArgument("WEATHER_API_HOST", readArgument("QWEATHER_HOST", CONFIG.apiHost)),
  };

  if (!cfg.apiKey || !cfg.location) {
    $done({
      title: "Weather Panel",
      content: "缺少 WEATHER_API_KEY/QWEATHER_KEY 或 WEATHER_LOCATION/QWEATHER_LOCATION",
      style: "error",
    });
    return;
  }

  try {
    const params = {
      location: cfg.location,
      lang: cfg.lang,
      unit: cfg.unit,
    };
    const [nowRes, dailyRes, hourlyRes] = await Promise.all([
      qFetch("/v7/weather/now", params, cfg),
      qFetch("/v7/weather/3d", params, cfg),
      qFetch("/v7/weather/24h", params, cfg),
    ]);

    const now = nowRes.now;
    const today = dailyRes.daily[0];
    const arrow = trendArrow(hourlyRes.hourly);
    const title = `${cfg.weatherName} ${now.temp}${temperatureUnit(cfg.unit)} ${arrow}`;
    const content = [
      `${now.text}  体感 ${now.feelsLike}${temperatureUnit(cfg.unit)}`,
      `高低温 ${today.tempMax}/${today.tempMin}${temperatureUnit(cfg.unit)}  湿度 ${now.humidity}%`,
      `风 ${now.windDir} ${now.windSpeed}  降水 ${now.precip}mm  气压 ${now.pressure}hPa`,
      `观测 ${now.obsTime.slice(11, 16)} · QWeather`,
    ].join("\n");

    $done({
      title,
      content,
      style: "info",
      icon: "cloud.sun.fill",
      "icon-color": "#7BC6FF",
    });
  } catch (error) {
    $done({
      title: "Weather Panel",
      content: String(error.message || error),
      style: "error",
    });
  }
})();
