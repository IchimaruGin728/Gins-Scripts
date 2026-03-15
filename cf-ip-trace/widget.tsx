import {
  Widget,
  VStack,
  HStack,
  Text,
  Spacer,
  fetch,
  Color,
} from "scripting"

interface TraceInfo {
  ip: string
  ts: string
  visit_scheme: string
  uag: string
  colo: string
  sliver: string
  http: string
  loc: string
  tls: string
  sni: string
  warp: string
  gateway: string
  rbi: string
  kex: string
}

interface SpeedResult {
  rttMs: number
  downloadKbps: number
}

async function fetchTrace(): Promise<{ info: TraceInfo; speed: SpeedResult }> {
  const t0 = Date.now()
  const res = await fetch("https://cloudflare.com/cdn-cgi/trace")
  const rttMs = Date.now() - t0

  const text = await res.text()
  const obj: Record<string, string> = {}
  for (const line of text.trim().split("\n")) {
    const eq = line.indexOf("=")
    if (eq > 0) obj[line.slice(0, eq)] = line.slice(eq + 1)
  }

  let downloadKbps = 0
  try {
    const dlT0 = Date.now()
    const dlRes = await fetch("https://speed.cloudflare.com/__down?bytes=102400")
    await dlRes.arrayBuffer()
    const dlMs = Date.now() - dlT0
    downloadKbps = Math.round((102400 * 8) / (dlMs / 1000) / 1000)
  } catch (_e) {
    // speed test failure won't break main info
  }

  return {
    info: obj as unknown as TraceInfo,
    speed: { rttMs, downloadKbps },
  }
}

const coloCity: Record<string, string> = {
  NRT: "东京", LAX: "洛杉矶", SJC: "圣何塞", SIN: "新加坡",
  HKG: "香港", LHR: "伦敦", CDG: "巴黎", FRA: "法兰克福",
  ORD: "芝加哥", IAD: "华盛顿", SEA: "西雅图", SYD: "悉尼",
  ICN: "首尔", TPE: "台北", SHA: "上海", PEK: "北京",
  KIX: "大阪", CAN: "广州", CTU: "成都", WUH: "武汉",
  XMN: "厦门", CGQ: "长春", HAK: "海口", TYO: "东京2",
  MNL: "马尼拉", BKK: "曼谷", KUL: "吉隆坡", CGK: "雅加达",
  DXB: "迪拜", AMS: "阿姆斯特丹", MAD: "马德里", MXP: "米兰",
  EWR: "纽约", ATL: "亚特兰大", DFW: "达拉斯", MIA: "迈阿密",
  YYZ: "多伦多", GRU: "圣保罗", SCL: "圣地亚哥", BOG: "波哥大",
  JNB: "约翰内斯堡", CPT: "开普敦", NBO: "内罗毕",
}

function rttColor(ms: number): Color {
  if (ms < 80) return "#22C55E"
  if (ms < 200) return "#F59E0B"
  return "#EF4444"
}

function speedColor(kbps: number): Color {
  if (kbps > 50000) return "#22C55E"
  if (kbps > 10000) return "#84CC16"
  if (kbps > 1000) return "#F59E0B"
  return "#EF4444"
}

function formatSpeed(kbps: number): string {
  if (kbps <= 0) return "—"
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`
  return `${kbps} Kbps`
}

async function render() {
  const reloadPolicy = {
    policy: "after" as const,
    date: new Date(Date.now() + 15 * 60 * 1000),
  }

  try {
    const { info, speed } = await fetchTrace()
    const city = coloCity[info.colo] ?? info.colo
    const warpActive = info.warp === "on"
    const gatewayActive = info.gateway === "on"

    Widget.present(
      <VStack
        padding={16}
        spacing={10}
        frame={{ minWidth: 0, maxWidth: Infinity }}
      >
        {/* 标题 */}
        <HStack spacing={6}>
          <Text font={11} fontWeight="bold" foregroundStyle="#F6821F">
            ◆ CF IP · SPEED
          </Text>
          <Spacer />
          <Text font={10} foregroundStyle="secondaryLabel">{info.loc}</Text>
        </HStack>

        {/* IP */}
        <VStack spacing={2}>
          <Text font={10} foregroundStyle="secondaryLabel">当前 IP</Text>
          <Text font={15} fontWeight="semibold" foregroundStyle="label">
            {info.ip}
          </Text>
        </VStack>

        {/* 数据中心 & 协议 */}
        <HStack spacing={16}>
          <VStack spacing={2}>
            <Text font={10} foregroundStyle="secondaryLabel">接入节点</Text>
            <Text font={13} fontWeight="medium" foregroundStyle="#F6821F">
              {info.colo} · {city}
            </Text>
          </VStack>
          <VStack spacing={2}>
            <Text font={10} foregroundStyle="secondaryLabel">协议</Text>
            <Text font={12} foregroundStyle="#3B82F6">
              {info.http} / {info.tls}
            </Text>
          </VStack>
        </HStack>

        {/* 速度指标 */}
        <HStack spacing={12}>
          <VStack spacing={2}>
            <Text font={10} foregroundStyle="secondaryLabel">延迟 RTT</Text>
            <HStack spacing={3}>
              <Text font={14} fontWeight="semibold" foregroundStyle={rttColor(speed.rttMs)}>
                {speed.rttMs}
              </Text>
              <Text font={10} foregroundStyle="secondaryLabel">ms</Text>
            </HStack>
          </VStack>

          <VStack spacing={2}>
            <Text font={10} foregroundStyle="secondaryLabel">下载速率</Text>
            <Text font={14} fontWeight="semibold" foregroundStyle={speedColor(speed.downloadKbps)}>
              {formatSpeed(speed.downloadKbps)}
            </Text>
          </VStack>

          <Spacer />

          <VStack spacing={4}>
            <HStack spacing={4}>
              <Text font={10} foregroundStyle="secondaryLabel">WARP</Text>
              <Text font={10} foregroundStyle={warpActive ? "#22C55E" : "tertiaryLabel"}>
                {warpActive ? "ON" : "OFF"}
              </Text>
            </HStack>
            <HStack spacing={4}>
              <Text font={10} foregroundStyle="secondaryLabel">GW</Text>
              <Text font={10} foregroundStyle={gatewayActive ? "#22C55E" : "tertiaryLabel"}>
                {gatewayActive ? "ON" : "OFF"}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </VStack>,
      reloadPolicy
    )
  } catch (e) {
    Widget.present(
      <VStack padding={16} spacing={4}>
        <Text font={11} fontWeight="bold" foregroundStyle="#F6821F">◆ CF IP · SPEED</Text>
        <Text font={12} foregroundStyle="#ff4444">获取失败</Text>
        <Text font={10} foregroundStyle="secondaryLabel">{String(e)}</Text>
      </VStack>,
      reloadPolicy
    )
  }
}

render()
