// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: cloud.sun.rain.fill;

/*
  QWeather Weather Widget for Scriptable
  Supports: small / medium / large
*/

const CONFIG = {
  apiKey: "",
  location: "",
  lang: "zh",
  unit: "m",
  weatherName: "城市天气",
  apiHost: "https://devapi.qweather.com",
  transparentBgPath: "",
  accentColor: "#8ED8FF",
  warmColor: "#FFD27A",
  refreshMinutes: 30,
};

const WEATHER_SYMBOLS = {
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
  "410": "snowflake",
  "456": "wind.snow",
  "457": "wind.snow",
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
};

const PALETTES = [
  ["#081226", "#102B52", "#1B4F83"],
  ["#1A1234", "#203A63", "#3AA0D8"],
  ["#0D1830", "#123560", "#2C86C8"],
];

function getString(key) {
  try {
    return args.widgetParameter ? JSON.parse(args.widgetParameter)?.[key] ?? "" : "";
  } catch {
    return "";
  }
}

function resolveConfig() {
  return {
    apiKey: getString("WEATHER_API_KEY") || getString("QWEATHER_KEY") || CONFIG.apiKey,
    location: getString("WEATHER_LOCATION") || getString("QWEATHER_LOCATION") || CONFIG.location,
    lang: getString("QWEATHER_LANG") || CONFIG.lang,
    unit: getString("QWEATHER_UNIT") || CONFIG.unit,
    weatherName: getString("WEATHER_NAME") || CONFIG.weatherName,
    apiHost: getString("WEATHER_API_HOST") || getString("QWEATHER_HOST") || CONFIG.apiHost,
    transparentBgPath: getString("TRANSPARENT_BG_PATH") || CONFIG.transparentBgPath,
    accentColor: CONFIG.accentColor,
    warmColor: CONFIG.warmColor,
    refreshMinutes: CONFIG.refreshMinutes,
  };
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

async function qFetch(path, params, cfg) {
  const request = new Request(buildURL(`${cfg.apiHost}${path}`, params));
  request.headers = { Authorization: `Bearer ${cfg.apiKey}` };
  const json = await request.loadJSON();
  if (!json || json.code !== "200") {
    throw new Error(`QWeather error: ${json?.code || "unknown"}`);
  }
  return json;
}

async function loadWeather(cfg) {
  if (!cfg.apiKey || !cfg.location) {
    throw new Error("Missing WEATHER_API_KEY/QWEATHER_KEY or WEATHER_LOCATION/QWEATHER_LOCATION.");
  }
  const baseParams = {
    location: cfg.location,
    lang: cfg.lang,
    unit: cfg.unit,
  };
  const [now, daily, hourly] = await Promise.all([
    qFetch("/v7/weather/now", baseParams, cfg),
    qFetch("/v7/weather/3d", baseParams, cfg),
    qFetch("/v7/weather/24h", baseParams, cfg),
  ]);
  return { now: now.now, daily: daily.daily, hourly: hourly.hourly, updateTime: now.updateTime };
}

function symbolFor(icon) {
  return WEATHER_SYMBOLS[String(icon)] || "cloud.fill";
}

function tempUnit(unit) {
  return unit === "i" ? "°F" : "°C";
}

function speedUnit(unit) {
  return unit === "i" ? "mph" : "km/h";
}

function alpha(hex, value) {
  const v = Math.round(Math.max(0, Math.min(1, value)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${v}`.replace("##", "#");
}

function randomPalette(iconCode) {
  const index = Number(String(iconCode).slice(-1)) % PALETTES.length;
  return PALETTES[index];
}

function createGradient(palette) {
  const gradient = new LinearGradient();
  gradient.colors = palette.map((color, index) =>
    new Color(index === 2 ? alpha(color, 0.96) : alpha(color, 1), 1)
  );
  gradient.locations = [0, 0.58, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  return gradient;
}

function addText(parent, text, options = {}) {
  const node = parent.addText(String(text));
  if (options.font) node.font = options.font;
  if (options.color) node.textColor = new Color(options.color);
  if (options.opacity !== undefined) node.textOpacity = options.opacity;
  if (options.limit) node.lineLimit = options.limit;
  return node;
}

function formatHourLabel(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}h`;
}

function temperatureSeries(hourly, count = 8) {
  return hourly.slice(0, count).map((item) => Number(item.temp));
}

function drawSparkline(values, size, accentColor) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const inset = 10;
  const chartWidth = size.width - inset * 2;
  const chartHeight = size.height - inset * 2;

  const line = new Path();
  const fill = new Path();
  const points = values.map((value, index) => {
    const x = inset + (chartWidth / Math.max(1, values.length - 1)) * index;
    const y = inset + chartHeight - ((value - min) / span) * chartHeight;
    return new Point(x, y);
  });

  line.move(points[0]);
  fill.move(new Point(points[0].x, size.height - inset));
  fill.addLine(points[0]);
  for (let i = 1; i < points.length; i++) {
    line.addLine(points[i]);
    fill.addLine(points[i]);
  }
  fill.addLine(new Point(points[points.length - 1].x, size.height - inset));
  fill.closeSubpath();

  ctx.addPath(fill);
  const fillColor = new Color(accentColor, 0.16);
  ctx.setFillColor(fillColor);
  ctx.fillPath();

  ctx.addPath(line);
  ctx.setStrokeColor(new Color(accentColor, 0.95));
  ctx.setLineWidth(3);
  ctx.strokePath();

  points.forEach((point, index) => {
    ctx.setFillColor(new Color(index === values.length - 1 ? "#FFFFFF" : accentColor, 1));
    ctx.fillEllipse(new Rect(point.x - 2.5, point.y - 2.5, 5, 5));
  });

  return ctx.getImage();
}

function drawOrb(size, colorA, colorB) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const grad = new LinearGradient();
  grad.colors = [new Color(colorA, 0.8), new Color(colorB, 0.05)];
  grad.locations = [0, 1];
  grad.startPoint = new Point(0.2, 0.2);
  grad.endPoint = new Point(1, 1);
  ctx.setFillGradient(grad);
  ctx.fillEllipse(new Rect(0, 0, size.width, size.height));
  return ctx.getImage();
}

function applyBackground(widget, data, cfg) {
  if (cfg.transparentBgPath) {
    const fm = FileManager.local();
    if (fm.fileExists(cfg.transparentBgPath)) {
      widget.backgroundImage = fm.readImage(cfg.transparentBgPath);
      return;
    }
  }
  widget.backgroundGradient = createGradient(randomPalette(data.now.icon));
}

function createHeader(parent, data, cfg) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const left = row.addStack();
  left.layoutVertically();

  addText(left, cfg.weatherName, {
    font: Font.semiboldSystemFont(14),
    color: "#F5FAFF",
    opacity: 0.95,
    limit: 1,
  });
  addText(left, data.now.text, {
    font: Font.mediumSystemFont(11),
    color: "#D9EBFF",
    opacity: 0.9,
    limit: 1,
  });

  row.addSpacer();

  const icon = SFSymbol.named(symbolFor(data.now.icon));
  icon.applyFont(Font.systemFont(30));
  const image = row.addImage(icon.image);
  image.tintColor = new Color("#FFFFFF", 0.96);
  image.imageSize = new Size(28, 28);
}

