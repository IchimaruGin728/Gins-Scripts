import { Script, Widget } from "scripting"

const previewParameters = {
  "QWeather Template": JSON.stringify({
    WEATHER_API_KEY: "<YOUR_API_KEY>",
    WEATHER_LOCATION: "<LOCATION_ID_OR_LNG_LAT>",
    QWEATHER_LANG: "zh",
    QWEATHER_UNIT: "m",
    WEATHER_API_HOST: "https://devapi.qweather.com",
    WEATHER_NAME: "自定义城市",
  }),
}

await Widget.preview({
  family: "systemMedium",
  parameters: {
    options: previewParameters,
    default: "QWeather Template",
  },
})

Script.exit()
