// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: chart.xyaxis.line;

const CONFIG = {
  apiKey: "",
  area: "City",
  trafficCameraId: "1704",
  showTraffic: true,
  transparentBgPath: "",
  refreshMinutes: 15,
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

function readParameter() {
  if (!args.widgetParameter) return {};
  try {
    return JSON.parse(args.widgetParameter);
  } catch {
    return {};
  }
}

function settings() {
  const p = readParameter();
  const showTraffic = p.SHOW_TRAFFIC === undefined
    ? CONFIG.showTraffic
    : p.SHOW_TRAFFIC === true || p.SHOW_TRAFFIC === "true";
  return {
    apiKey: p.DATAGOVSG_API_KEY || CONFIG.apiKey,
    area: p.AREA || CONFIG.area,
    trafficCameraId: p.TRAFFIC_CAMERA_ID || CONFIG.trafficCameraId,
    showTraffic,
    transparentBgPath: p.TRANSPARENT_BG_PATH || CONFIG.transparentBgPath,
    refreshMinutes: CONFIG.refreshMinutes,
  };
}

async function jsonRequest(url, apiKey) {
  const req = new Request(url);
  req.headers = { Accept: "application/json" };
  if (apiKey) req.headers["x-api-key"] = apiKey;
  const json = await req.loadJSON();
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(json.errorMsg || "DataGovSG request failed");
  }
  return json.data || json;
}

function forecastSymbol(text) {
  const lower = String(text).toLowerCase();
  if (lower.includes("thunder")) return "cloud.bolt.rain.fill";
  if (lower.includes("shower")) return "cloud.rain.fill";
  if (lower.includes("rain")) return "cloud.heavyrain.fill";
  if (lower.includes("cloud")) return "cloud.fill";
  if (lower.includes("fair")) return "sun.max.fill";
  if (lower.includes("wind")) return "wind";
  return "cloud.sun.fill";
}

function pm25Tone(value) {
  if (value <= 12) return PALETTE.success;
  if (value <= 35) return PALETTE.warning;
  return PALETTE.danger;
}

function normalizeArea(area) {
  return String(area || "").trim().toLowerCase();
}

