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

- `wrangler.jsonc`
- `src/worker.ts`
- `src/lib/catalog.ts`
- `src/pages/...`
- `src/layouts/...`
- `src/components/...`
- `tools/build-distribution.mjs`
- `public/manifest.json`
- `public/downloads/...`
- `dist/...`

How it works:

- `pnpm run build:catalog` copies script files into `public/downloads` and updates `public/manifest.json`
- `pnpm run build` runs the catalog build and then Astro static build
- Astro renders the catalog pages into `dist/...`
- Hono handles the Worker entry and serves canonical URLs plus `/api/manifest`
- canonical URLs follow `/{type}/{software}/{name}`
- `src/worker.ts` serves canonical URLs only; old `/download/...` and software-first paths are intentionally removed
- `wrangler.jsonc` defines the Worker name as `gins-scripts`
- connect the Worker directly to the GitHub repository in Cloudflare Builds instead of using GitHub Actions
- package management is `pnpm`
- `@hono/hono` is consumed from `jsr`

Recommended binding naming:

- `gins-scripts-assets`
- `gins-scripts-kv`
- `gins-scripts-cache`
- `gins-scripts-secrets`

Deploy:

```bash
pnpm install
pnpm run cf:deploy
```

Cloudflare dashboard settings:

- `Compatibility date`: keep it on the newest date you intentionally support
- `Placement`: `smart`
- `Build command`: `pnpm run build`
- `Deploy command`: `pnpm exec wrangler deploy`
- connect the Worker to the GitHub repo directly from Workers & Pages

Useful routes after deployment:

- `/`
- `/widgets`
- `/modules`
- `/scripts`
- `/manifest.json`
- `/api/manifest`
- `/widgets/scriptable/qweather-weather-widget`
- `/widgets/scriptable/datagovsg-dashboard`
- `/widgets/scripting/qweather-weather-widget/index`
- `/widgets/scripting/qweather-weather-widget/shared`
- `/widgets/scripting/qweather-weather-widget/widget`
- `/widgets/scripting/datagovsg-dashboard/index`
- `/widgets/scripting/datagovsg-dashboard/shared`
- `/widgets/scripting/datagovsg-dashboard/widget`
- `/widgets/egern/qweather-weather-widget`
- `/modules/egern/qweather-weather-module`
- `/widgets/egern/datagovsg-dashboard`
- `/widgets/stash/qweather-weather-tile`
- `/widgets/surge/qweather-weather-panel`

Software landing paths are published even when empty, for example:

- `/widgets/quantumultx`
- `/modules/loon`
- `/scripts/shadowrocket`

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
