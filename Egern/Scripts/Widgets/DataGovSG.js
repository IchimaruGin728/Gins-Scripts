export default async function(ctx) {
  const env = ctx.env || {};
  const settings = {
    apiKey: env.DATAGOVSG_API_KEY || "",
    area: env.AREA || "City",
  };

  const PALETTE = {
    purple: "#4D3DD8",
    purpleBright: "#7C71FF",
    purpleSoft: "#C4BEFF",
    violet: "#2B1B73",
    deep: "#120B33",
    white: "#F8F7FF",
    whiteSoft: "#D9D6F8",
    success: "#69E3B1",
    warning: "#FFD166",
    danger: "#FF7B8A",
  };

  function alpha(hex, value) {
    const v = Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0");
    return `${hex}${v}`.replace("##", "#");
  }

  async function fetchJson(path) {
    const headers = { Accept: "application/json" };
    if (settings.apiKey) headers["x-api-key"] = settings.apiKey;
    const response = await fetch(`https://api-open.data.gov.sg/v2/real-time/api/${path}`, { headers });
    const json = await response.json();
    if (!json || json.code !== 0) throw new Error(json?.errorMsg || response.status);
    return json.data;
  }

  function forecastSymbol(text) {
    const lower = String(text).toLowerCase();
    if (lower.includes("thunder")) return "sf-symbol:cloud.bolt.rain.fill";
    if (lower.includes("shower")) return "sf-symbol:cloud.rain.fill";
    if (lower.includes("rain")) return "sf-symbol:cloud.heavyrain.fill";
    if (lower.includes("cloud")) return "sf-symbol:cloud.fill";
    if (lower.includes("fair")) return "sf-symbol:sun.max.fill";
    if (lower.includes("wind")) return "sf-symbol:wind";
    return "sf-symbol:cloud.sun.fill";
  }

  function pm25Tone(value) {
    if (value <= 12) return PALETTE.success;
    if (value <= 35) return PALETTE.warning;
    return PALETTE.danger;
  }

  const [air, rainfall, uv, pm25, twoHour, twentyFour, fourDay] = await Promise.all([
    fetchJson("air-temperature"),
    fetchJson("rainfall"),
    fetchJson("uv"),
    fetchJson("pm25"),
    fetchJson("two-hr-forecast"),
    fetchJson("twenty-four-hr-forecast"),
    fetchJson("four-day-outlook"),
  ]);

  const airData = air.readings[0].data;
  const temps = airData.map((item) => item.value);
  const currentTemp = Number((temps.reduce((sum, value) => sum + value, 0) / Math.max(temps.length, 1)).toFixed(1));
  const uvSeries = uv.records[0].index.slice().reverse().slice(-8).map((item) => ({
    hour: item.hour.slice(11, 13),
    value: item.value,
  }));
  const uvNow = uvSeries[uvSeries.length - 1]?.value || 0;
  const pm25Values = pm25.items[0].readings.pm25_one_hourly;
  const pm25Entries = Object.entries(pm25Values);
  const pm25Max = Math.max(...pm25Entries.map(([, value]) => value), 0);
  const area = twoHour.items[0].forecasts.find((item) => item.area.toLowerCase() === settings.area.toLowerCase())
    || twoHour.items[0].forecasts.find((item) => item.area === "City")
    || twoHour.items[0].forecasts[0];
  const twentyFourRecord = twentyFour.records?.[0] || {
    updatedTimestamp: "",
    general: { forecast: { text: "" }, temperature: { low: 0, high: 0 }, relativeHumidity: { low: 0, high: 0 } },
  };
  const humidityLow = twentyFourRecord.general.relativeHumidity.low || 0;
  const humidityHigh = twentyFourRecord.general.relativeHumidity.high || 0;
  const fourDayForecasts = fourDay.records?.[0]?.forecasts || [];
  const stationNames = Object.fromEntries(rainfall.stations.map((station) => [station.id, station.name]));
  const rainfallTop = rainfall.readings[0].data
    .map((entry) => ({ name: stationNames[entry.stationId] || entry.stationId, value: entry.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const rainfallMax = rainfallTop[0]?.value || 0;
  const outdoorScore = Math.max(
    8,
    Math.round(
      100
        - Math.min(uvNow * 7, 35)
        - Math.min(Math.max(...pm25Entries.map(([, value]) => value)) * 1.2, 30)
        - Math.min(rainfallMax * 5, 20)
        - (/thunder/i.test(area.forecast) ? 15 : /showers?/i.test(area.forecast) ? 10 : 0)
    )
  );
  const isSmall = ctx.widgetFamily === "systemSmall";
  const isLarge = ctx.widgetFamily === "systemLarge";

  function bar(value, max, color, label) {
    const ratio = max ? Math.max(0.25, value / max) : 0.25;
    return {
      type: "stack",
      direction: "column",
      alignItems: "center",
      gap: 4,
      flex: 1,
      children: [
        {
          type: "text",
          text: String(value),
          font: { size: 9, weight: "semibold" },
          textColor: PALETTE.white,
        },
        {
          type: "stack",
          width: 10,
          height: 18 + Math.round(30 * ratio),
          backgroundGradient: {
            colors: [color, alpha(color, 0.28)],
            startPoint: { x: 0.5, y: 0 },
            endPoint: { x: 0.5, y: 1 },
          },
          borderRadius: 999,
        },
        {
          type: "text",
          text: label,
          font: { size: 9, weight: "medium" },
          textColor: alpha(PALETTE.white, 0.7),
        },
      ],
    };
  }

  const children = [
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
              text: "data.gov.sg",
              font: { size: 14, weight: "bold", family: "SF Pro Rounded" },
              textColor: PALETTE.white,
            },
            {
              type: "text",
              text: `${area.area} · ${twoHour.items[0].valid_period.text}`,
              font: { size: 10, weight: "medium" },
              textColor: alpha(PALETTE.whiteSoft, 0.88),
              maxLines: 1,
            },
          ],
        },
        {
          type: "image",
          src: "sf-symbol:circle.hexagongrid.fill",
          width: 18,
          height: 18,
          color: PALETTE.purpleSoft,
        },
      ],
    },
    { type: "spacer", length: 10 },
    {
      type: "stack",
      direction: "row",
      alignItems: "start",
      children: [
        {
          type: "stack",
          direction: "column",
          gap: 2,
          flex: 1,
          children: [
            {
              type: "text",
              text: `${currentTemp.toFixed(1)}°`,
              font: { size: isLarge ? 40 : isSmall ? 32 : 36, weight: "bold", family: "SF Pro Rounded" },
              textColor: PALETTE.white,
            },
            {
              type: "text",
              text: twentyFourRecord.general.forecast.text,
              font: { size: 11, weight: "medium" },
              textColor: alpha(PALETTE.whiteSoft, 0.9),
            },
            {
              type: "text",
              text: area.forecast,
              font: { size: 11, weight: "semibold" },
              textColor: PALETTE.white,
              maxLines: 1,
            },
            {
              type: "text",
              text: `RH ${humidityLow}-${humidityHigh}% · PM2.5 ${pm25Max}`,
              font: { size: 10, weight: "medium" },
              textColor: alpha(PALETTE.whiteSoft, 0.82),
              maxLines: 1,
            },
          ],
        },
        {
          type: "stack",
          direction: "column",
          alignItems: "center",
          padding: 10,
          backgroundColor: alpha("#FFFFFF", 0.1),
          borderRadius: 16,
          children: [
            { type: "text", text: "Score", font: { size: 9, weight: "medium" }, textColor: alpha(PALETTE.white, 0.76) },
            { type: "text", text: String(outdoorScore), font: { size: 22, weight: "bold", family: "SF Pro Rounded" }, textColor: PALETTE.success },
          ],
        },
      ],
    },
  ];

  if (isSmall) {
    children.push(
      { type: "spacer", length: 10 },
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
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 14,
            children: [
              { type: "text", text: "UV", font: { size: 9, weight: "medium" }, textColor: alpha(PALETTE.white, 0.76) },
              { type: "text", text: String(uvNow), font: { size: 13, weight: "semibold" }, textColor: PALETTE.warning },
            ],
          },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 14,
            children: [
              { type: "text", text: "PM2.5", font: { size: 9, weight: "medium" }, textColor: alpha(PALETTE.white, 0.76) },
              { type: "text", text: String(pm25Max), font: { size: 13, weight: "semibold" }, textColor: pm25Tone(pm25Max) },
            ],
          },
        ],
      }
    );
  } else {
    children.push(
      { type: "spacer", length: 10 },
      {
        type: "stack",
        direction: "row",
        gap: 10,
        children: [
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            gap: 6,
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 18,
            children: [
              { type: "text", text: "UV Trend", font: { size: 10, weight: "bold" }, textColor: alpha(PALETTE.white, 0.78) },
              {
                type: "stack",
                direction: "row",
                alignItems: "end",
                gap: 5,
                children: uvSeries.map((item) => bar(item.value, Math.max(...uvSeries.map((x) => x.value), 1), PALETTE.purpleBright, item.hour)),
              },
            ],
          },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            gap: 6,
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 18,
            children: [
              { type: "text", text: "PM2.5", font: { size: 10, weight: "bold" }, textColor: alpha(PALETTE.white, 0.78) },
              {
                type: "stack",
                direction: "row",
                alignItems: "end",
                gap: 8,
                children: pm25Entries.map(([region, value]) => bar(value, Math.max(...pm25Entries.map(([, v]) => v), 1), pm25Tone(value), region.slice(0, 1).toUpperCase())),
              },
            ],
          },
        ],
      }
    );
  }

  if (!isLarge) {
    children.push(
      { type: "spacer", length: 10 },
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
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 14,
            children: [
              { type: "text", text: "Humidity", font: { size: 9, weight: "medium" }, textColor: alpha(PALETTE.white, 0.76) },
              { type: "text", text: `${humidityLow}-${humidityHigh}%`, font: { size: 13, weight: "semibold" }, textColor: PALETTE.white },
            ],
          },
          {
            type: "stack",
            direction: "column",
            flex: 1,
            padding: 10,
            backgroundColor: alpha("#FFFFFF", 0.08),
            borderRadius: 14,
            children: [
              { type: "text", text: "Rain Max", font: { size: 9, weight: "medium" }, textColor: alpha(PALETTE.white, 0.76) },
              { type: "text", text: `${rainfallMax.toFixed(1)} mm`, font: { size: 13, weight: "semibold" }, textColor: PALETTE.purpleSoft },
            ],
          },
        ],
      }
    );
  }

  if (isLarge) {
    children.push(
      { type: "spacer", length: 10 },
      {
        type: "stack",
        direction: "column",
        gap: 6,
        padding: 10,
        backgroundColor: alpha("#FFFFFF", 0.08),
        borderRadius: 18,
        children: [
          { type: "text", text: "Rain Hotspots", font: { size: 10, weight: "bold" }, textColor: alpha(PALETTE.white, 0.78) },
          ...rainfallTop.map((item) => ({
            type: "stack",
            direction: "row",
            alignItems: "center",
            children: [
              { type: "text", text: item.name, font: { size: 10, weight: "medium" }, textColor: alpha(PALETTE.whiteSoft, 0.88), flex: 1, maxLines: 1 },
              { type: "text", text: `${item.value.toFixed(1)} mm`, font: { size: 10, weight: "semibold" }, textColor: PALETTE.white },
            ],
          })),
        ],
      },
      { type: "spacer", length: 10 },
      {
        type: "stack",
        direction: "row",
        gap: 8,
        children: fourDayForecasts.map((day) => ({
          type: "stack",
          direction: "column",
          alignItems: "center",
          flex: 1,
          padding: 8,
          backgroundColor: alpha("#FFFFFF", 0.08),
          borderRadius: 16,
          children: [
            { type: "text", text: day.day.slice(0, 3), font: { size: 10, weight: "semibold" }, textColor: alpha(PALETTE.whiteSoft, 0.84) },
            { type: "image", src: forecastSymbol(day.forecast.text), width: 14, height: 14, color: PALETTE.white },
            { type: "text", text: `${day.temperature.high}°`, font: { size: 11, weight: "semibold" }, textColor: PALETTE.white },
            { type: "text", text: `${day.temperature.low}°`, font: { size: 10, weight: "medium" }, textColor: alpha(PALETTE.whiteSoft, 0.84) },
          ],
        })),
      }
    );
  }

  children.push(
    { type: "spacer" },
    {
      type: "text",
      text: `Updated ${twentyFourRecord.updatedTimestamp.slice(11, 16)}`,
      font: { size: 10, weight: "medium" },
      textColor: alpha(PALETTE.white, 0.66),
    }
  );

  return {
    type: "widget",
    padding: isSmall ? 16 : 18,
    backgroundGradient: {
      colors: [PALETTE.deep, PALETTE.violet, PALETTE.purple],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    },
    refreshAfter: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    children,
  };
}
