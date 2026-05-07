import { fetch } from 'scripting'

const GRAFANA_BASE = 'https://ping.nxtrace.org'
const DS_UID = 'cdjc4dwosc83kb'
const PROM_QUERY = `${GRAFANA_BASE}/api/datasources/proxy/uid/${DS_UID}/api/v1/query`

export type GrafanaDashboardItem = {
  uid: string
  title: string
  url: string
  type: 'dash-db' | 'dash-folder'
  tags: string[]
  description?: string
}

export type CuratedGrafanaDashboard = {
  key: string
  uid: string
  title: string
  subtitle: string
  kind: 'icmp' | 'tcp' | 'mtr'
  group: string
  tagColor: string
  jobRegex?: string
}

export type GrafanaSnapshot = {
  key: string
  title: string
  kind: 'icmp' | 'tcp' | 'mtr'
  total: number
  up: number
  down: number
  avgMs: number | null
  bestMs: number | null
  worstMs: number | null
  lossAvg?: number | null
  points: Array<{ label: string; value: number; extra?: string }>
}

export interface NXTraceHop {
  ttl: number
  path: string
  target: string
  meanMs: number | null
  loss: number | null
  bestMs: number | null
  worstMs: number | null
  jitterMs: number | null
}

export const CURATED_GRAFANA_DASHBOARDS: CuratedGrafanaDashboard[] = [
  { key: 'icmp_aio', uid: '-H1Dej0Vz', title: 'ICMP PROBE AIO', subtitle: 'All ICMP probes', kind: 'icmp', group: 'AIO', tagColor: '#007AFF' },
  { key: 'tcp_aio', uid: 'o5gE6I0Sz', title: 'TCP PROBE AIO', subtitle: 'All TCP probes', kind: 'tcp', group: 'AIO', tagColor: '#FF9500' },
  { key: 'three_icmp_v2', uid: 'bdvog263hhr0gc', title: '三网 ICMP v2', subtitle: '三网 ICMP 监测', kind: 'icmp', group: '三网', tagColor: '#34C759', jobRegex: '.*(CM|CU|CT).*' },
  { key: 'three_mtr', uid: 'GGIdNh9Wz', title: '三网 MTR 探测', subtitle: 'MTR hop path', kind: 'mtr', group: '三网', tagColor: '#5856D6', jobRegex: '.*_mtr' },
  { key: 'three_tcp', uid: 'adpkl567ez280a', title: '三网 TCP v1', subtitle: '三网 TCP 监测', kind: 'tcp', group: '三网', tagColor: '#FF2D55', jobRegex: '.*(CM|CU|CT).*' },
  { key: 'global_ctg', uid: 'fdxa0ekumaa68e', title: '全球 163/CN2/CTG', subtitle: 'CTG / CN2 / 163 ICMP', kind: 'icmp', group: '全球', tagColor: '#AF52DE', jobRegex: '.*(CTG|CN2|163).*' },
  { key: 'global_cmi', uid: 'fdx96p1nc25fke', title: '全球 CMI/CMIN2', subtitle: 'CMI 全球状态', kind: 'icmp', group: '全球', tagColor: '#30D158', jobRegex: '.*CMI.*' },
  { key: 'global_cug', uid: 'beapz0e2sc9ogc', title: '全球 CUG', subtitle: 'CUG 全球状态', kind: 'icmp', group: '全球', tagColor: '#FFD60A', jobRegex: '.*CUG.*' },
]

function promQueryUrl(query: string): string {
  return `${PROM_QUERY}?query=${encodeURIComponent(query)}`
}

async function promQuery(query: string): Promise<any[]> {
  const r = await fetch(promQueryUrl(query), { timeout: 15 } as any)
  if (!r.ok) throw new Error(`Grafana/Prometheus HTTP ${r.status}`)
  const d = await r.json()
  if (d.status !== 'success') throw new Error(d.error || 'Prometheus query failed')
  return d.data?.result || []
}

function secondsToMs(value: any): number | null {
  const n = Number(value)
  if (!isFinite(n)) return null
  return Math.round(n * 1000 * 10) / 10
}

function num(value: any): number | null {
  const n = Number(value)
  return isFinite(n) ? n : null
}

function seriesLabel(metric: any): string {
  return String(metric?.target || metric?.instance || metric?.job || metric?.path || 'unknown')
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}

export async function getGrafanaDashboards(): Promise<GrafanaDashboardItem[]> {
  const [dbRes, folderRes] = await Promise.all([
    fetch(`${GRAFANA_BASE}/api/search?type=dash-db`, { timeout: 15 } as any),
    fetch(`${GRAFANA_BASE}/api/search?type=dash-folder`, { timeout: 15 } as any),
  ])
  if (!dbRes.ok) throw new Error(`Dashboards API HTTP ${dbRes.status}`)
  if (!folderRes.ok) throw new Error(`Folders API HTTP ${folderRes.status}`)
  const dbs = await dbRes.json()
  const folders = await folderRes.json()
  const normalize = (item: any): GrafanaDashboardItem => ({
    uid: String(item.uid || ''),
    title: String(item.title || ''),
    url: String(item.url || ''),
    type: item.type === 'dash-folder' ? 'dash-folder' : 'dash-db',
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    description: item.description ? String(item.description) : undefined,
  })
  return [...(folders || []).map(normalize), ...(dbs || []).map(normalize)]
}

export async function getNXTraceSources(): Promise<string[]> {
  const rows = await promQuery('mtr_up')
  return [...new Set(rows.map(r => r.metric?.job).filter(Boolean))].sort()
}

