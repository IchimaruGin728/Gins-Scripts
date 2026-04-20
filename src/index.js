const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "public, max-age=300",
}

async function fetchManifest(env, request) {
  const assetResponse = await env.ASSETS.fetch(new URL("/manifest.json", request.url))
  if (!assetResponse.ok) {
    return new Response(JSON.stringify({ error: "manifest unavailable" }), {
      status: 500,
      headers: JSON_HEADERS,
    })
  }
  return assetResponse
}

function resolveAlias(pathname) {
  const aliases = {
    "/download/scriptable/qweather": "/downloads/scriptable/QWeatherWeatherWidget.js",
    "/download/scriptable/datagovsg": "/downloads/scriptable/DataGovSGDashboard.js",
    "/download/egern/qweather": "/downloads/egern/qweather-weather-widget.js",
    "/download/egern/qweather-module": "/downloads/egern/qweather-weather-module.yaml",
    "/download/egern/datagovsg": "/downloads/egern/datagovsg-dashboard.js",
    "/download/stash/qweather": "/downloads/stash/qweather-weather-tile.js",
    "/download/surge/qweather": "/downloads/surge/qweather-weather-panel.js",
    "/download/scripting/qweather/index": "/downloads/scripting/qweather-weather-widget/index.tsx",
    "/download/scripting/qweather/shared": "/downloads/scripting/qweather-weather-widget/shared.ts",
    "/download/scripting/qweather/widget": "/downloads/scripting/qweather-weather-widget/widget.tsx",
    "/download/scripting/datagovsg/index": "/downloads/scripting/datagovsg-dashboard/index.tsx",
    "/download/scripting/datagovsg/shared": "/downloads/scripting/datagovsg-dashboard/shared.ts",
    "/download/scripting/datagovsg/widget": "/downloads/scripting/datagovsg-dashboard/widget.tsx",
  }
  return aliases[pathname] || null
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/api/manifest" || url.pathname === "/manifest.json") {
      return fetchManifest(env, request)
    }

    const alias = resolveAlias(url.pathname)
    if (alias) {
      return env.ASSETS.fetch(new URL(alias, url))
    }

    return env.ASSETS.fetch(request)
  },
}
