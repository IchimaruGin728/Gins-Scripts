/** @jsxRuntime classic */
// CF Analytics Widget
// 使用 Cloudflare GraphQL Analytics API 显示 Zone 流量统计（真实过去 24 小时）
// 需要：API Token（Zone Analytics:Read）+ Zone ID

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

  // 用 httpRequests1hGroups 累加 24 个小时桶，比 1dGroups 更精确
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

  // 累加所有小时桶
  const total = groups.reduce(
    (acc, { sum }) => ({
      requests:       acc.requests       + (sum.requests       ?? 0),
      cachedRequests: acc.cachedRequests + (sum.cachedRequests ?? 0),
      bandwidth:      acc.bandwidth      + (sum.bytes          ?? 0),
      cachedBandwidth:acc.cachedBandwidth+ (sum.cachedBytes    ?? 0),
      threats:        acc.threats        + (sum.threats        ?? 0),
      pageviews:      acc.pageviews      + (sum.pageViews      ?? 0),
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
    <VStack spacing={2} padding={10} background={{ light: "#ffffff", dark: "#1a1d27" }} cornerRadius={10}>
      <Text font={{ name: "system", size: 10 }} color="#888888">{label}</Text>
      <Text font={{ name: "monospaced", size: 15 }} color={color} fontWeight="semibold">
        {value}
      </Text>
    </VStack>
  )
}

export default async function Widget() {
  let stats: ZoneStats | null = null
  let error: string | null = null

  try {
    stats = await fetchZoneAnalytics()
  } catch (e) {
    error = String(e)
  }

  const cacheRate = stats
    ? Math.round((stats.cachedRequests / Math.max(stats.requests, 1)) * 100)
    : 0

  return (
    <VStack
      padding={14}
      spacing={10}
      background={{ light: "#f0f4ff", dark: "#0a0c14" }}
      cornerRadius={16}
    >
      {/* 标题行 */}
      <HStack spacing={6}>
        <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="bold">
          ◆ CF ANALYTICS
        </Text>
        <Spacer />
        <Text font={{ name: "system", size: 10 }} color="#888888">
          过去 24 小时
        </Text>
      </HStack>

      {error ? (
        <Text font={{ name: "system", size: 12 }} color="#ff4444">
          {error}
        </Text>
      ) : stats ? (
        <VStack spacing={10}>
          {/* 第一行：请求 & 带宽 */}
          <HStack spacing={8}>
            <StatCard label="总请求" value={formatCount(stats.requests)} color="#3B82F6" />
            <StatCard label="带宽" value={formatBytes(stats.bandwidth)} color="#8B5CF6" />
          </HStack>

          {/* 第二行：缓存率 & 威胁 */}
          <HStack spacing={8}>
            <StatCard label="缓存命中" value={`${cacheRate}%`} color="#22C55E" />
            <StatCard label="威胁拦截" value={formatCount(stats.threats)} color={stats.threats > 0 ? "#EF4444" : "#888888"} />
          </HStack>

          {/* 页面访问 */}
          <HStack spacing={6}>
            <Text font={{ name: "system", size: 10 }} color="#888888">
              页面访问
            </Text>
            <Text font={{ name: "monospaced", size: 10 }} color={{ light: "#333333", dark: "#cccccc" }}>
              {formatCount(stats.pageviews)}
            </Text>
            <Spacer />
            <Text font={{ name: "system", size: 10 }} color="#888888">
              缓存节省 {formatBytes(stats.cachedBandwidth)}
            </Text>
          </HStack>
        </VStack>
      ) : (
        <Text font={{ name: "system", size: 12 }} color="#888888">加载中...</Text>
      )}
    </VStack>
  )
}
