export default async function(ctx) {
  const env = ctx.env || {};
  const settings = {
    apiKey: env.WEATHER_API_KEY || env.QWEATHER_KEY || "",
    location: env.WEATHER_LOCATION || env.QWEATHER_LOCATION || "",
    lang: env.QWEATHER_LANG || "zh",
    unit: env.QWEATHER_UNIT || "m",
    weatherName: env.WEATHER_NAME || "城市天气",
    apiHost: env.WEATHER_API_HOST || env.QWEATHER_HOST || "https://devapi.qweather.com",
  };

  const symbols = {
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
    "399": "cloud.rain.fill",
    "400": "snowflake",
    "401": "cloud.snow.fill",
    "402": "cloud.snow.fill",
    "403": "snowflake",
    "404": "snowflake",
    "500": "cloud.fog.fill",
    "501": "cloud.fog.fill",
    "502": "cloud.fog.fill",
    "503": "sun.haze.fill",
    "507": "wind",
    "508": "wind",
    "509": "wind",
    "510": "wind",
    "800": "tornado",
    "801": "tornado",
    "802": "tornado",
    "900": "thermometer.medium",
    "901": "thermometer.low",
    "999": "cloud.fill",
  };

  function buildURL(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  }

  async function qFetch(path, params) {
    const response = await fetch(buildURL(`${settings.apiHost}${path}`, params), {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
      },
    });
    const json = await response.json();
    if (!json || json.code !== "200") {
      throw new Error(`QWeather error: ${json?.code || response.status}`);
    }
    return json;
  }

  function alpha(hex, opacity) {
    const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex}${value}`.replace("##", "#");
  }

  function sf(icon) {
    return `sf-symbol:${symbols[String(icon)] || "cloud.fill"}`;
  }

  function unitText(unit) {
    return unit === "i" ? "°F" : "°C";
  }

  function speedUnit(unit) {
    return unit === "i" ? "mph" : "km/h";
  }

  function bar(value, max) {
    const ratio = max ? Math.max(0.2, value / max) : 0.5;
    return {
      type: "stack",
      direction: "column",
      alignItems: "center",
      width: 16,
      flex: 1,
      children: [
        {
          type: "text",
          text: String(Math.round(value)),
          font: { size: 9, weight: "semibold" },
          textColor: "#F6FBFF",
        },
        { type: "spacer", length: 4 },
        {
          type: "stack",
          width: 10,
          height: 28 + Math.round(28 * ratio),
          backgroundGradient: {
            colors: [alpha("#8ED8FF", 0.95), alpha("#8ED8FF", 0.24)],
            startPoint: { x: 0.5, y: 0 },
            endPoint: { x: 0.5, y: 1 },
          },
          borderRadius: 999,
        },
      ],
    };
  }

  if (!settings.apiKey || !settings.location) {
    return {
      type: "widget",
      padding: 16,
      backgroundGradient: {
        colors: ["#1C0F1D", "#4A1F2B"],
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 1, y: 1 },
      },
      children: [
        {
          type: "text",
          text: "缺少 WEATHER_API_KEY/QWEATHER_KEY 或 WEATHER_LOCATION/QWEATHER_LOCATION",
          font: { size: "headline", weight: "bold" },
          textColor: "#FFFFFF",
          maxLines: 3,
        },
      ],
    };
  }

  const params = {
    location: settings.location,
    lang: settings.lang,
    unit: settings.unit,
  };

  const [nowRes, dailyRes, hourlyRes] = await Promise.all([
    qFetch("/v7/weather/now", params),
    qFetch("/v7/weather/3d", params),
    qFetch("/v7/weather/24h", params),
  ]);

  const now = nowRes.now;
  const daily = dailyRes.daily;
  const hourly = hourlyRes.hourly.slice(0, ctx.widgetFamily === "systemLarge" ? 8 : 6);
  const temps = hourly.map((item) => Number(item.temp));
  const maxTemp = Math.max(...temps, 1);
  const isLarge = ctx.widgetFamily === "systemLarge";
  const isSmall = ctx.widgetFamily === "systemSmall";

  const baseChildren = [
    {
      type: "stack",
      direction: "row",
      alignItems: "center",
      children: [
        {
          type: "stack",
          direction: "column",
          gap: 2,
          flex: 1,
          children: [
            {
              type: "text",
              text: settings.weatherName,
              font: { size: 14, weight: "bold" },
              textColor: "#F8FBFF",
              maxLines: 1,
            },
            {
              type: "text",
              text: now.text,
              font: { size: 11, weight: "medium" },
              textColor: alpha("#D9EBFF", 0.92),
              maxLines: 1,
            },
          ],
        },
        {
          type: "image",
          src: sf(now.icon),
          width: isSmall ? 24 : 26,
          height: isSmall ? 24 : 26,
          color: "#FFFFFF",
        },
      ],
    },
    { type: "spacer", length: isSmall ? 8 : 10 },
    {
      type: "text",
      text: `${now.temp}${unitText(settings.unit)}`,
      font: { size: isLarge ? 40 : isSmall ? 34 : 36, weight: "bold", family: "SF Pro Rounded" },
      textColor: "#FFFFFF",
      maxLines: 1,
      minScale: 0.6,
    },
    {
      type: "text",
      text: isSmall
        ? `体感 ${now.feelsLike}${unitText(settings.unit)}`
        : `${daily[0].tempMin} / ${daily[0].tempMax}${unitText(settings.unit)} · ${now.windDir}`,
      font: { size: 11, weight: "medium" },
      textColor: alpha("#D9EBFF", 0.92),
      maxLines: 1,
      minScale: 0.7,
    },
  ];

  if (isSmall) {
    baseChildren.push(
      { type: "spacer" },
      {
        type: "stack",
        direction: "row",
        gap: 8,
        children: [
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            gap: 2,
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 14,
            children: [
              { type: "text", text: "湿度", font: { size: 9, weight: "medium" }, textColor: alpha("#D9EBFF", 0.84) },
              { type: "text", text: `${now.humidity}%`, font: { size: 12, weight: "semibold" }, textColor: "#FFFFFF" },
            ],
          },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            gap: 2,
            backgroundColor: alpha("#FFD27A", 0.12),
            borderRadius: 14,
            children: [
              { type: "text", text: "风速", font: { size: 9, weight: "medium" }, textColor: alpha("#FFE3B0", 0.92) },
              { type: "text", text: `${now.windSpeed} ${speedUnit(settings.unit)}`, font: { size: 12, weight: "semibold" }, textColor: "#FFD27A" },
            ],
          },
        ],
      }
    );
  } else {
    baseChildren.push(
      { type: "spacer", length: 10 },
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        gap: 8,
        children: hourly.map((item) => bar(Number(item.temp), maxTemp)),
      }
    );
  }

  if (isLarge) {
    baseChildren.push(
      { type: "spacer", length: 12 },
      {
        type: "text",
        text: "三日趋势",
        font: { size: 12, weight: "bold" },
        textColor: "#F8FBFF",
      },
      { type: "spacer", length: 6 },
      {
        type: "stack",
        direction: "row",
        gap: 8,
        children: daily.slice(0, 3).map((day) => ({
          type: "stack",
          direction: "column",
          alignItems: "center",
          flex: 1,
          padding: 10,
          gap: 4,
          backgroundColor: alpha("#FFFFFF", 0.08),
          borderRadius: 16,
          children: [
            {
              type: "text",
              text: day.fxDate.slice(5).replace("-", "/"),
              font: { size: 10, weight: "medium" },
              textColor: alpha("#D9EBFF", 0.84),
            },
            {
              type: "image",
              src: sf(day.iconDay),
              width: 16,
              height: 16,
              color: "#FFFFFF",
            },
            {
              type: "text",
              text: day.textDay,
              font: { size: 11, weight: "semibold" },
              textColor: "#FFFFFF",
              maxLines: 1,
            },
            {
              type: "text",
              text: `${day.tempMin} / ${day.tempMax}${unitText(settings.unit)}`,
              font: { size: 10, weight: "medium" },
              textColor: alpha("#D9EBFF", 0.88),
            },
          ],
        })),
      }
    );
  }

  baseChildren.push(
    { type: "spacer" },
    {
      type: "text",
      text: `观测 ${now.obsTime.slice(11, 16)} · QWeather`,
      font: { size: 10, weight: "medium" },
      textColor: alpha("#D9EBFF", 0.72),
      maxLines: 1,
    }
  );

  return {
    type: "widget",
    padding: isSmall ? 16 : 18,
    gap: 0,
    backgroundGradient: {
      colors: ["#081226", "#102B52", "#1B4F83"],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    refreshAfter: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    children: baseChildren,
  };
}
