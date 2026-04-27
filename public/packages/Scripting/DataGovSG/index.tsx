import { Script, Widget } from "scripting"

const previewParameters = {
  "DataGovSG Demo": JSON.stringify({
    AREA: "City",
    TRAFFIC_CAMERA_ID: "1704",
    SHOW_TRAFFIC: false,
  }),
}

await Widget.preview({
  family: "systemMedium",
  parameters: {
    options: previewParameters,
    default: "DataGovSG Demo",
  },
})

Script.exit()