export async function getNXTraceTargets(source: string): Promise<string[]> {
  const rows = await promQuery(`mtr_hops{job="${source.replace(/"/g, '\\"')}"}`)
  return [...new Set(rows.map(r => r.metric?.name).filter(Boolean))].sort()
}

export async function getNXTraceMTR(source: string, target: string): Promise<NXTraceHop[]> {
  const escSource = source.replace(/"/g, '\\"')
  const escTarget = target.replace(/"/g, '\\"')
  const base = `job="${escSource}",name="${escTarget}"`
  const [mean, loss, best, worst, jitter] = await Promise.all([
    promQuery(`mtr_rtt_seconds{${base},type="mean"}`),
    promQuery(`mtr_rtt_seconds{${base},type="loss"}`),
    promQuery(`mtr_rtt_seconds{${base},type="best"}`),
    promQuery(`mtr_rtt_seconds{${base},type="worst"}`),
    promQuery(`mtr_rtt_seconds{${base},type="range"}`),
  ])
  const map = new Map<number, NXTraceHop>()
  function ensure(r: any): NXTraceHop {
    const ttl = Number(r.metric?.ttl || 0)
    const existing = map.get(ttl)
    if (existing) return existing
    const hop: NXTraceHop = {
      ttl,
      path: r.metric?.path || '*',
      target: r.metric?.target || '',
      meanMs: null,
      loss: null,
      bestMs: null,
      worstMs: null,
      jitterMs: null,
    }
    map.set(ttl, hop)
    return hop
  }
  for (const r of mean) ensure(r).meanMs = secondsToMs(r.value?.[1])
  for (const r of best) ensure(r).bestMs = secondsToMs(r.value?.[1])
  for (const r of worst) ensure(r).worstMs = secondsToMs(r.value?.[1])
  for (const r of jitter) ensure(r).jitterMs = secondsToMs(r.value?.[1])
  for (const r of loss) {
    const n = Number(r.value?.[1])
    ensure(r).loss = isFinite(n) ? Math.round(n * 100 * 10) / 10 : null
  }
  return [...map.values()].filter(h => h.ttl > 0).sort((a, b) => a.ttl - b.ttl)
}

export async function getGrafanaSnapshot(def: CuratedGrafanaDashboard): Promise<GrafanaSnapshot> {
  const regex = def.jobRegex ? `,job=~"${def.jobRegex}"` : ''
  if (def.kind === 'mtr') {
    const rows = await promQuery(`mtr_up{job=~"${def.jobRegex || '.*_mtr'}"}`)
    const labels = rows.slice(0, 8).map((r: any) => ({ label: seriesLabel(r.metric).replace(/_mtr$/, ''), value: 1, extra: 'up' }))
    const up = rows.filter((r: any) => num(r.value?.[1]) === 1).length
    return {
      key: def.key,
      title: def.title,
      kind: def.kind,
      total: rows.length,
      up,
      down: Math.max(0, rows.length - up),
      avgMs: null,
      bestMs: null,
      worstMs: null,
      points: labels,
    }
  }

  if (def.kind === 'icmp') {
    const [successRows, rttRows, lossRows] = await Promise.all([
      promQuery(`probe_success{instance!=""${regex}}`),
      promQuery(`probe_icmp_duration_seconds{phase="rtt"${regex}}`),
      promQuery(`ping_loss_ratio{target!=""${regex}}`),
    ])
    const successMap = new Map<string, number>()
    for (const r of successRows) successMap.set(seriesLabel(r.metric), num(r.value?.[1]) || 0)
    const rtts = rttRows.map((r: any) => ({ label: seriesLabel(r.metric), value: secondsToMs(r.value?.[1]) || 0 }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value)
    const losses = new Map<string, number>()
    for (const r of lossRows) losses.set(seriesLabel(r.metric), Math.round((num(r.value?.[1]) || 0) * 1000) / 10)
    const top = rtts.slice(0, 8).map(x => ({ label: x.label, value: x.value, extra: `${losses.get(x.label) || 0}% loss` }))
    const vals = rtts.map(x => x.value)
    const up = [...successMap.values()].filter(v => v >= 1).length
    return {
      key: def.key,
      title: def.title,
      kind: def.kind,
      total: successMap.size || rttRows.length,
      up,
      down: Math.max(0, (successMap.size || rttRows.length) - up),
      avgMs: avg(vals),
      bestMs: vals.length ? Math.min(...vals) : null,
      worstMs: vals.length ? Math.max(...vals) : null,
      lossAvg: avg([...losses.values()]),
      points: top,
    }
  }

  const [successRows, durRows] = await Promise.all([
    promQuery(`probe_success{instance!=""${regex}}`),
    promQuery(`probe_duration_seconds{instance!=""${regex}}`),
  ])
  const successMap = new Map<string, number>()
  for (const r of successRows) successMap.set(seriesLabel(r.metric), num(r.value?.[1]) || 0)
  const durs = durRows.map((r: any) => ({ label: seriesLabel(r.metric), value: secondsToMs(r.value?.[1]) || 0 }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value)
  const top = durs.slice(0, 8)
  const vals = durs.map(x => x.value)
  const up = [...successMap.values()].filter(v => v >= 1).length
  return {
    key: def.key,
    title: def.title,
    kind: def.kind,
    total: successMap.size || durRows.length,
    up,
    down: Math.max(0, (successMap.size || durRows.length) - up),
    avgMs: avg(vals),
    bestMs: vals.length ? Math.min(...vals) : null,
    worstMs: vals.length ? Math.max(...vals) : null,
    points: top,
  }
}