function createMetricPill(parent, title, value, tone, cfg) {
  const box = parent.addStack();
  box.layoutVertically();
  box.backgroundColor = new Color("#FFFFFF", tone === "warm" ? 0.12 : 0.08);
  box.cornerRadius = 14;
  box.setPadding(8, 10, 8, 10);
  box.size = new Size(0, 0);

  addText(box, title, {
    font: Font.mediumSystemFont(9),
    color: "#D9EBFF",
    opacity: 0.88,
  });
  addText(box, value, {
    font: Font.semiboldSystemFont(12),
    color: tone === "warm" ? cfg.warmColor : "#FFFFFF",
  });
  return box;
}

function addFooter(parent, data) {
  const footer = parent.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();
  addText(footer, `观测 ${data.now.obsTime.slice(11, 16)}`, {
    font: Font.mediumSystemFont(10),
    color: "#D9EBFF",
    opacity: 0.72,
  });
  footer.addSpacer();
  addText(footer, "QWeather", {
    font: Font.mediumSystemFont(10),
    color: "#D9EBFF",
    opacity: 0.72,
  });
}

async function buildSmallWidget(data, cfg) {
  const widget = new ListWidget();
  applyBackground(widget, data, cfg);
  widget.setPadding(16, 16, 16, 16);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  const orb = drawOrb(new Size(88, 88), cfg.accentColor, "#FFFFFF");
  const top = widget.addStack();
  top.layoutHorizontally();
  top.addSpacer();
  const orbImage = top.addImage(orb);
  orbImage.imageSize = new Size(88, 88);
  orbImage.opacity = 0.18;

  widget.addSpacer(-64);
  createHeader(widget, data, cfg);
  widget.addSpacer(4);
  addText(widget, `${data.now.temp}${tempUnit(cfg.unit)}`, {
    font: Font.boldRoundedSystemFont(34),
    color: "#FFFFFF",
  });
  addText(widget, `体感 ${data.now.feelsLike}${tempUnit(cfg.unit)}`, {
    font: Font.mediumSystemFont(11),
    color: "#D9EBFF",
    opacity: 0.9,
  });
  widget.addSpacer();

  const pillRow = widget.addStack();
  pillRow.layoutHorizontally();
  createMetricPill(pillRow, "湿度", `${data.now.humidity}%`, "cool", cfg);
  pillRow.addSpacer(8);
  createMetricPill(pillRow, "风速", `${data.now.windSpeed} ${speedUnit(cfg.unit)}`, "warm", cfg);

  widget.addSpacer(8);
  addFooter(widget, data);
  return widget;
}

