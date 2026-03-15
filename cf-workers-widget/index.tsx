import { Script } from "scripting"

console.present().then(() => Script.exit())
console.log("请将此脚本添加为桌面小组件使用")
console.log("显示 Worker 过去 24 小时的调用量、错误率、CPU 耗时")
console.log("")
console.log("使用前请在 widget.tsx 中配置：")
console.log("  CF_API_TOKEN  = 你的 API Token")
console.log("  CF_ACCOUNT_ID = 你的 Account ID")
console.log("  WORKER_NAME   = 你的 Worker 名称")
