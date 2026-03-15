/** @jsxRuntime classic */
// CF Workers Widget
// 显示指定 Worker 过去 24 小时的调用量、错误率、CPU 耗时分布
// 需要：API Token（Account Analytics:Read）+ Account ID + Worker 名称
// GraphQL: workersInvocationsAdaptiveGroups

// ======= 配置区 =======
const CF_API_TOKEN  = "YOUR_API_TOKEN_HERE"
const CF_ACCOUNT_ID = "YOUR_ACCOUNT_ID_HERE"
const WORKER_NAME   = "YOUR_WORKER_NAME_HERE"
// ======================

interface WorkerStats {
  requests: number
  errors: number
  subrequests: number
  cpuP50: number   // ms
  cpuP99: number   // ms
}

async function fetchWorkerStats(): Promise<WorkerStats> {
  const now   = new Date()
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const query = `
    query {
      viewer {
        accounts(filter: { accountTag: "${CF_ACCOUNT_ID}" }) {
          workersInvocationsAdaptiveGroups(
            limit: 100
            filter: {
              scriptName: "${WORKER_NAME}"
              datetime_geq: "${since.toISOString()}"
              datetime_leq: "${now.toISOString()}"
            }
          ) {
            sum {
              requests
              errors
              subrequests
            }
            quantiles {
              cpuTimeP50
              cpuTimeP99
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
  const groups: { sum: { requests?: number; errors?: number; subrequests?: number }; quantiles?: { cpuTimeP50?: number; cpuTimeP99?: number } }[] =
    json?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptiveGroups ?? []

  if (groups.length === 0) throw new Error("无数据（检查 Worker 名称 / Token）")

  const totals = groups.reduce(
    (acc, g) => ({
      requests:    acc.requests    + (g.sum.requests    ?? 0),
      errors:      acc.errors      + (g.sum.errors      ?? 0),
      subrequests: acc.subrequests + (g.sum.subrequests ?? 0),
    }),
    { requests: 0, errors: 0, subrequests: 0 }
  )

  // 取最后一个分位数组作为代表（多桶时取最大 P99 更保守）
  const cpuP50 = Math.max(...groups.map(g => g.quantiles?.cpuTimeP50 ?? 0))
  const cpuP99 = Math.max(...groups.map(g => g.quantiles?.cpuTimeP99 ?? 0))

  return { ...totals, cpuP50: cpuP50 / 1000, cpuP99: cpuP99 / 1000 } // μs → ms
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return `${n}`
}

function formatCpu(ms: number): string {
  if (ms >= 1) return `${ms.toFixed(1)}ms`
  return `${(ms * 1000).toFixed(0)}μs`
}

function MetricBox({
  label, value, color, sub, subColor,
}: {
  label: string; value: string; color: string; sub?: string; subColor?: string
}) {
  return (
    <VStack
      spacing={3}
      padding={10}
      background={{ light: "#ffffff", dark: "#1a1d27" }}
      cornerRadius={10}
    >
      <Text font={{ name: "system", size: 10 }} color="#888888">{label}</Text>
      <Text font={{ name: "monospaced", size: 14 }} color={color} fontWeight="semibold">
        {value}
      </Text>
      {sub && (
        <Text font={{ name: "system", size: 10 }} color={subColor ?? "#888888"}>
          {sub}
        </Text>
      )}
    </VStack>
  )
}

export default async function Widget() {
  let stats: WorkerStats | null = null
  let error: string | null = null

  try {
    stats = await fetchWorkerStats()
  } catch (e) {
    error = String(e)
  }

  const errorRate = stats
    ? stats.requests > 0 ? ((stats.errors / stats.requests) * 100).toFixed(2) : "0"
    : "0"
  const errorRateNum = stats ? (stats.errors / Math.max(stats.requests, 1)) * 100 : 0

  return (
    <VStack
      padding={14}
      spacing={10}
      background={{ light: "#f0f4ff", dark: "#0a0c14" }}
      cornerRadius={16}
    >
      {/* 标题 */}
      <HStack spacing={6}>
        <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="bold">
          ◆ CF WORKERS
        </Text>
        <Spacer />
        <Text font={{ name: "system", size: 10 }} color="#888888" lineLimit={1}>
          {WORKER_NAME}
        </Text>
      </HStack>

      {error ? (
        <Text font={{ name: "system", size: 12 }} color="#ff4444">{error}</Text>
      ) : stats ? (
        <VStack spacing={10}>
          {/* 调用 & 错误 */}
          <HStack spacing={8}>
            <MetricBox
              label="调用次数"
              value={formatCount(stats.requests)}
              color="#3B82F6"
              sub={`子请求 ${formatCount(stats.subrequests)}`}
            />
            <MetricBox
              label="错误率"
              value={`${errorRate}%`}
              color={errorRateNum > 1 ? "#EF4444" : errorRateNum > 0.1 ? "#F59E0B" : "#22C55E"}
              sub={`${formatCount(stats.errors)} 次错误`}
              subColor={stats.errors > 0 ? "#EF4444" : "#888888"}
            />
          </HStack>

          {/* CPU 耗时 */}
          <HStack spacing={8}>
            <MetricBox
              label="CPU P50"
              value={formatCpu(stats.cpuP50)}
              color="#8B5CF6"
            />
            <MetricBox
              label="CPU P99"
              value={formatCpu(stats.cpuP99)}
              color={stats.cpuP99 > 10 ? "#F59E0B" : "#8B5CF6"}
            />
          </HStack>

          {/* 底部标注 */}
          <HStack>
            <Spacer />
            <Text font={{ name: "system", size: 10 }} color="#888888">
              过去 24 小时
            </Text>
          </HStack>
        </VStack>
      ) : (
        <Text font={{ name: "system", size: 12 }} color="#888888">加载中...</Text>
      )}
    </VStack>
  )
}
