# Gins-Scripts

Cross-platform scripts, widgets, modules, tiles, overrides, and rewrites for:

- Scriptable
- Scripting app
- Egern
- Stash
- Surge
- Shadowrocket
- Loon
- QuantumultX

## Quick Docs

- Repo wiki doc: [`WIKI.md`](./WIKI.md)
- Web guide page: `/guide`

## Files

- `Scriptable/QWeather.js`
- `Scriptable/DataGovSG.js`
- `Scripting/QWeather/index.tsx`
- `Scripting/QWeather/widget.tsx`
- `Scripting/QWeather/shared.ts`
- `Scripting/DataGovSG/index.tsx`
- `Scripting/DataGovSG/widget.tsx`
- `Scripting/DataGovSG/shared.ts`
- `Scripting/Countdown/index.tsx`
- `Scripting/Countdown/widget.tsx`
- `Scripting/Countdown/shared.ts`
- `Egern/QWeather.js`
- `Egern/QWeather.yaml`
- `Egern/DataGovSG.js`
- `Stash/QWeather.js`
- `Surge/QWeather.js`

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
- canonical URLs follow `/{Software}/{Category}/{Project}`
- `src/worker.ts` serves canonical pages and raw source aliases
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
- `/Scripting`
- `/Scripting/Widget`
- `/Scriptable/Widget`
- `/Egern/Widget`
- `/Egern/Module`
- `/Stash/Tile`
- `/Surge/Script`
- `/manifest.json`
- `/api/manifest`
- `/Scriptable/Widget/QWeather`
- `/Scriptable/Widget/DataGovSG`
- `/Scripting/Widget/QWeather/index`
- `/Scripting/Widget/QWeather/shared`
- `/Scripting/Widget/QWeather/widget`
- `/Scripting/Widget/DataGovSG/index`
- `/Scripting/Widget/DataGovSG/shared`
- `/Scripting/Widget/DataGovSG/widget`
- `/Scripting/Widget/Countdown/index`
- `/Scripting/Widget/Countdown/shared`
- `/Scripting/Widget/Countdown/widget`
- `/Egern/Widget/QWeather`
- `/Egern/Module/QWeather`
- `/Egern/Widget/DataGovSG`
- `/Stash/Tile/QWeather`
- `/Surge/Script/QWeather`

Software landing paths are published even when empty:

- `/QuantumultX`
- `/Loon`
- `/Shadowrocket`

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

Set the widget `env` fields in [QWeather.yaml](/Users/ichimarugin728/Gins-Projects/Gins-Scripts/Egern/QWeather.yaml).

### Stash / Surge

Pass arguments with the same keys:

```text
WEATHER_API_KEY=<YOUR_API_KEY>&WEATHER_LOCATION=<LOCATION_ID_OR_LNG_LAT>&WEATHER_NAME=自定义城市
```

## Notes

- Scriptable version supports small, medium, and large widgets with decorative gradient, hourly sparkline, and optional transparent background image.
- Scripting version uses `Widget.family` plus widget environment values to adapt to full-color and accented rendering.
- Egern version uses the JSON widget DSL and supports `systemSmall`, `systemMedium`, and `systemLarge`.
- Stash Tile and Surge Script are intentionally simpler because those surfaces do not expose the same drawing/layout APIs as iOS widgets.

## Transparent Background

### Scriptable

Set `TRANSPARENT_BG_PATH` in the script config to a cropped transparent background image if you use a transparent widget workflow.

### Scripting

The widget reads `showsWidgetContainerBackground` and `widgetRenderingMode` so the layout stays readable when the system removes or tints the background.

### Egern

Egern does not expose the same screenshot-crop transparent workflow as Scriptable. This version uses alpha-safe gradients and adaptive colors.

## DataGovSG Dashboard

Files:

- `Scriptable/DataGovSG.js`
- `Scripting/DataGovSG/index.tsx`
- `Scripting/DataGovSG/widget.tsx`
- `Scripting/DataGovSG/shared.ts`
- `Egern/DataGovSG.js`

Config:

- `DATAGOVSG_API_KEY` optional but recommended for production limits
- `AREA` for area forecast selection, e.g. `City`, `Bedok`, `Woodlands`
- `TRAFFIC_CAMERA_ID` for Scriptable large widget traffic image
- `SHOW_TRAFFIC` as `true` or `false`
- `TRANSPARENT_BG_PATH` for Scriptable transparent background image

Use per-user values here too; do not hardcode private keys into the scripts.
