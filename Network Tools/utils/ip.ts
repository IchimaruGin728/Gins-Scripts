// IP Information multi-source aggregator
import { fetch } from 'scripting'

export interface IPInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  country_name?: string
  countryCode?: string
  loc?: string
  latitude?: number
  longitude?: number
  org?: string
  asn?: string
  asname?: string
  isp?: string
  postal?: string
  timezone?: string
  utc_offset?: string
  network?: string
  version?: string
  mobile?: boolean
  proxy?: boolean
  hosting?: boolean
  currency?: string
  languages?: string
  calling_code?: string
  source: string
  raw?: any
}

export interface CloudflareTrace {
  ip: string
  colo: string
  tls: string
  http: string
  loc: string
  warp: string
  kex: string
  ts: string
  visit_scheme: string
}

// Parse Cloudflare trace (key=value lines)
export function parseCloudflareTrace(text: string): CloudflareTrace {
  const lines = text.trim().split('\n')
  const data: any = {}
  for (const line of lines) {
    const [key, ...rest] = line.split('=')
    if (key) data[key.trim()] = rest.join('=').trim()
  }
  return {
    ip: data.ip || '',
    colo: data.colo || '',
    tls: data.tls || '',
    http: data.http || '',
    loc: data.loc || '',
    warp: data.warp || '',
    kex: data.kex || '',
    ts: data.ts || '',
    visit_scheme: data.visit_scheme || '',
  }
}

// ─── Local Network Info ───
export interface LocalNetworkInfo {
  name: string
  address: string
  family: 'IPv4' | 'IPv6'
  netmask: string | null
  mac: string | null
  isInternal: boolean
  cidr: string | null
}

/**
 * Get local network interface info via Device.networkInterfaces().
 * Returns only non-internal (external) interfaces by default.
 */
export function getLocalNetworkInfo(includeInternal: boolean = false): LocalNetworkInfo[] {
  const interfaces = Device.networkInterfaces()
  const result: LocalNetworkInfo[] = []
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const iface of addrs) {
      if (!includeInternal && iface.isInternal) continue
      result.push({
        name,
        address: iface.address,
        family: iface.family,
        netmask: iface.netmask,
        mac: iface.mac,
        isInternal: iface.isInternal,
        cidr: iface.cidr,
      })
    }
  }
  return result
}

