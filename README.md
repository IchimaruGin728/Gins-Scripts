# Widgets Suite

Cross-platform weather widgets built around QWeather for:

- Scriptable
- Scripting app
- Egern
- Stash Tile
- Surge Panel

## Files

- `scriptable/QWeatherWeatherWidget.js`
- `scripting/qweather-weather-widget/index.tsx`
- `scripting/qweather-weather-widget/widget.tsx`
- `scripting/qweather-weather-widget/shared.ts`
- `egern/qweather-weather-widget.js`
- `egern/qweather-weather-module.yaml`
- `stash/qweather-weather-tile.js`
- `surge/qweather-weather-panel.js`

## Required QWeather Config

Do not commit personal API keys or private locations into the repo.

Each user should inject their own values through widget parameters, Egern env, or Stash/Surge arguments.

Preferred generic names:

- `WEATHER_API_KEY`: your weather API key
- `WEATHER_LOCATION`: LocationID or `longitude,latitude`
- `WEATHER_API_HOST`: default `https://devapi.qweather.com`

Backward-compatible QWeather-specific names are also supported:

- `QWEATHER_KEY`: your QWeather API key or token
- `QWEATHER_LOCATION`: LocationID or `longitude,latitude`
- `QWEATHER_HOST`: default `https://devapi.qweather.com`

Optional:

- `QWEATHER_LANG`: default `zh`
- `QWEATHER_UNIT`: `m` or `i`, default `m`
- `WEATHER_NAME`: custom display name

Example values are provided in [.env.example](/Users/ichimarugin728/Gins-Projects/Gins-Scripts/.env.example).

## Cloudflare Distribution

This repo now includes a Cloudflare Worker distribution layer for `Gins-Scripts`.

Files:

- `wrangler.toml`
- `src/index.js`
- `tools/build-distribution.mjs`
- `public/index.html`
- `public/manifest.json`
- `public/downloads/...`

How it works:

- `npm run build:dist` copies script files into `public/downloads`
- `public/manifest.json` is generated as a machine-readable catalog
- `src/index.js` serves static assets and stable short aliases like `/download/scriptable/qweather`
- `wrangler.toml` defines the Worker name as `gins-scripts`

Recommended binding naming:

- `gins-scripts-assets`
- `gins-scripts-kv`
- `gins-scripts-cache`
- `gins-scripts-secrets`

Deploy:

```bash
npm install
npm run cf:deploy
```

Useful routes after deployment:

- `/`
- `/manifest.json`
- `/api/manifest`
- `/download/scriptable/qweather`
- `/download/scriptable/datagovsg`
- `/download/egern/qweather`
- `/download/egern/qweather-module`
- `/download/egern/datagovsg`
- `/download/stash/qweather`
- `/download/surge/qweather`

## Parameter Examples

### Scriptable / Scripting

Use widget parameter JSON such as:

```json
{
  "WEATHER_API_KEY": "<YOUR_API_KEY>",
  "WEATHER_LOCATION": "<LOCATION_ID_OR_LNG_LAT>",
  "WEATHER_API_HOST": "https://devapi.qweather.com",
  "QWEATHER_LANG": "zh",
  "QWEATHER_UNIT": "m",
  "WEATHER_NAME": "自定义城市"
}
```

### Egern

Set the widget `env` fields in [egern/qweather-weather-module.yaml](/Users/ichimarugin728/Gins-Projects/Gins-Scripts/egern/qweather-weather-module.yaml).

### Stash / Surge

Pass arguments with the same keys:

```text
WEATHER_API_KEY=<YOUR_API_KEY>&WEATHER_LOCATION=<LOCATION_ID_OR_LNG_LAT>&WEATHER_NAME=自定义城市
```

## Notes

- Scriptable version supports small, medium, and large widgets with decorative gradient, hourly sparkline, and optional transparent background image.
- Scripting version uses `Widget.family` plus widget environment values to adapt to full-color and accented rendering.
- Egern version uses the JSON widget DSL and supports `systemSmall`, `systemMedium`, and `systemLarge`.
- Stash Tile and Surge Panel are intentionally simpler because those surfaces do not expose the same drawing/layout APIs as iOS widgets.

## Transparent Background

### Scriptable

Set `TRANSPARENT_BG_PATH` in the script config to a cropped transparent background image if you use a transparent widget workflow.

### Scripting

The widget reads `showsWidgetContainerBackground` and `widgetRenderingMode` so the layout stays readable when the system removes or tints the background.

### Egern

Egern does not expose the same screenshot-crop transparent workflow as Scriptable. This version uses alpha-safe gradients and adaptive colors.

## DataGovSG Dashboard

Files:

- `scriptable/DataGovSGDashboard.js`
- `scripting/datagovsg-dashboard/index.tsx`
- `scripting/datagovsg-dashboard/widget.tsx`
- `scripting/datagovsg-dashboard/shared.ts`
- `egern/datagovsg-dashboard.js`

Config:

- `DATAGOVSG_API_KEY` optional but recommended for production limits
- `AREA` for area forecast selection, e.g. `City`, `Bedok`, `Woodlands`
- `TRAFFIC_CAMERA_ID` for Scriptable large widget traffic image
- `SHOW_TRAFFIC` as `true` or `false`
- `TRANSPARENT_BG_PATH` for Scriptable transparent background image

Use per-user values here too; do not hardcode private keys into the scripts.