async function buildMediumWidget(data, cfg) {
  const widget = new ListWidget();
  applyBackground(widget, data, cfg);
  widget.setPadding(16, 16, 16, 16);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  const root = widget.addStack();
  root.layoutHorizontally();

  const left = root.addStack();
  left.layoutVertically();
  left.size = new Size(0, 0);

  createHeader(left, data, cfg);
  left.addSpacer(8);
  addText(left, `${data.now.temp}${tempUnit(cfg.unit)}`, {
    font: Font.boldRoundedSystemFont(36),
    color: "#FFFFFF",
  });
  addText(left, `${data.daily[0].tempMin} / ${data.daily[0].tempMax}${tempUnit(cfg.unit)} · ${data.now.windDir}`, {
    font: Font.mediumSystemFont(11),
    color: "#D9EBFF",
    opacity: 0.9,
    limit: 1,
  });
  left.addSpacer(10);

  const metrics = left.addStack();
  metrics.layoutHorizontally();
  createMetricPill(metrics, "降水", `${data.now.precip} mm`, "cool", cfg);
  metrics.addSpacer(8);
  createMetricPill(metrics, "气压", `${data.now.pressure} hPa`, "warm", cfg);

  left.addSpacer();
  addFooter(left, data);

  root.addSpacer(14);

  const right = root.addStack();
  right.layoutVertically();
  right.size = new Size(142, 0);

  const chart = drawSparkline(temperatureSeries(data.hourly, 8), new Size(142, 64), cfg.accentColor);
  const chartImage = right.addImage(chart);
  chartImage.imageSize = new Size(142, 64);
  chartImage.centerAlignImage();

  right.addSpacer(6);

  const timeline = right.addStack();
  timeline.layoutHorizontally();
  timeline.centerAlignContent();
  const samples = data.hourly.slice(0, 4);
  samples.forEach((item, index) => {
    const col = timeline.addStack();
    col.layoutVertically();
    col.centerAlignContent();
    addText(col, formatHourLabel(item.fxTime), {
      font: Font.mediumSystemFont(9),
      color: "#D9EBFF",
      opacity: 0.82,
    });
    const icon = SFSymbol.named(symbolFor(item.icon));
    icon.applyFont(Font.systemFont(12));
    const iv = col.addImage(icon.image);
    iv.tintColor = new Color("#FFFFFF", 0.92);
    iv.imageSize = new Size(12, 12);
    addText(col, `${item.temp}°`, {
      font: Font.semiboldSystemFont(10),
      color: "#FFFFFF",
    });
    if (index !== samples.length - 1) timeline.addSpacer();
  });

  return widget;
}

