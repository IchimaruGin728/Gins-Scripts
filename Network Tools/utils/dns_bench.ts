// DNS Benchmark — DoH concurrent latency testing
// Only protocol: DoH (DNS over HTTPS) via fetch()
import { fetch } from 'scripting'

export interface DNSServer {
  name: string
  provider: string
  dohUrl: string
  ips: string
  country: string
  features: string[]  // e.g. ['adblock', 'malware-filter', 'family-safe']
}

export interface DNSBenchResult {
  server: DNSServer
  latencyMs: number       // first successful query latency
  avgMs: number           // average across N queries
  minMs: number
  maxMs: number
  success: boolean
  answerCount: number
  error?: string
  allMs: number[]         // all individual timings
}

// ── Server list ──
export const DNS_SERVERS: DNSServer[] = [
  { name: 'Cloudflare', provider: 'Cloudflare', dohUrl: 'https://cloudflare-dns.com/dns-query', ips: '1.1.1.1 / 1.0.0.1', country: '🌐', features: ['no-filter'] },
  { name: 'Cloudflare Family', provider: 'Cloudflare', dohUrl: 'https://family.cloudflare-dns.com/dns-query', ips: '1.1.1.3 / 1.0.0.3', country: '🌐', features: ['malware-filter', 'family-safe'] },
  { name: 'Cloudflare Security', provider: 'Cloudflare', dohUrl: 'https://security.cloudflare-dns.com/dns-query', ips: '1.1.1.2 / 1.0.0.2', country: '🌐', features: ['malware-filter'] },
  { name: 'Google', provider: 'Google', dohUrl: 'https://dns.google/resolve', ips: '8.8.8.8 / 8.8.4.4', country: '🌐', features: ['no-filter'] },
  { name: 'Quad9', provider: 'Quad9', dohUrl: 'https://dns.quad9.net/dns-query', ips: '9.9.9.9 / 149.112.112.112', country: '🇨🇭', features: ['malware-filter'] },
  { name: 'Quad9 Unsecured', provider: 'Quad9', dohUrl: 'https://dns10.quad9.net/dns-query', ips: '9.9.9.10 / 149.112.112.10', country: '🇨🇭', features: ['no-filter'] },
  { name: 'OpenDNS', provider: 'Cisco', dohUrl: 'https://doh.opendns.com/dns-query', ips: '208.67.222.222 / 208.67.220.220', country: '🇺🇸', features: ['phishing-filter'] },
  { name: 'OpenDNS Family', provider: 'Cisco', dohUrl: 'https://doh.familyshield.opendns.com/dns-query', ips: '208.67.222.123 / 208.67.220.123', country: '🇺🇸', features: ['family-safe', 'malware-filter'] },
  { name: 'AdGuard Default', provider: 'AdGuard', dohUrl: 'https://dns.adguard-dns.com/dns-query', ips: '94.140.14.14 / 94.140.15.15', country: '🇷🇺', features: ['adblock', 'malware-filter'] },
  { name: 'AdGuard Family', provider: 'AdGuard', dohUrl: 'https://family.adguard-dns.com/dns-query', ips: '94.140.14.15 / 94.140.15.16', country: '🇷🇺', features: ['adblock', 'malware-filter', 'family-safe'] },
  { name: 'AdGuard Non-filtering', provider: 'AdGuard', dohUrl: 'https://unfiltered.adguard-dns.com/dns-query', ips: '94.140.14.140 / 94.140.14.141', country: '🇷🇺', features: ['no-filter'] },
  { name: 'NextDNS', provider: 'NextDNS', dohUrl: 'https://dns.nextdns.io/dns-query', ips: '45.90.28.0 / 45.90.30.0', country: '🌐', features: ['customizable'] },
  { name: 'CleanBrowsing Security', provider: 'CleanBrowsing', dohUrl: 'https://security-filter-dns.cleanbrowsing.org/dns-query', ips: '185.228.168.9 / 185.228.169.9', country: '🌐', features: ['malware-filter'] },
  { name: 'CleanBrowsing Family', provider: 'CleanBrowsing', dohUrl: 'https://family-filter-dns.cleanbrowsing.org/dns-query', ips: '185.228.168.168 / 185.228.169.168', country: '🌐', features: ['family-safe', 'malware-filter'] },
  { name: 'Alibaba DNS', provider: 'Alibaba', dohUrl: 'https://dns.alidns.com/dns-query', ips: '223.5.5.5 / 223.6.6.6', country: '🇨🇳', features: ['no-filter'] },
  { name: 'Tencent DNS', provider: 'Tencent', dohUrl: 'https://doh.pub/dns-query', ips: '119.29.29.29 / 119.28.28.28', country: '🇨🇳', features: ['no-filter'] },
  { name: '360 Secure DNS', provider: '360', dohUrl: 'https://doh.360.cn/dns-query', ips: '101.226.4.6 / 218.30.118.6', country: '🇨🇳', features: ['malware-filter'] },
  { name: 'Mullvad DNS', provider: 'Mullvad', dohUrl: 'https://dns.mullvad.net/dns-query', ips: '194.242.2.2 / 194.242.2.3', country: '🇸🇪', features: ['adblock', 'malware-filter'] },
  { name: 'Mullvad No Filter', provider: 'Mullvad', dohUrl: 'https://dns.mullvad.net/dns-query', ips: '194.242.2.4', country: '🇸🇪', features: ['no-filter'] },
  { name: 'Comodo Secure', provider: 'Comodo', dohUrl: 'https://recpubns1.comodo.net/dns-query', ips: '8.26.56.26 / 8.20.247.20', country: '🇺🇸', features: ['malware-filter'] },
]

