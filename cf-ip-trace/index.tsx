/** @jsxRuntime classic */
// CF IP + Speed Widget
// 调用 Cloudflare CDN trace 接口，显示当前 IP、数据中心、连接信息
// 同时测量到 CF 边缘节点的实际延迟
// 无需 API Token

interface TraceInfo {
  ip: string
  ts: string
  visit_scheme: string
  uag: string
  colo: string        // 数据中心代码（如 NRT = 东京）
  sliver: string
  http: string
  loc: string         // 国家代码
  tls: string
  sni: string
  warp: string
  gateway: string
  rbi: string
  kex: string
}

interface SpeedResult {
  rttMs: number         // 到 CF 边缘的往返延迟
  downloadKbps: number  // 小文件下载速率估算
}

async function fetchTrace(): Promise<{ info: TraceInfo; speed: SpeedResult }> {
  // ---- RTT：计时 trace 请求 ----
  const t0 = Date.now()
  const res = await fetch("https://cloudflare.com/cdn-cgi/trace")
  const rttMs = Date.now() - t0

  const text = await res.text()
  const obj: Record<string, string> = {}
  for (const line of text.trim().split("\n")) {
    const eq = line.indexOf("=")
    if (eq > 0) obj[line.slice(0, eq)] = line.slice(eq + 1)
  }

  // ---- 下载速率：拉一个 100 KB 的 CF 测速文件 ----
  let downloadKbps = 0
  try {
    const dlT0 = Date.now()
    const dlRes = await fetch("https://speed.cloudflare.com/__down?bytes=102400")
    await dlRes.arrayBuffer()
    const dlMs = Date.now() - dlT0
    // 102400 bytes = 100 KB；转为 Kbps
    downloadKbps = Math.round((102400 * 8) / (dlMs / 1000) / 1000)
  } catch (_e) {
    // 测速失败不影响主信息显示
  }

  return {
    info: obj as unknown as TraceInfo,
    speed: { rttMs, downloadKbps },
  }
}

const coloCity: Record<string, string> = {
  NRT: "东京",  LAX: "洛杉矶", SJC: "圣何塞",  SIN: "新加坡",
  HKG: "香港",  LHR: "伦敦",   CDG: "巴黎",    FRA: "法兰克福",
  ORD: "芝加哥",IAD: "华盛顿", SEA: "西雅图",  SYD: "悉尼",
  ICN: "首尔",  TPE: "台北",   SHA: "上海",    PEK: "北京",
  KIX: "大阪",  CAN: "广州",   CTU: "成都",    WUH: "武汉",
  XMN: "厦门",  CGQ: "长春",   HAK: "海口",    TYO: "东京2",
  MNL: "马尼拉",BKK: "曼谷",   KUL: "吉隆坡",  CGK: "雅加达",
  DXB: "迪拜",  AMS: "阿姆斯特丹", MAD: "马德里", MXP: "米兰",
  EWR: "纽约",  ATL: "亚特兰大",  DFW: "达拉斯", MIA: "迈阿密",
  YYZ: "多伦多",GRU: "圣保罗",  SCL: "圣地亚哥",BOG: "波哥大",
  JNB: "约翰内斯堡", CPT: "开普敦", NBO: "内罗毕",
}

function rttColor(ms: number): string {
  if (ms < 80)  return "#22C55E"
  if (ms < 200) return "#F59E0B"
  return "#EF4444"
}

function speedColor(kbps: number): string {
  if (kbps > 50000) return "#22C55E"    // > 50 Mbps
  if (kbps > 10000) return "#84CC16"    // > 10 Mbps
  if (kbps > 1000)  return "#F59E0B"    // > 1 Mbps
  return "#EF4444"
}

function formatSpeed(kbps: number): string {
  if (kbps <= 0)       return "—"
  if (kbps >= 1000)    return `${(kbps / 1000).toFixed(1)} Mbps`
  return `${kbps} Kbps`
}

