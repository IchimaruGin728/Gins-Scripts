// BGP tools & PeeringDB — PURE HTTP APIs
// Primary: bgp.tools bulk data files (HTTP)
// Supplementary: RIPEstat (stat.ripe.net) for real-time details
// PeeringDB REST API
import { fetch } from 'scripting'

const BGPTOOLS_UA = 'NetworkTools/1.0 (iOS Scripting App)'

// ─── bgp.tools Data Files ───

// ASN name cache (asns.csv: asn,name,class)
let asnsCache: Map<string, { name: string; cls: string }> | null = null
let asnsCacheTime = 0
const ASNS_CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function loadASNs(): Promise<Map<string, { name: string; cls: string }>> {
  if (asnsCache && Date.now() - asnsCacheTime < ASNS_CACHE_TTL) return asnsCache
  try {
    const r = await fetch('https://bgp.tools/asns.csv', {
      timeout: 30,
      headers: { 'User-Agent': BGPTOOLS_UA }
    } as any)
    if (!r.ok) throw new Error(`bgp.tools asns.csv returned ${r.status}`)
    const text = await r.text()
    const map = new Map<string, { name: string; cls: string }>()
    for (const line of text.split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue
      // Format: 13335,"Cloudflare",Transit/Access
      const m = line.match(/^(\d+),"([^"]*)",(.*)$/)
      if (m) map.set(m[1], { name: m[2], cls: m[3].trim() })
    }
    asnsCache = map
    asnsCacheTime = Date.now()
    return map
  } catch {
    return asnsCache || new Map()
  }
}

// Prefix table cache (table.jsonl: {"CIDR":"...","ASN":...,"Hits":...})
let prefixCache: Map<string, { cidr: string; asn: number; hits: number }[]> | null = null
let prefixCacheTime = 0

async function loadPrefixTable(): Promise<Map<string, { cidr: string; asn: number; hits: number }[]>> {
  if (prefixCache && Date.now() - prefixCacheTime < ASNS_CACHE_TTL) return prefixCache
  try {
    const r = await fetch('https://bgp.tools/table.jsonl', {
      timeout: 60, // longer timeout for large file
      headers: { 'User-Agent': BGPTOOLS_UA }
    } as any)
    if (!r.ok) throw new Error(`bgp.tools table.jsonl returned ${r.status}`)
    const text = await r.text()
    
    // Guard: if file is too large (>50MB), skip to avoid OOM on mobile
    if (text.length > 50 * 1024 * 1024) {
      console.warn('bgp.tools table.jsonl too large, skipping prefix cache')
      return prefixCache || new Map()
    }
    
    const map = new Map<string, { cidr: string; asn: number; hits: number }[]>()
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        const asn = String(obj.ASN)
        if (!map.has(asn)) map.set(asn, [])
        map.get(asn)!.push({ cidr: obj.CIDR || '', asn: obj.ASN || 0, hits: obj.Hits || 0 })
      } catch {}
    }
    prefixCache = map
    prefixCacheTime = Date.now()
    return map
  } catch {
    return prefixCache || new Map()
  }
}

// ── ASN Lookup (bgp.tools data + RIPEstat) ──
export interface ASNInfo {
  asn: number
  name: string
  holder: string
  cls: string         // bgp.tools class: Transit/Access, Content, Enterprise, etc.
  country: string
  registry: string
  announced: boolean
  prefixes: string[]  // from bgp.tools table.jsonl
  prefixCount: number
}

export async function asnLookup(query: string): Promise<ASNInfo> {
  const clean = query.replace(/^AS/i, '').trim()
  if (!/^\d+$/.test(clean)) throw new Error(`Invalid ASN: ${query}`)

  // Load bgp.tools data in parallel with RIPEstat
  const [asnsMap, prefixMap] = await Promise.all([loadASNs(), loadPrefixTable()])

  // bgp.tools data
  const asnEntry = asnsMap.get(clean)
  const prefixes = (prefixMap.get(clean) || []).map(p => p.cidr)

  // RIPEstat for real-time overview
  let holder = asnEntry?.name || ''
  let announced = false
  let country = ''
  try {
    const r = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=${clean}`, {
      timeout: 12, headers: { 'Accept': 'application/json' }
    } as any)
    if (r.ok) {
      const d = await r.json()
      if (d.data) {
        holder = d.data.holder || holder
        announced = d.data.announced ?? false
      }
    }
  } catch {}

  // Try to get country from RIPEstat whois
  try {
    const r = await fetch(`https://stat.ripe.net/data/whois/data.json?resource=${clean}`, {
      timeout: 12, headers: { 'Accept': 'application/json' }
    } as any)
    if (r.ok) {
      const d = await r.json()
      if (d.data?.records) {
        for (const group of d.data.records) {
          for (const rec of group) {
            if (rec.key === 'country') country = rec.value
            if (rec.key === 'OrgName' && !holder) holder = rec.value
          }
        }
      }
    }
  } catch {}

  return {
    asn: parseInt(clean),
    name: asnEntry?.name || holder || `AS${clean}`,
    holder: holder || asnEntry?.name || '',
    cls: asnEntry?.cls || '',
    country,
    registry: '',
    announced,
    prefixes,
    prefixCount: prefixes.length,
  }
}