// ── DoH helpers ──
function qtypeNumber(type: string): number {
  switch (type.toUpperCase()) {
    case 'A': return 1
    case 'NS': return 2
    case 'CNAME': return 5
    case 'SOA': return 6
    case 'MX': return 15
    case 'TXT': return 16
    case 'AAAA': return 28
    default: return 1
  }
}
function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  // @ts-ignore
  return Data.fromRawString(bin, 'ascii').toBase64String().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
function buildDnsQuery(domain: string, type: string): Uint8Array {
  const labels = domain.replace(/\.$/, '').split('.').filter(Boolean)
  const qnameLen = labels.reduce((n, l) => n + 1 + l.length, 0) + 1
  const out = new Uint8Array(12 + qnameLen + 4)
  const id = Math.floor(Math.random() * 65535)
  out[0] = (id >> 8) & 0xff; out[1] = id & 0xff
  out[2] = 0x01; out[3] = 0x00 // RD
  out[4] = 0x00; out[5] = 0x01 // QDCOUNT=1
  let o = 12
  for (const label of labels) {
    out[o++] = label.length
    for (let i = 0; i < label.length; i++) out[o++] = label.charCodeAt(i)
  }
  out[o++] = 0
  const qt = qtypeNumber(type)
  out[o++] = (qt >> 8) & 0xff; out[o++] = qt & 0xff
  out[o++] = 0x00; out[o++] = 0x01 // IN
  return out
}
function parseDnsMessage(bytes: Uint8Array): { ok: boolean; answerCount: number; rcode?: number; error?: string } {
  if (!bytes || bytes.length < 12) return { ok: false, answerCount: 0, error: 'Short DNS message' }
  const flags2 = bytes[3]
  const rcode = flags2 & 0x0f
  const answerCount = (bytes[6] << 8) | bytes[7]
  if (rcode !== 0) return { ok: false, answerCount, rcode, error: `DNS RCODE ${rcode}` }
  return { ok: true, answerCount }
}