export default async function Widget() {
  let info: TraceInfo | null = null
  let speed: SpeedResult | null = null
  let error: string | null = null

  try {
    const result = await fetchTrace()
    info  = result.info
    speed = result.speed
  } catch (e) {
    error = String(e)
  }

  if (error || !info || !speed) {
    return (
      <VStack padding={16} spacing={4} background={{ light: "#f8faff", dark: "#0f1117" }} cornerRadius={14}>
        <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="bold">◆ CF IP · SPEED</Text>
        <Text font={{ name: "system", size: 12 }} color="#ff4444">获取失败</Text>
        <Text font={{ name: "system", size: 10 }} color="#888888">{error ?? "未知错误"}</Text>
      </VStack>
    )
  }

  const city         = coloCity[info.colo] ?? info.colo
  const warpActive   = info.warp === "on"
  const gatewayActive = info.gateway === "on"

  return (
    <VStack
      padding={16}
      spacing={10}
      background={{ light: "#f8faff", dark: "#0f1117" }}
      cornerRadius={14}
    >
      {/* 标题 */}
      <HStack spacing={6}>
        <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="bold">
          ◆ CF IP · SPEED
        </Text>
        <Spacer />
        <Text font={{ name: "system", size: 10 }} color="#888888">{info.loc}</Text>
      </HStack>

      {/* IP */}
      <VStack spacing={2}>
        <Text font={{ name: "system", size: 10 }} color="#888888">当前 IP</Text>
        <Text font={{ name: "monospaced", size: 15 }} color={{ light: "#111111", dark: "#eeeeee" }} fontWeight="semibold">
          {info.ip}
        </Text>
      </VStack>

      {/* 数据中心 & 协议 */}
      <HStack spacing={16}>
        <VStack spacing={2}>
          <Text font={{ name: "system", size: 10 }} color="#888888">接入节点</Text>
          <Text font={{ name: "monospaced", size: 13 }} color="#F6821F" fontWeight="medium">
            {info.colo} · {city}
          </Text>
        </VStack>
        <VStack spacing={2}>
          <Text font={{ name: "system", size: 10 }} color="#888888">协议</Text>
          <Text font={{ name: "monospaced", size: 12 }} color="#3B82F6">
            {info.http} / {info.tls}
          </Text>
        </VStack>
      </HStack>

      {/* 分割线 */}
      <Rectangle height={1} background={{ light: "#e5e7eb", dark: "#2a2d3a" }} />

      {/* 速度指标 */}
      <HStack spacing={12}>
        {/* RTT */}
        <VStack spacing={2}>
          <Text font={{ name: "system", size: 10 }} color="#888888">延迟 RTT</Text>
          <HStack spacing={3}>
            <Text font={{ name: "monospaced", size: 14 }} color={rttColor(speed.rttMs)} fontWeight="semibold">
              {speed.rttMs}
            </Text>
            <Text font={{ name: "system", size: 10 }} color="#888888">ms</Text>
          </HStack>
        </VStack>

        {/* 下载速率 */}
        <VStack spacing={2}>
          <Text font={{ name: "system", size: 10 }} color="#888888">下载速率</Text>
          <Text font={{ name: "monospaced", size: 14 }} color={speedColor(speed.downloadKbps)} fontWeight="semibold">
            {formatSpeed(speed.downloadKbps)}
          </Text>
        </VStack>

        <Spacer />

        {/* WARP / Gateway 状态 */}
        <VStack spacing={4}>
          <HStack spacing={4}>
            <Text font={{ name: "system", size: 10 }} color="#888888">WARP</Text>
            <Text font={{ name: "system", size: 10 }} color={warpActive ? "#22C55E" : "#555555"}>
              {warpActive ? "ON" : "OFF"}
            </Text>
          </HStack>
          <HStack spacing={4}>
            <Text font={{ name: "system", size: 10 }} color="#888888">GW</Text>
            <Text font={{ name: "system", size: 10 }} color={gatewayActive ? "#22C55E" : "#555555"}>
              {gatewayActive ? "ON" : "OFF"}
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </VStack>
  )
}
