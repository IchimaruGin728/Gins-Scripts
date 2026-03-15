import { Script, Navigation, VStack, Text } from "scripting"

function MainView() {
  return (
    <VStack padding={20} spacing={12}>
      <Text font={16} fontWeight="bold" foregroundStyle="#F6821F">
        CF 部署监控
      </Text>
      <Text font={14} foregroundStyle="label">
        此脚本通过灵动岛实时显示 Cloudflare Pages 构建和 Workers 部署状态。
      </Text>
      <Text font={12} foregroundStyle="secondaryLabel">
        使用前请在 app_intents.tsx 中配置 API Token、Account ID、项目名称。
      </Text>
      <Text font={12} foregroundStyle="secondaryLabel">
        通过 Shortcuts 或脚本内触发 StartDeployMonitor 来启动监控。
      </Text>
    </VStack>
  )
}

Navigation.present(<MainView />)