async function loadBundle(cfg) {
  const base = "https://api-open.data.gov.sg/v2/real-time/api";
  const [air, rainfall, uv, pm25, twoHour, twentyFour, fourDay] = await Promise.all([
    jsonRequest(`${base}/air-temperature`, cfg.apiKey),
    jsonRequest(`${base}/rainfall`, cfg.apiKey),
    jsonRequest(`${base}/uv`, cfg.apiKey),
    jsonRequest(`${base}/pm25`, cfg.apiKey),
    jsonRequest(`${base}/two-hr-forecast`, cfg.apiKey),
    jsonRequest(`${base}/twenty-four-hr-forecast`, cfg.apiKey),
    jsonRequest(`${base}/four-day-outlook`, cfg.apiKey),
  ]);

  const airData = air.readings[0].data;
  const temps = airData.map((item) => item.value);
  const currentTemp = Number((temps.reduce((sum, value) => sum + value, 0) / Math.max(temps.length, 1)).toFixed(1));
  const tempLow = Math.min(...temps);
  const tempHigh = Math.max(...temps);

  const uvSeries = uv.records[0].index.slice().reverse().map((item) => ({
    hour: item.hour.slice(11, 13),
    value: item.value,
  }));
  const uvNow = uvSeries[uvSeries.length - 1]?.value || 0;

  const pm25Values = pm25.items[0].readings.pm25_one_hourly;
  const pm25Entries = Object.entries(pm25Values);
  const pm25Max = Math.max(...pm25Entries.map(([, value]) => value), 0);

  const stationNames = Object.fromEntries(rainfall.stations.map((station) => [station.id, station.name]));
  const rainfallTop = rainfall.readings[0].data
    .map((entry) => ({ name: stationNames[entry.stationId] || entry.stationId, value: entry.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const areaForecasts = twoHour.items[0].forecasts;
  const selectedArea = areaForecasts.find((item) => normalizeArea(item.area) === normalizeArea(cfg.area))
    || areaForecasts.find((item) => normalizeArea(item.area) === "city")
    || areaForecasts[0];

  const rainfallMax = rainfallTop[0]?.value || 0;
  const outdoorScore = Math.max(
    8,
    Math.round(
      100
        - Math.min(uvNow * 7, 35)
        - Math.min(Math.max(...pm25Entries.map(([, value]) => value)) * 1.2, 30)
        - Math.min(rainfallMax * 5, 20)
        - (/thunder/i.test(selectedArea.forecast) ? 15 : /showers?/i.test(selectedArea.forecast) ? 10 : 0)
    )
  );

  return {
    currentTemp,
    tempLow,
    tempHigh,
    humidityLow: twentyFour.records[0].general.relativeHumidity.low,
    humidityHigh: twentyFour.records[0].general.relativeHumidity.high,
    uvSeries,
    uvNow,
    pm25Entries,
    pm25Max,
    rainfallTop,
    rainfallMax,
    selectedArea,
    twoHourPeriod: twoHour.items[0].valid_period.text,
    twentyFour: twentyFour.records[0],
    fourDay: fourDay.records[0].forecasts,
    updatedAt: twentyFour.records[0].updatedTimestamp,
  outdoorScore,
  };
}

async function loadTrafficImage(cameraId) {
  const data = await jsonRequest("https://api.data.gov.sg/v1/transport/traffic-images");
  const cameras = data.items?.[0]?.cameras || [];
  const camera = cameras.find((item) => String(item.camera_id) === String(cameraId)) || cameras[0];
  if (!camera) return null;
  return {
    image: await new Request(camera.image).loadImage(),
    cameraId: camera.camera_id,
  };
}

function createBackground(widget, cfg) {
  if (cfg.transparentBgPath) {
    const fm = FileManager.local();
    if (fm.fileExists(cfg.transparentBgPath)) {
      widget.backgroundImage = fm.readImage(cfg.transparentBgPath);
      return;
    }
  }
  const gradient = new LinearGradient();
  gradient.colors = [
    new Color(PALETTE.deep),
    new Color(PALETTE.violet),
    new Color(PALETTE.purple),
  ];
  gradient.locations = [0, 0.55, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  widget.backgroundGradient = gradient;
}

function addText(parent, text, options = {}) {
  const node = parent.addText(String(text));
  if (options.font) node.font = options.font;
  if (options.color) node.textColor = new Color(options.color);
  if (options.opacity !== undefined) node.textOpacity = options.opacity;
  if (options.limit) node.lineLimit = options.limit;
  return node;
}

function makePill(parent, title, value, color) {
  const card = parent.addStack();
  card.layoutVertically();
  card.backgroundColor = new Color("#FFFFFF", 0.1);
  card.cornerRadius = 14;
  card.setPadding(8, 10, 8, 10);
  addText(card, title, {
    font: Font.mediumSystemFont(9),
    color: PALETTE.whiteSoft,
    opacity: 0.88,
  });
  addText(card, value, {
    font: Font.semiboldSystemFont(13),
    color: color || PALETTE.white,
  });
  return card;
}

function lineChart(series, size) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const values = series.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const inset = 10;
  const width = size.width - inset * 2;
  const height = size.height - inset * 2;

  const line = new Path();
  const fill = new Path();
  const points = values.map((value, index) => {
    const x = inset + (width / Math.max(values.length - 1, 1)) * index;
    const y = inset + height - ((value - min) / span) * height;
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
  ctx.setFillColor(new Color(PALETTE.purpleBright, 0.18));
  ctx.fillPath();

  ctx.addPath(line);
  ctx.setStrokeColor(new Color(PALETTE.purpleSoft, 1));
  ctx.setLineWidth(3);
  ctx.strokePath();

  points.forEach((point, index) => {
    ctx.setFillColor(new Color(index === points.length - 1 ? "#FFFFFF" : PALETTE.purpleSoft, 1));
    ctx.fillEllipse(new Rect(point.x - 2.5, point.y - 2.5, 5, 5));
  });
  return ctx.getImage();
}

function barChart(entries, size, paletteFn) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const values = entries.map((entry) => entry.value);
  const max = Math.max(...values, 1);
  const gap = 12;
  const barWidth = (size.width - gap * (entries.length - 1)) / entries.length;
  entries.forEach((entry, index) => {
    const ratio = entry.value / max;
    const barHeight = Math.max(12, (size.height - 16) * ratio);
    const x = index * (barWidth + gap);
    const y = size.height - barHeight;
    ctx.setFillColor(new Color(paletteFn(entry.value), 1));
    ctx.fillRoundedRect(new Rect(x, y, barWidth, barHeight), 7, 7);
  });
  return ctx.getImage();
}

function scoreRing(score, size) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const radius = Math.min(size.width, size.height) / 2 - 8;
  const center = new Point(size.width / 2, size.height / 2);
  const bg = new Path();
  bg.addEllipse(new Rect(center.x - radius, center.y - radius, radius * 2, radius * 2));
  ctx.addPath(bg);
  ctx.setStrokeColor(new Color("#FFFFFF", 0.12));
  ctx.setLineWidth(10);
  ctx.strokePath();

  const start = -Math.PI / 2;
  const end = start + (Math.PI * 2 * score) / 100;
  const path = new Path();
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const angle = start + ((end - start) * i) / steps;
    const point = new Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
    if (i === 0) path.move(point);
    else path.addLine(point);
  }
  ctx.addPath(path);
  ctx.setStrokeColor(new Color(score >= 70 ? PALETTE.success : score >= 40 ? PALETTE.warning : PALETTE.danger, 1));
  ctx.setLineWidth(10);
  ctx.strokePath();
  return ctx.getImage();
}

function buildHeader(parent, bundle) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const left = row.addStack();
  left.layoutVertically();
  addText(left, "data.gov.sg", {
    font: Font.boldRoundedSystemFont(15),
    color: PALETTE.white,
  });
  addText(left, `${bundle.selectedArea.area} · ${bundle.twoHourPeriod}`, {
    font: Font.mediumSystemFont(10),
    color: PALETTE.whiteSoft,
    opacity: 0.86,
    limit: 1,
  });
  row.addSpacer();
  const symbol = SFSymbol.named("circle.hexagongrid.fill");
  symbol.applyFont(Font.systemFont(20));
  const image = row.addImage(symbol.image);
  image.tintColor = new Color(PALETTE.purpleSoft, 1);
  image.imageSize = new Size(20, 20);
}

async function smallWidget(bundle, cfg) {
  const widget = new ListWidget();
  createBackground(widget, cfg);
  widget.setPadding(16, 16, 16, 16);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  buildHeader(widget, bundle);
  widget.addSpacer(8);

  const top = widget.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();
  const left = top.addStack();
  left.layoutVertically();
  addText(left, `${bundle.currentTemp.toFixed(1)}°`, {
    font: Font.boldRoundedSystemFont(34),
    color: PALETTE.white,
  });
  addText(left, bundle.twentyFour.general.forecast.text, {
    font: Font.mediumSystemFont(11),
    color: PALETTE.whiteSoft,
    opacity: 0.88,
    limit: 1,
  });
  top.addSpacer();
  const ring = top.addImage(scoreRing(bundle.outdoorScore, new Size(64, 64)));
  ring.imageSize = new Size(64, 64);

  widget.addSpacer(8);
  const bottom = widget.addStack();
  bottom.layoutHorizontally();
  makePill(bottom, "UV", String(bundle.uvNow), PALETTE.warning);
  bottom.addSpacer(8);
  makePill(bottom, "Score", String(bundle.outdoorScore), PALETTE.success);
  bottom.addSpacer(8);
  makePill(bottom, "PM2.5", String(bundle.pm25Max), pm25Tone(bundle.pm25Max));

  widget.addSpacer(8);
  addText(widget, `${bundle.selectedArea.area}: ${bundle.selectedArea.forecast}`, {
    font: Font.semiboldSystemFont(12),
    color: PALETTE.white,
    limit: 2,
  });
  return widget;
}

async function mediumWidget(bundle, cfg) {
  const widget = new ListWidget();
  createBackground(widget, cfg);
  widget.setPadding(16, 16, 16, 16);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  buildHeader(widget, bundle);
  widget.addSpacer(10);
  const top = widget.addStack();
  top.layoutHorizontally();
  const left = top.addStack();
  left.layoutVertically();
  addText(left, `${bundle.currentTemp.toFixed(1)}°`, {
    font: Font.boldRoundedSystemFont(38),
    color: PALETTE.white,
  });
  addText(left, `${bundle.tempLow.toFixed(1)} / ${bundle.tempHigh.toFixed(1)}° across stations`, {
    font: Font.mediumSystemFont(11),
    color: PALETTE.whiteSoft,
    opacity: 0.88,
  });
  addText(left, `Humidity ${bundle.humidityLow}-${bundle.humidityHigh}% · PM2.5 max ${bundle.pm25Max}`, {
    font: Font.mediumSystemFont(11),
    color: PALETTE.whiteSoft,
    opacity: 0.88,
  });
  addText(left, `${bundle.selectedArea.area}: ${bundle.selectedArea.forecast}`, {
    font: Font.semiboldSystemFont(11),
    color: PALETTE.white,
    limit: 1,
  });
  top.addSpacer();
  const scoreCard = top.addStack();
  scoreCard.layoutVertically();
  scoreCard.backgroundColor = new Color("#FFFFFF", 0.1);
  scoreCard.cornerRadius = 16;
  scoreCard.setPadding(10, 12, 10, 12);
  addText(scoreCard, "Outdoor", {
    font: Font.mediumSystemFont(9),
    color: PALETTE.whiteSoft,
  });
  addText(scoreCard, String(bundle.outdoorScore), {
    font: Font.boldRoundedSystemFont(24),
    color: PALETTE.success,
  });

  widget.addSpacer(10);
  const charts = widget.addStack();
  charts.layoutHorizontally();
  const uvCard = charts.addStack();
  uvCard.layoutVertically();
  uvCard.backgroundColor = new Color("#FFFFFF", 0.08);
  uvCard.cornerRadius = 18;
  uvCard.setPadding(10, 10, 10, 10);
  addText(uvCard, "UV Line", {
    font: Font.semiboldSystemFont(10),
    color: PALETTE.whiteSoft,
  });
  const uvChart = uvCard.addImage(lineChart(bundle.uvSeries.slice(-8), new Size(120, 56)));
  uvChart.imageSize = new Size(120, 56);

  charts.addSpacer(10);
  const pmCard = charts.addStack();
  pmCard.layoutVertically();
  pmCard.backgroundColor = new Color("#FFFFFF", 0.08);
  pmCard.cornerRadius = 18;
  pmCard.setPadding(10, 10, 10, 10);
  addText(pmCard, "PM2.5 Bars", {
    font: Font.semiboldSystemFont(10),
    color: PALETTE.whiteSoft,
  });
  const pmChart = pmCard.addImage(
    barChart(bundle.pm25Entries.map(([key, value]) => ({ key, value })), new Size(120, 56), pm25Tone)
  );
  pmChart.imageSize = new Size(120, 56);
  return widget;
}

async function largeWidget(bundle, cfg) {
  const widget = new ListWidget();
  createBackground(widget, cfg);
  widget.setPadding(18, 18, 18, 18);
  widget.refreshAfterDate = new Date(Date.now() + cfg.refreshMinutes * 60 * 1000);

  buildHeader(widget, bundle);
  widget.addSpacer(10);

  const hero = widget.addStack();
  hero.layoutHorizontally();
  const left = hero.addStack();
  left.layoutVertically();
  addText(left, `${bundle.currentTemp.toFixed(1)}°`, {
    font: Font.boldRoundedSystemFont(42),
    color: PALETTE.white,
  });
  addText(left, `${bundle.twentyFour.general.forecast.text} · ${bundle.twentyFour.general.validPeriod.text}`, {
    font: Font.mediumSystemFont(12),
    color: PALETTE.whiteSoft,
    opacity: 0.9,
    limit: 2,
  });
  addText(left, `UV ${bundle.uvNow} · Score ${bundle.outdoorScore} · Rain ${bundle.rainfallMax.toFixed(1)} mm · RH ${bundle.humidityLow}-${bundle.humidityHigh}%`, {
    font: Font.mediumSystemFont(11),
    color: PALETTE.whiteSoft,
    opacity: 0.86,
    limit: 1,
  });

  hero.addSpacer();
  const icon = SFSymbol.named(forecastSymbol(bundle.selectedArea.forecast));
  icon.applyFont(Font.systemFont(42));
  const iconView = hero.addImage(icon.image);
  iconView.imageSize = new Size(40, 40);
  iconView.tintColor = new Color(PALETTE.white, 0.96);

  widget.addSpacer(10);
  const charts = widget.addStack();
  charts.layoutHorizontally();
  const uv = charts.addStack();
  uv.layoutVertically();
  uv.backgroundColor = new Color("#FFFFFF", 0.08);
  uv.cornerRadius = 18;
  uv.setPadding(10, 10, 10, 10);
  addText(uv, "UV Trend", {
    font: Font.semiboldSystemFont(10),
    color: PALETTE.whiteSoft,
  });
  const uvChart = uv.addImage(lineChart(bundle.uvSeries.slice(-10), new Size(135, 62)));
  uvChart.imageSize = new Size(135, 62);

  charts.addSpacer(10);
  const pm = charts.addStack();
  pm.layoutVertically();
  pm.backgroundColor = new Color("#FFFFFF", 0.08);
  pm.cornerRadius = 18;
  pm.setPadding(10, 10, 10, 10);
  addText(pm, "PM2.5", {
    font: Font.semiboldSystemFont(10),
    color: PALETTE.whiteSoft,
  });
  const pmChart = pm.addImage(
    barChart(bundle.pm25Entries.map(([key, value]) => ({ key, value })), new Size(135, 62), pm25Tone)
  );
  pmChart.imageSize = new Size(135, 62);

  widget.addSpacer(10);
  addText(widget, "Rain Hotspots", {
    font: Font.semiboldSystemFont(11),
    color: PALETTE.whiteSoft,
  });
  bundle.rainfallTop.slice(0, 3).forEach((item) => {
    const row = widget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    addText(row, item.name, {
      font: Font.mediumSystemFont(10),
      color: PALETTE.whiteSoft,
    });
    row.addSpacer();
    addText(row, `${item.value.toFixed(1)} mm`, {
      font: Font.semiboldSystemFont(10),
      color: PALETTE.white,
    });
  });

  widget.addSpacer(10);
  addText(widget, "4-Day Outlook", {
    font: Font.semiboldSystemFont(11),
    color: PALETTE.whiteSoft,
  });
  const days = widget.addStack();
  days.layoutHorizontally();
  bundle.fourDay.forEach((day, index) => {
    const card = days.addStack();
    card.layoutVertically();
    card.centerAlignContent();
    card.backgroundColor = new Color("#FFFFFF", 0.08);
    card.cornerRadius = 15;
    card.setPadding(8, 10, 8, 10);
    card.size = new Size(64, 0);
    addText(card, day.day.slice(0, 3), {
      font: Font.semiboldSystemFont(10),
      color: PALETTE.whiteSoft,
    });
    const daySymbol = SFSymbol.named(forecastSymbol(day.forecast.text));
    daySymbol.applyFont(Font.systemFont(14));
    const image = card.addImage(daySymbol.image);
    image.imageSize = new Size(14, 14);
    image.tintColor = new Color(PALETTE.white, 0.96);
    addText(card, `${day.temperature.high}°`, {
      font: Font.semiboldSystemFont(11),
      color: PALETTE.white,
    });
    addText(card, `${day.temperature.low}°`, {
      font: Font.mediumSystemFont(10),
      color: PALETTE.whiteSoft,
    });
    if (index !== bundle.fourDay.length - 1) days.addSpacer(8);
  });

  if (cfg.showTraffic) {
    try {
      widget.addSpacer(10);
      const traffic = await loadTrafficImage(cfg.trafficCameraId);
      if (traffic) {
        addText(widget, `Traffic Cam ${traffic.cameraId}`, {
          font: Font.semiboldSystemFont(11),
          color: PALETTE.whiteSoft,
        });
        widget.addSpacer(4);
        const image = widget.addImage(traffic.image);
        image.imageSize = new Size(288, 96);
        image.cornerRadius = 14;
      }
    } catch {}
  }
  widget.addSpacer();
  addText(widget, `Updated ${bundle.updatedAt.slice(11, 16)}`, {
    font: Font.mediumSystemFont(10),
    color: PALETTE.whiteSoft,
    opacity: 0.7,
  });
  return widget;
}

async function errorWidget(message, cfg) {
  const widget = new ListWidget();
  createBackground(widget, cfg);
  widget.setPadding(16, 16, 16, 16);
  addText(widget, "DataGovSG Dashboard", {
    font: Font.boldRoundedSystemFont(16),
    color: PALETTE.white,
  });
  widget.addSpacer(8);
  addText(widget, message, {
    font: Font.mediumSystemFont(12),
    color: PALETTE.whiteSoft,
    limit: 5,
  });
  return widget;
}

const cfg = settings();
let widget;
try {
  const bundle = await loadBundle(cfg);
  widget = config.widgetFamily === "small"
    ? await smallWidget(bundle, cfg)
    : config.widgetFamily === "large"
      ? await largeWidget(bundle, cfg)
      : await mediumWidget(bundle, cfg);
} catch (error) {
  widget = await errorWidget(String(error.message || error), cfg);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentLarge();
}
Script.complete();
