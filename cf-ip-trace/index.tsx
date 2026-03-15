import { Script } from "scripting"

if (config.runsInApp) {
  console.present().then(() => Script.exit())
  console.log("请将此脚本添加为桌面小组件使用")
}

// 统一入口
import("./widget")