async function buildLargeWidget(data, cfg) {
  const widget = new ListWidget();
  applyBackground(widget, data, cfg);
  widget.setPadding(18, 18, 18, 18);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  createHeader(widget, data, cfg);
  widget.addSpacer(8);

  const hero = widget.addStack();
  hero.layoutHorizontally();
  hero.centerAlignContent();

  const left = hero.addStack();
  left.layoutVertically();
  addText(left, `${data.now.temp}${tempUnit(cfg.unit)}`, {
    font: Font.boldRoundedSystemFont(42),
    color: "#FFFFFF",
  });
  addText(left, `体感 ${data.now.feelsLike}${tempUnit(cfg.unit)} · ${data.now.windDir} ${data.now.windSpeed} ${speedUnit(cfg.unit)}`, {
    font: Font.mediumSystemFont(12),
    color: "#D9EBFF",
    opacity: 0.9,
    limit: 1,
  });

  hero.addSpacer();
  const orb = drawOrb(new Size(104, 104), cfg.warmColor, cfg.accentColor);
  const orbImage = hero.addImage(orb);
  orbImage.imageSize = new Size(104, 104);
  orbImage.opacity = 0.26;

  widget.addSpacer(10);
  const chart = drawSparkline(temperatureSeries(data.hourly, 10), new Size(300, 88), cfg.accentColor);
  const chartImage = widget.addImage(chart);
  chartImage.imageSize = new Size(300, 88);
  chartImage.centerAlignImage();

  widget.addSpacer(10);
  const stats = widget.addStack();
  stats.layoutHorizontally();
  createMetricPill(stats, "湿度", `${data.now.humidity}%`, "cool", cfg);
  stats.addSpacer(8);
  createMetricPill(stats, "降水", `${data.now.precip} mm`, "cool", cfg);
  stats.addSpacer(8);
  createMetricPill(stats, "气压", `${data.now.pressure} hPa`, "warm", cfg);
  stats.addSpacer(8);
  createMetricPill(stats, "能见度", `${data.now.vis} km`, "warm", cfg);

  widget.addSpacer(12);
  addText(widget, "三日趋势", {
    font: Font.semiboldSystemFont(12),
    color: "#F5FAFF",
  });
  widget.addSpacer(6);

  const dailyRow = widget.addStack();
  dailyRow.layoutHorizontally();
  data.daily.slice(0, 3).forEach((day, index) => {
    const card = dailyRow.addStack();
    card.layoutVertically();
    card.centerAlignContent();
    card.backgroundColor = new Color("#FFFFFF", 0.08);
    card.cornerRadius = 16;
    card.setPadding(10, 10, 10, 10);
    card.size = new Size(88, 0);

    const date = new Date(day.fxDate);
    addText(card, `${date.getMonth() + 1}/${date.getDate()}`, {
      font: Font.mediumSystemFont(10),
      color: "#D9EBFF",
      opacity: 0.84,
    });
    const icon = SFSymbol.named(symbolFor(day.iconDay));
    icon.applyFont(Font.systemFont(16));
    const iv = card.addImage(icon.image);
    iv.tintColor = new Color("#FFFFFF", 0.92);
    iv.imageSize = new Size(16, 16);
    addText(card, day.textDay, {
      font: Font.semiboldSystemFont(11),
      color: "#FFFFFF",
      limit: 1,
    });
    addText(card, `${day.tempMin} / ${day.tempMax}${tempUnit(cfg.unit)}`, {
      font: Font.mediumSystemFont(10),
      color: "#D9EBFF",
      opacity: 0.9,
    });
    if (index !== 2) dailyRow.addSpacer(8);
  });

  widget.addSpacer();
  addFooter(widget, data);
  return widget;
}

async function createWidget(data, cfg) {
  if (config.widgetFamily === "small") return buildSmallWidget(data, cfg);
  if (config.widgetFamily === "large") return buildLargeWidget(data, cfg);
  return buildMediumWidget(data, cfg);
}

async function createErrorWidget(message) {
  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [new Color("#1C0F1D"), new Color("#4A1F2B")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.setPadding(16, 16, 16, 16);
  addText(widget, "天气组件", {
    font: Font.boldSystemFont(16),
    color: "#FFFFFF",
  });
  widget.addSpacer(8);
  addText(widget, message, {
    font: Font.mediumSystemFont(12),
    color: "#FFDCDC",
    limit: 4,
  });
  return widget;
}

const cfg = resolveConfig();
let widget;
try {
  const data = await loadWeather(cfg);
  widget = await createWidget(data, cfg);
} catch (error) {
  widget = await createErrorWidget(String(error.message || error));
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
