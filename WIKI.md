# Gins-Scripts Wiki (Quick)

## URL Structure
`/{type}/{software}/{name}`

Examples:
- `/widgets/scripting/qweather-weather-widget/index`
- `/scripts/stash/qweather-weather-tile`

## Type / Software Matrix
- `widgets`: `egern`, `scripting`, `scriptable`
- `modules`: `egern`, `shadowrocket`, `quantumultx`, `loon`, `stash`, `surge`
- `scripts`: `egern`, `shadowrocket`, `quantumultx`, `loon`, `stash`, `surge`, `scripting`, `scriptable`

## Scripting Packages
Base domain:
- `https://scripts.ichimarugin728.dev`

Directory URL:
- `https://scripts.ichimarugin728.dev/packages/scripting/qweather-weather-widget/`
- `https://scripts.ichimarugin728.dev/packages/scripting/datagovsg-dashboard/`

ZIP URL:
- `https://scripts.ichimarugin728.dev/packages/scripting/qweather-weather-widget.zip`
- `https://scripts.ichimarugin728.dev/packages/scripting/datagovsg-dashboard.zip`

## QWeather Parameters
Set these values in widget parameter JSON:
- `WEATHER_API_KEY`: your QWeather key
- `WEATHER_LOCATION`: location id or `lng,lat`
- `QWEATHER_LANG`: `zh` or `en`
- `QWEATHER_UNIT`: `m` or `i`
- `WEATHER_API_HOST`: `https://devapi.qweather.com`
- `WEATHER_NAME`: display city name

## Machine Endpoints
- `Manifest`: `/manifest.json`
- `All files`: `/downloads/...`

`/manifest.json` is kept for clients and automation. It is not shown in the top navigation.
