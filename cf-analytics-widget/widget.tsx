import {
  Widget,
  VStack,
  HStack,
  Text,
  Spacer,
} from "scripting"

// ======= 配置区 =======
const CF_API_TOKEN = "YOUR_API_TOKEN_HERE"
const CF_ZONE_ID   = "YOUR_ZONE_ID_HERE"
// ======================

interface HourlySum {
  requests?: number
  cachedRequests?: number
  bytes?: number
  cachedBytes?: number
  threats?: number
  pageViews?: number
}

interface ZoneStats {
  requests: number
  cachedRequests: number
  bandwidth: number
  cachedBandwidth: number
  threats: number
  pageviews: number
}

async function fetchZoneAnalytics(): Promise<ZoneStats> {
  const now = new Date()
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const query = `
    query {
      viewer {
        zones(filter: { zoneTag: "${CF_ZONE_ID}" }) {
          httpRequests1hGroups(
            limit: 24
            filter: {
              datetime_geq: "${since.toISOString()}"
              datetime_leq: "${now.toISOString()}"
            }
            orderBy: [datetime_ASC]
          ) {
            sum {
              requests
              cachedRequests
              bytes
              cachedBytes
              threats
              pageViews
            }
          }
        }
      }
    }
  `

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  const json = await res.json()
  const groups: { sum: HourlySum }[] =
    json?.data?.viewer?.zones?.[0]?.httpRequests1hGroups ?? []

  if (groups.length === 0) throw new Error("无数据（检查 Token / Zone ID）")

  const total = groups.reduce(
    (acc, { sum }) => ({
      requests:        acc.requests        + (sum.requests       ?? 0),
      cachedRequests:  acc.cachedRequests   + (sum.cachedRequests ?? 0),
      bandwidth:       acc.bandwidth       + (sum.bytes          ?? 0),
      cachedBandwidth: acc.cachedBandwidth  + (sum.cachedBytes    ?? 0),
      threats:         acc.threats          + (sum.threats        ?? 0),
      pageviews:       acc.pageviews        + (sum.pageViews      ?? 0),
    }),
    { requests: 0, cachedRequests: 0, bandwidth: 0, cachedBandwidth: 0, threats: 0, pageviews: 0 }
  )

  return total
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return `${n}`
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <VStack
      spacing={2}
      padding={10}
      frame={{ minWidth: 0, maxWidth: Infinity }}
    >
      <Text font={10} foregroundStyle="secondaryLabel">{label}</Text>
      <Text font={15} fontWeight="semibold" foregroundStyle={color}>
        {value}
      </Text>
    </VStack>
  )
}

async function render() {
  const reloadPolicy = {
    policy: "after",
    date: new Date(Date.now() + 15 * 60 * 1000),
  }

  try {
    const stats = await fetchZoneAnalytics()
    const cacheRate = Math.round((stats.cachedRequests / Math.max(stats.requests, 1)) * 100)

    Widget.present(
      <VStack
        padding={14}
        spacing={10}
        frame={{ minWidth: 0, maxWidth: Infinity }}
      >
        {/* 标题行 */}
        <HStack spacing={6}>
          <Text font={11} fontWeight="bold" foregroundStyle="#F6821F">
            ◆ CF ANALYTICS
          </Text>
          <Spacer />
          <Text font={10} foregroundStyle="secondaryLabel">
            过去 24 小时
          </Text>
        </HStack>

        {/* 第一行：请求 & 带宽 */}
        <HStack spacing={8}>
          <StatCard label="总请求" value={formatCount(stats.requests)} color="#3B82F6" />
          <StatCard label="带宽" value={formatBytes(stats.bandwidth)} color="#8B5CF6" />
        </HStack>

        {/* 第二行：缓存率 & 威胁 */}
        <HStack spacing={8}>
          <StatCard label="缓存命中" value={`${cacheRate}%`} color="#22C55E" />
          <StatCard label="威胁拦截" value={formatCount(stats.threats)} color={stats.threats > 0 ? "#EF4444" : "secondaryLabel"} />
        </HStack>

        {/* 页面访问 */}
        <HStack spacing={6}>
          <Text font={10} foregroundStyle="secondaryLabel">
            页面访问
          </Text>
          <Text font={10} foregroundStyle="label">
            {formatCount(stats.pageviews)}
          </Text>
          <Spacer />
          <Text font={10} foregroundStyle="secondaryLabel">
            缓存节省 {formatBytes(stats.cachedBandwidth)}
          </Text>
        </HStack>
      </VStack>,
      reloadPolicy
    )
  } catch (e) {
    Widget.present(
      <VStack padding={14} spacing={4}>
        <Text font={11} fontWeight="bold" foregroundStyle="#F6821F">◆ CF ANALYTICS</Text>
        <Text font={12} foregroundStyle="#ff4444">{String(e)}</Text>
      </VStack>,
      reloadPolicy
    )
  }
}

render()
