import { Script } from "scripting"

console.present().then(() => Script.exit())
console.log("请将此脚本添加为桌面小组件使用")
console.log("显示 Zone 过去 24 小时的请求量、带宽、缓存率、威胁拦截")
console.log("")
console.log("使用前请在 widget.tsx 中配置：")
console.log("  CF_API_TOKEN = 你的 API Token")
console.log("  CF_ZONE_ID   = 你的 Zone ID")