// ── IP → ASN Lookup (bgp.tools + RIPEstat) ──
export interface IPLookupResult {
  ip: string
  asns: string[]
  prefix: string
  names: Record<string, string>
}

export async function ipLookup(ip: string): Promise<IPLookupResult> {
  const [asnsMap] = await Promise.all([loadASNs()])

  let asns: string[] = []
  let prefix = ''
  try {
    const r = await fetch(`https://stat.ripe.net/data/network-info/data.json?resource=${encodeURIComponent(ip)}`, {
      timeout: 12, headers: { 'Accept': 'application/json' }
    } as any)
    if (r.ok) {
      const d = await r.json()
      if (d.data) {
        asns = d.data.asns || []
        prefix = d.data.prefix || ''
      }
    }
  } catch {}

  const names: Record<string, string> = {}
  for (const a of asns) {
    const entry = asnsMap.get(a)
    if (entry) names[a] = entry.name
  }

  return { ip, asns, prefix, names }
}

// ── Prefix Lookup (bgp.tools data) ──
export interface PrefixEntry {
  cidr: string
  asn: number
  asnName: string
  hits: number
}

export async function prefixLookup(query: string): Promise<PrefixEntry[]> {
  const [, prefixMap] = await Promise.all([loadASNs(), loadPrefixTable()])
  const asnsMap = asnsCache || new Map()

  const results: PrefixEntry[] = []
  const clean = query.replace(/^AS/i, '').trim()

  // If it's an ASN, return its prefixes
  if (/^\d+$/.test(clean)) {
    const entries = prefixMap.get(clean) || []
    for (const e of entries) {
      results.push({ ...e, asnName: asnsMap.get(String(e.asn))?.name || '' })
    }
    return results.sort((a, b) => b.hits - a.hits)
  }

  // Otherwise search by prefix/CIDR substring
  for (const [, entries] of prefixMap) {
    for (const e of entries) {
      if (e.cidr.includes(query.trim())) {
        results.push({ ...e, asnName: asnsMap.get(String(e.asn))?.name || '' })
        if (results.length >= 50) return results
      }
    }
  }
  return results.sort((a, b) => b.hits - a.hits)
}

// ── ASN Neighbours (BGP Peering — RIPEstat) ──
export interface ASNNeighbour {
  asn: number
  name: string
  type: 'left' | 'right' | 'uncertain'
  power: number
  v4_peers: number
  v6_peers: number
}

export interface ASNNeighboursData {
  resource: string
  counts: { left: number; right: number; unique: number; uncertain: number }
  neighbours: ASNNeighbour[]
}

export async function asnNeighbours(asn: string): Promise<ASNNeighboursData> {
  const clean = asn.replace(/^AS/i, '').trim()
  const [asnsMap] = await Promise.all([loadASNs()])

  try {
    const r = await fetch(`https://stat.ripe.net/data/asn-neighbours/data.json?resource=${clean}`, {
      timeout: 15, headers: { 'Accept': 'application/json' }
    } as any)
    if (!r.ok) throw new Error(`RIPEstat returned ${r.status}`)
    const d = await r.json()
    if (!d.data) throw new Error('No data')

    return {
      resource: d.data.resource || clean,
      counts: d.data.neighbour_counts || { left: 0, right: 0, unique: 0, uncertain: 0 },
      neighbours: (d.data.neighbours || []).map((n: any) => ({
        asn: n.asn || 0,
        name: asnsMap.get(String(n.asn))?.name || `AS${n.asn}`,
        type: n.type || 'uncertain',
        power: n.power || 0,
        v4_peers: n.v4_peers || 0,
        v6_peers: n.v6_peers || 0,
      })),
    }
  } catch (e: any) {
    return {
      resource: clean,
      counts: { left: 0, right: 0, unique: 0, uncertain: 0 },
      neighbours: [],
    }
  }
}