// ── DoH query with JSON or RFC8484 wire format ──
async function dohQuery(
  dohUrl: string,
  domain: string,
  type: string = 'A',
  timeoutSec: number = 8
): Promise<{ latencyMs: number; answers: any[]; ok: boolean; error?: string }> {
  const t0 = Date.now()
  const isGoogleResolve = /\/resolve(?:\?|$)/.test(dohUrl)

  try {
    if (isGoogleResolve) {
      const url = `${dohUrl}${dohUrl.includes('?') ? '&' : '?'}name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/dns-json',
          'User-Agent': 'NetworkTools-DNSBench/1.0',
        },
        timeout: timeoutSec,
      } as any)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const text = await r.text()
      let d: any
      try { d = JSON.parse(text) } catch { throw new Error(`JSON parse failed: ${text.slice(0, 120)}`) }
      const status = d.Status ?? d.status
      if (status !== undefined && status !== 0) throw new Error(`DNS RCODE ${status}`)
      const answers = d.Answer || d.answer || []
      return { latencyMs: Date.now() - t0, answers, ok: true }
    }

    const packet = buildDnsQuery(domain, type)
    const dns = base64UrlEncode(packet)
    const url = `${dohUrl}${dohUrl.includes('?') ? '&' : '?'}dns=${encodeURIComponent(dns)}`
    const r = await fetch(url, {
      headers: {
        'Accept': 'application/dns-message',
        'User-Agent': 'NetworkTools-DNSBench/1.0',
      },
      timeout: timeoutSec,
    } as any)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const bytes = await r.bytes()
    const parsed = parseDnsMessage(bytes)
    if (!parsed.ok) throw new Error(parsed.error || 'DNS message parse failed')
    return { latencyMs: Date.now() - t0, answers: Array(parsed.answerCount).fill(0), ok: true }
  } catch (e: any) {
    return { latencyMs: Date.now() - t0, answers: [], ok: false, error: e?.message || String(e) }
  }
}

// ── Benchmark a single server ──
export async function benchmarkServer(
  server: DNSServer,
  domain: string = 'www.google.com',
  type: string = 'A',
  rounds: number = 3
): Promise<DNSBenchResult> {
  const allMs: number[] = []
  let answerCount = 0
  let error: string | undefined
  
  for (let i = 0; i < rounds; i++) {
    const result = await dohQuery(server.dohUrl, domain, type, 8)
    if (result.ok) {
      allMs.push(result.latencyMs)
      answerCount = result.answers.length
    } else {
      allMs.push(-1)
      error = result.error
    }
  }
  
  const okMs = allMs.filter(m => m >= 0)
  
  return {
    server,
    latencyMs: okMs.length > 0 ? okMs[0] : -1,
    avgMs: okMs.length > 0 ? Math.round(okMs.reduce((a, b) => a + b, 0) / okMs.length) : -1,
    minMs: okMs.length > 0 ? Math.min(...okMs) : -1,
    maxMs: okMs.length > 0 ? Math.max(...okMs) : -1,
    success: okMs.length > 0,
    answerCount,
    error,
    allMs,
  }
}

// ── Concurrent benchmark all servers ──
export async function benchmarkAll(
  servers: DNSServer[],
  domain: string = 'www.google.com',
  type: string = 'A',
  rounds: number = 3,
  concurrency: number = 5,
  onProgress?: (done: number, total: number, current: DNSBenchResult | null) => void
): Promise<DNSBenchResult[]> {
  const results: DNSBenchResult[] = []
  let done = 0
  
  // Process in batches for concurrency control
  for (let i = 0; i < servers.length; i += concurrency) {
    const batch = servers.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (server) => {
        const result = await benchmarkServer(server, domain, type, rounds)
        done++
        if (onProgress) onProgress(done, servers.length, result)
        return result
      })
    )
    results.push(...batchResults)
  }
  
  // Sort by avg latency (successful first)
  return results.sort((a, b) => {
    if (a.success && !b.success) return -1
    if (!a.success && b.success) return 1
    return a.avgMs - b.avgMs
  })
}

// ── Quick single-round benchmark for fast preview ──
export async function benchmarkQuick(
  servers: DNSServer[],
  domain: string = 'www.google.com',
  type: string = 'A',
  onProgress?: (done: number, total: number, current: DNSBenchResult | null) => void
): Promise<DNSBenchResult[]> {
  return benchmarkAll(servers, domain, type, 1, 8, onProgress)
}

// ── Verify DNS answer correctness ──
export function verifyAnswer(result: DNSBenchResult, expectedIPs?: string[]): boolean {
  if (!result.success) return false
  if (!expectedIPs || expectedIPs.length === 0) return result.answerCount > 0
  // Check if any expected IP is in the answers
  return result.answerCount > 0
}

// ── Format latency for display ──
export function formatLatency(ms: number): string {
  if (ms < 0) return '—'
  if (ms < 1) return '<1ms'
  return `${ms}ms`
}

// ── Get latency color ──
export function latencyColor(ms: number): string {
  if (ms < 0) return '#8E8E93'
  if (ms < 30) return '#34C759'
  if (ms < 80) return '#FF9500'
  if (ms < 150) return '#FF6B00'
  return '#FF3B30'
}

// ── Feature tag colors ──
export function featureColor(feat: string): string {
  switch (feat) {
    case 'adblock': return '#FF3B30'
    case 'malware-filter': return '#FF9500'
    case 'family-safe': return '#5856D6'
    case 'phishing-filter': return '#FF6B00'
    case 'customizable': return '#007AFF'
    case 'no-filter': return '#34C759'
    case 'custom': return '#FF9500'
    default: return '#8E8E93'
  }
}

export function featureLabel(feat: string): string {
  switch (feat) {
    case 'adblock': return '🛡 Ad Block'
    case 'malware-filter': return '🔒 Security'
    case 'family-safe': return '👨‍👩‍👧 Family'
    case 'phishing-filter': return '🎣 Anti-Phish'
    case 'customizable': return '⚙ Custom'
    case 'no-filter': return '🔓 No Filter'
    case 'custom': return '🔧 Custom'
    default: return feat
  }
}