// ─── Caching helpers (Storage, 5-minute TTL) ───
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_PREFIX = 'ip_cache_'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCached<T>(key: string): T | null {
  try {
    const entry = Storage.get<CacheEntry<T>>(CACHE_PREFIX + key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      Storage.remove(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch { return null }
}

function setCache<T>(key: string, data: T): void {
  try {
    Storage.set<CacheEntry<T>>(CACHE_PREFIX + key, {
      data,
      timestamp: Date.now(),
    })
  } catch { /* ignore storage errors */ }
}

// Fetch from ipinfo.io
export async function fetchIPInfo(): Promise<IPInfo | null> {
  const cached = getCached<IPInfo>('ipinfo')
  if (cached) return cached
  try {
    const resp = await fetch('https://ipinfo.io/json', { timeout: 8 })
    if (!resp.ok) return null
    const d = await resp.json()
    const [lat, lon] = (d.loc || '').split(',').map(Number)
    const result: IPInfo = {
      ip: d.ip || '',
      city: d.city,
      region: d.region,
      country: d.country,
      loc: d.loc,
      latitude: lat,
      longitude: lon,
      org: d.org,
      postal: d.postal,
      timezone: d.timezone,
      source: 'ipinfo.io',
      raw: d,
    }
    setCache('ipinfo', result)
    return result
  } catch { return null }
}

// Fetch from ipapi.co (richest free data)
export async function fetchIPApiCo(ip?: string): Promise<IPInfo | null> {
  const cacheKey = `ipapi_${ip || 'self'}`
  const cached = getCached<IPInfo>(cacheKey)
  if (cached) return cached
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
    const resp = await fetch(url, { timeout: 8 })
    if (!resp.ok) return null
    const d = await resp.json()
    const result: IPInfo = {
      ip: d.ip || '',
      city: d.city,
      region: d.region,
      country: d.country,
      country_name: d.country_name,
      countryCode: d.country_code,
      latitude: d.latitude,
      longitude: d.longitude,
      org: d.org,
      asn: d.asn,
      postal: d.postal,
      timezone: d.timezone,
      utc_offset: d.utc_offset,
      network: d.network,
      version: d.version,
      currency: d.currency,
      languages: d.languages,
      calling_code: d.country_calling_code,
      source: 'ipapi.co',
      raw: d,
    }
    setCache(cacheKey, result)
    return result
  } catch { return null }
}

// Fetch from ip-api.com (has VPN/proxy detection)
export async function fetchIPAPICom(ip?: string): Promise<IPInfo | null> {
  const cacheKey = `ipapicom_${ip || 'self'}`
  const cached = getCached<IPInfo>(cacheKey)
  if (cached) return cached
  try {
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=66846719`
      : 'http://ip-api.com/json/?fields=66846719'
    const resp = await fetch(url, { timeout: 8, allowInsecureRequest: true })
    if (!resp.ok) return null
    const d = await resp.json()
    if (d.status === 'fail') return null
    const result: IPInfo = {
      ip: d.query || '',
      city: d.city,
      region: d.regionName,
      country: d.country,
      countryCode: d.countryCode,
      latitude: d.lat,
      longitude: d.lon,
      org: d.org,
      isp: d.isp,
      asn: d.as,
      asname: d.asname,
      postal: d.zip,
      timezone: d.timezone,
      mobile: d.mobile,
      proxy: d.proxy,
      hosting: d.hosting,
      source: 'ip-api.com',
      raw: d,
    }
    setCache(cacheKey, result)
    return result
  } catch { return null }
}

// Fetch from ipwho.is
export async function fetchIPWhoIs(ip?: string): Promise<IPInfo | null> {
  const cacheKey = `ipwhois_${ip || 'self'}`
  const cached = getCached<IPInfo>(cacheKey)
  if (cached) return cached
  try {
    const url = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/'
    const resp = await fetch(url, { timeout: 8 })
    if (!resp.ok) return null
    const d = await resp.json()
    if (!d.success) return null
    const result: IPInfo = {
      ip: d.ip || '',
      city: d.city,
      region: d.region,
      country: d.country,
      country_name: d.country,
      countryCode: d.country_code,
      latitude: d.latitude,
      longitude: d.longitude,
      org: d.connection?.org,
      asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
      isp: d.connection?.isp,
      postal: d.postal,
      timezone: d.timezone?.id,
      utc_offset: d.timezone?.utc,
      calling_code: d.calling_code,
      source: 'ipwho.is',
      raw: d,
    }
    setCache(cacheKey, result)
    return result
  } catch { return null }
}

// Fetch Cloudflare trace
export async function fetchCloudflareTrace(): Promise<CloudflareTrace | null> {
  const cached = getCached<CloudflareTrace>('cftrace')
  if (cached) return cached
  try {
    const resp = await fetch('https://1.1.1.1/cdn-cgi/trace', { timeout: 5 })
    if (!resp.ok) return null
    const text = await resp.text()
    const result = parseCloudflareTrace(text)
    setCache('cftrace', result)
    return result
  } catch { return null }
}

// Fetch ALL sources in parallel (with aggregated cache)
export async function fetchAllIPSources(ip?: string, forceRefresh: boolean = false): Promise<{
  ipinfo: IPInfo | null
  ipapi: IPInfo | null
  ipapiCom: IPInfo | null
  ipwhois: IPInfo | null
  cfTrace: CloudflareTrace | null
}> {
  const cacheKey = `all_${ip || 'self'}`
  if (!forceRefresh) {
    const cached = getCached<{
      ipinfo: IPInfo | null
      ipapi: IPInfo | null
      ipapiCom: IPInfo | null
      ipwhois: IPInfo | null
      cfTrace: CloudflareTrace | null
    }>(cacheKey)
    if (cached) return cached
  }
  const [ipinfo, ipapi, ipapiCom, ipwhois, cfTrace] = await Promise.all([
    fetchIPInfo(),
    fetchIPApiCo(ip),
    fetchIPAPICom(ip),
    fetchIPWhoIs(ip),
    fetchCloudflareTrace(),
  ])
  const result = { ipinfo, ipapi, ipapiCom, ipwhois, cfTrace }
  setCache(cacheKey, result)
  return result
}

// Risk assessment based on ISP/org data
export function calculateRisk(info: IPInfo): {
  risk: number
  isVPN: boolean
  isNative: boolean
  isHomeBroadband: boolean
  riskLabel: string
} {
  let risk = 10
  const text = `${info.isp || ''} ${info.org || ''} ${info.asname || ''}`.toLowerCase()
  
  const dcKeywords = ['amazon', 'google', 'cloud', 'azure', 'alibaba', 'tencent', 
    'digitalocean', 'ovh', 'hetzner', 'linode', 'vultr', 'idc', 'datacenter', 
    'hosting', 'cloudflare', 'dmit', 'choopa', 'vultr', 'rackspace']
  const homeKeywords = ['telecom', 'broadband', 'cable', 'fiber', 'mobile', 
    'starhub', 'singtel', 'comcast', 'verizon', 'att', '电信', '移动', '联通', 
    '宽带', '家庭', 'chinanet', 'cablevision', 'rogers', 'telus']
  
  const isDC = dcKeywords.some(kw => text.includes(kw))
  const isHome = homeKeywords.some(kw => text.includes(kw))
  
  if (isDC) risk += 50
  if (isHome) risk -= 15
  if (info.hosting) risk += 30
  if (info.proxy) risk += 40
  if (info.mobile) risk -= 5
  
  risk = Math.max(0, Math.min(100, risk))
  
  return {
    risk,
    isVPN: isDC || !!info.hosting || !!info.proxy,
    isNative: risk < 50,
    isHomeBroadband: isHome,
    riskLabel: risk > 60 ? 'High' : risk > 30 ? 'Medium' : 'Low',
  }
}