// ── Announced Prefixes (RIPEstat) ──
export interface AnnouncedPrefix {
  prefix: string
}

export async function announcedPrefixes(asn: string): Promise<AnnouncedPrefix[]> {
  const clean = asn.replace(/^AS/i, '').trim()
  try {
    const r = await fetch(`https://stat.ripe.net/data/announced-prefixes/data.json?resource=${clean}`, {
      timeout: 15, headers: { 'Accept': 'application/json' }
    } as any)
    if (!r.ok) return []
    const d = await r.json()
    return (d.data?.prefixes || []).map((p: any) => ({ prefix: p.prefix || '' }))
  } catch { return [] }
}

// ── Whois Records (RIPEstat) ──
export interface WhoisField {
  key: string
  value: string
}

export async function whoisRecords(resource: string): Promise<WhoisField[]> {
  try {
    const r = await fetch(`https://stat.ripe.net/data/whois/data.json?resource=${encodeURIComponent(resource)}`, {
      timeout: 12, headers: { 'Accept': 'application/json' }
    } as any)
    if (!r.ok) return []
    const d = await r.json()
    const records: WhoisField[] = []
    if (d.data?.records) {
      for (const group of d.data.records) {
        if (Array.isArray(group)) {
          for (const rec of group) {
            if (rec.key && rec.value) records.push({ key: rec.key, value: rec.value })
          }
        }
      }
    }
    return records
  } catch { return [] }
}

// ── Tags (bgp.tools) ──
export async function loadTags(): Promise<Array<{ name: string; count: number }>> {
  try {
    const r = await fetch('https://bgp.tools/tags.txt', {
      timeout: 20,
      headers: { 'User-Agent': BGPTOOLS_UA }
    } as any)
    if (!r.ok) return []
    const text = await r.text()
    const tags: Array<{ name: string; count: number }> = []
    for (const line of text.split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue
      const parts = line.split(',')
      if (parts.length >= 2) {
        tags.push({ name: parts[0].trim(), count: parseInt(parts[1]) || 0 })
      }
    }
    return tags.sort((a, b) => b.count - a.count)
  } catch { return [] }
}

export async function loadTagMembers(tag: string): Promise<Array<{ asn: string; name: string }>> {
  try {
    const r = await fetch(`https://bgp.tools/tags/${encodeURIComponent(tag)}.csv`, {
      timeout: 20,
      headers: { 'User-Agent': BGPTOOLS_UA }
    } as any)
    if (!r.ok) return []
    const text = await r.text()
    const members: Array<{ asn: string; name: string }> = []
    for (const line of text.split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue
      const m = line.match(/^(\d+),"([^"]*)"/)
      if (m) members.push({ asn: m[1], name: m[2] })
    }
    return members
  } catch { return [] }
}

// ─── PeeringDB (Full API) ───

const PEERINGDB_BASE = 'https://www.peeringdb.com/api'
const pdbCache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000

async function pdbFetch(url: string): Promise<any> {
  const cached = pdbCache.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  try {
    const r = await fetch(url, {
      timeout: 12,
      headers: { 'User-Agent': 'NetworkTools/1.0' }
    } as any)
    if (!r.ok) return null
    const d = await r.json()
    pdbCache.set(url, { data: d, ts: Date.now() })
    return d
  } catch { return null }
}

export interface PeeringDBNet {
  id: number; name: string; asn: number; aka?: string; website?: string
  info_type?: string; info_traffic?: string; info_ratio?: string; info_scope?: string
  info_prefixes4?: number; info_prefixes6?: number
  info_unicast?: boolean; info_multicast?: boolean; info_ipv6?: boolean
  notes?: string; irr_as_set?: string; policy_url?: string
  ix_count?: number; fac_count?: number
  looking_glass?: string; route_server?: string
  org?: any; org_id?: number; status?: string
}

export async function peeringDBSearchNet(query: string): Promise<PeeringDBNet[]> {
  let url: string
  if (/^\d+$/.test(query)) url = `${PEERINGDB_BASE}/net?asn=${query}&depth=1`
  else url = `${PEERINGDB_BASE}/net?name__contains=${encodeURIComponent(query)}&depth=1`
  const d = await pdbFetch(url)
  return d?.data || []
}

