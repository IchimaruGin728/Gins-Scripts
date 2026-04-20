# DataGovSG Dashboard

Singapore-first dashboard widgets powered by `data.gov.sg`.

## Platforms

- `scriptable/DataGovSGDashboard.js`
- `scripting/datagovsg-dashboard/index.tsx`
- `scripting/datagovsg-dashboard/widget.tsx`
- `scripting/datagovsg-dashboard/shared.ts`
- `egern/datagovsg-dashboard.js`

## Data Sources

Official APIs currently used:

- `air-temperature`
- `rainfall`
- `uv`
- `pm25`
- `two-hr-forecast`
- `twenty-four-hr-forecast`
- `four-day-outlook`
- `traffic-images` for Scriptable large layout

## Optional Parameters

All widget variants accept a JSON parameter / env object with:

- `DATAGOVSG_API_KEY`
- `AREA` e.g. `City`, `Bedok`, `Woodlands`
- `TRAFFIC_CAMERA_ID` e.g. `1704`
- `SHOW_TRAFFIC` as `true` or `false`
- `TRANSPARENT_BG_PATH` for Scriptable only

Keep `DATAGOVSG_API_KEY` user-specific. The repo should only contain placeholders or examples.

## Visual Direction

- Theme color: `#4D3DD8` derived from data.gov.sg branding
- Scripting version: quieter, more Apple-like, adaptive to widget rendering modes
- Scriptable version: more graphic, more charts, more contrast
- Egern version: stable and information-dense, with the same purple palette

## Layout Notes

- Small: current temperature, 2-hour forecast, outdoor score, UV, PM2.5
- Medium: current conditions plus UV trend and PM2.5 comparison
- Large: adds rain hotspots, 24-hour summary, and 4-day outlook

## Current Signals Used

- Temperature: nationwide station average
- Humidity: 24-hour forecast general relative humidity range
- UV: recent UV index series
- PM2.5: one-hour regional readings
- Rainfall: top rainfall hotspots from current station readings
- Forecasts: selected area from 2-hour forecast plus 24-hour and 4-day outlook