export async function peeringDBGetNetIXLan(netId: number): Promise<any[]> {
  const d = await pdbFetch(`${PEERINGDB_BASE}/netixlan?net_id=${netId}&depth=1`)
  return d?.data || []
}

export interface PeeringDBIX {
  id: number; name: string; aka?: string; website?: string
  city?: string; country?: string; region_continent?: string; media?: string
  tech_email?: string; tech_phone?: string; notes?: string
  proto_unicast?: boolean; proto_multicast?: boolean; proto_ipv6?: boolean
  org?: any; org_id?: number; status?: string
}

export async function peeringDBSearchIX(query: string): Promise<PeeringDBIX[]> {
  let url: string
  if (/^\d+$/.test(query)) url = `${PEERINGDB_BASE}/ix?id=${query}&depth=1`
  else url = `${PEERINGDB_BASE}/ix?name__contains=${encodeURIComponent(query)}&depth=1`
  const d = await pdbFetch(url)
  return d?.data || []
}

export interface PeeringDBFac {
  id: number; name: string; aka?: string; website?: string
  address1?: string; address2?: string; city?: string; state?: string
  zipcode?: string; country?: string; continent?: string
  longitude?: number; latitude?: number; clli?: string; notes?: string
  org?: any; org_id?: number; status?: string
}

export async function peeringDBSearchFac(query: string): Promise<PeeringDBFac[]> {
  let url: string
  if (/^\d+$/.test(query)) url = `${PEERINGDB_BASE}/fac?id=${query}&depth=1`
  else url = `${PEERINGDB_BASE}/fac?name__contains=${encodeURIComponent(query)}&depth=1`
  const d = await pdbFetch(url)
  return d?.data || []
}

export interface PeeringDBCarrier {
  id: number; name: string; aka?: string; website?: string
  notes?: string; org?: any; org_id?: number; status?: string
}

export async function peeringDBSearchCarrier(query: string): Promise<PeeringDBCarrier[]> {
  const url = `${PEERINGDB_BASE}/carrier?name__contains=${encodeURIComponent(query)}&depth=1`
  const d = await pdbFetch(url)
  return d?.data || []
}

export interface PeeringDBOrg {
  id: number; name: string; aka?: string; website?: string
  address1?: string; address2?: string; city?: string; country?: string
  notes?: string; status?: string
}

export async function peeringDBSearchOrg(query: string): Promise<PeeringDBOrg[]> {
  const url = `${PEERINGDB_BASE}/org?name__contains=${encodeURIComponent(query)}&depth=1`
  const d = await pdbFetch(url)
  return d?.data || []
}

export interface PeeringDBSearchResults {
  networks: PeeringDBNet[]
  ixps: PeeringDBIX[]
  facilities: PeeringDBFac[]
  carriers: PeeringDBCarrier[]
  organizations: PeeringDBOrg[]
}

export async function peeringDBSearchAll(query: string): Promise<PeeringDBSearchResults> {
  const [networks, ixps, facilities, carriers, organizations] = await Promise.all([
    peeringDBSearchNet(query),
    peeringDBSearchIX(query),
    peeringDBSearchFac(query),
    peeringDBSearchCarrier(query),
    peeringDBSearchOrg(query),
  ])
  return { networks, ixps, facilities, carriers, organizations }
}

// ── Utility ──
export function formatTrafficLevel(level?: string): string {
  const levels: Record<string, string> = {
    '0-20Mbps': '< 20 Mbps', '20-100Mbps': '20-100 Mbps',
    '100-1000Mbps': '100 Mbps - 1 Gbps', '1-5Gbps': '1-5 Gbps',
    '5-10Gbps': '5-10 Gbps', '10-20Gbps': '10-20 Gbps',
    '20-50Gbps': '20-50 Gbps', '50-100Gbps': '50-100 Gbps',
    '100-200Gbps': '100-200 Gbps', '200-300Gbps': '200-300 Gbps',
    '300-500Gbps': '300-500 Gbps', '500-1000Gbps': '500 Gbps - 1 Tbps',
    '1-5Tbps': '1-5 Tbps', '5-10Tbps': '5-10 Tbps',
    '10-20Tbps': '10-20 Tbps', '20-50Tbps': '20-50 Tbps',
    '50-100Tbps': '50-100 Tbps', '>100Tbps': '> 100 Tbps',
  }
  return level ? (levels[level] || level) : 'Unknown'
}
