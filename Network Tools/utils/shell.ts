// All network utilities — PURE HTTP, no Shell.run
import { fetch } from 'scripting'

// ── HTTP Latency Test (HEAD request, minimal body) ──
export interface PingResult {
  host: string
  ip: string
  packets_sent: number
  packets_received: number
  packet_loss: number
  min_ms: number
  max_ms: number
  avg_ms: number
  individual_ms: number[]
  raw: string
}

export async function ping(host: string, count: number = 4): Promise<PingResult> {
  const times: number[] = []
  let ip = host
  
  // Build URL: use user-provided scheme, or try HTTPS then HTTP
  let url: string
  let fallbackUrl: string | null = null
  if (/^https?:/.test(host)) {
    url = host
  } else {
    url = `https://${host}/`
    fallbackUrl = `http://${host}/`
  }
  
  // First request: determine working URL + resolve IP
  let workingUrl = url
  try {
    const t0 = Date.now()
    const r = await fetch(url, { timeout: 8, method: 'HEAD' } as any)
    const t1 = Date.now()
    times.push(t1 - t0)
    
    // Extract server IP from headers
    const server = r.headers.get('server') || ''
    const cfRay = r.headers.get('cf-ray') || ''
    // Try to get real IP via Cloudflare trace or similar
    const xRealIp = r.headers.get('x-real-ip') || r.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    if (xRealIp) ip = xRealIp
    else ip = host
  } catch (e: any) {
    // HTTPS failed, try HTTP fallback
    if (fallbackUrl) {
      try {
        const t0 = Date.now()
        const r = await fetch(fallbackUrl, { timeout: 8, method: 'HEAD' } as any)
        times.push(Date.now() - t0)
        workingUrl = fallbackUrl
        ip = host
      } catch {
        times.push(-1)
      }
    } else {
      times.push(-1)
    }
  }
  
  // Remaining requests use the working URL
  for (let i = 1; i < count; i++) {
    const t0 = Date.now()
    try {
      await fetch(workingUrl, { timeout: 8, method: 'HEAD' } as any)
      times.push(Date.now() - t0)
    } catch {
      times.push(-1)
    }
  }
  
  const ok = times.filter(t => t >= 0)
  const min = ok.length ? Math.min(...ok) : 0
  const max = ok.length ? Math.max(...ok) : 0
  const avg = ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : 0
  
  return {
    host, ip, packets_sent: count,
    packets_received: ok.length,
    packet_loss: Math.round((1 - ok.length / count) * 100),
    min_ms: min, max_ms: max, avg_ms: Math.round(avg * 10) / 10,
    individual_ms: times,
    raw: `HTTP HEAD ${host}: ${ok.length}/${count} replies, avg=${avg.toFixed(1)}ms`,
  }
}

// ── DNS (DNS-over-HTTPS via Cloudflare + Google) ──
export interface DNSRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

const DOH_URLS = [
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/resolve',
]

async function dohQuery(host: string, type: string, server: number = 0): Promise<DNSRecord[]> {
  try {
    const base = DOH_URLS[server] || DOH_URLS[0]
    const url = `${base}?name=${encodeURIComponent(host)}&type=${type}`
    const r = await fetch(url, { timeout: 8, headers: { 'Accept': 'application/dns-json' } } as any)
    const d = await r.json()
    const answers: DNSRecord[] = []
    if (d.Answer) {
      for (const a of d.Answer) {
        let val = String(a.data || '')
        if (a.type === 15) { // MX
          const parts = val.split(' ')
          val = parts.length > 1 ? `${parts[0]} ${parts[1]}` : val
        }
        if (a.type === 16) { // TXT
          val = val.replace(/^"|"$/g, '')
        }
        answers.push({
          type: a.type === 1 ? 'A' : a.type === 28 ? 'AAAA' : a.type === 15 ? 'MX' :
            a.type === 2 ? 'NS' : a.type === 16 ? 'TXT' : a.type === 5 ? 'CNAME' :
            a.type === 6 ? 'SOA' : a.type === 257 ? 'CAA' : a.type === 33 ? 'SRV' : String(a.type),
          name: a.name?.replace(/\.$/, '') || host,
          value: val.replace(/\.$/, ''),
          ttl: a.TTL,
        })
      }
    }
    return answers
  } catch (e: any) { throw new Error(`DNS query failed: ${e.message}`) }
}

export async function dnsLookup(host: string, type: string = 'A', customDoh?: string): Promise<DNSRecord[]> {
  // If custom DoH server provided, use it first
  if (customDoh && customDoh.trim()) {
    try {
      const url = customDoh.trim().replace(/\/$/, '')
      return await dohQueryDirect(url, host, type)
    } catch {
      // Fall through to built-in servers
    }
  }
  // Try Cloudflare first, fallback to Google
  try {
    const results = await dohQuery(host, type, 0)
    return results
  } catch {
    try {
      return await dohQuery(host, type, 1)
    } catch {
      return []
    }
  }
}

/** Direct DoH query to a custom server URL */
async function dohQueryDirect(baseUrl: string, host: string, type: string): Promise<DNSRecord[]> {
  const url = `${baseUrl}?name=${encodeURIComponent(host)}&type=${type}`
  const r = await fetch(url, { timeout: 10, headers: { 'Accept': 'application/dns-json' } } as any)
  const d = await r.json()
  const answers: DNSRecord[] = []
  if (d.Answer) {
    for (const a of d.Answer) {
      let val = String(a.data || '')
      if (a.type === 15) { // MX
        const parts = val.split(' ')
        val = parts.length > 1 ? `${parts[0]} ${parts[1]}` : val
      }
      if (a.type === 16) { // TXT
        val = val.replace(/^"|"$/g, '')
      }
      answers.push({
        type: a.type === 1 ? 'A' : a.type === 28 ? 'AAAA' : a.type === 15 ? 'MX' :
          a.type === 2 ? 'NS' : a.type === 16 ? 'TXT' : a.type === 5 ? 'CNAME' :
          a.type === 6 ? 'SOA' : a.type === 257 ? 'CAA' : a.type === 33 ? 'SRV' : String(a.type),
        name: a.name?.replace(/\.$/, '') || host,
        value: val.replace(/\.$/, ''),
        ttl: a.TTL,
      })
    }
  }
  return answers
}

export async function dnsLookupAll(host: string, customDoh?: string): Promise<Record<string, DNSRecord[]>> {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'CAA', 'SRV']
  const results: Record<string, DNSRecord[]> = {}
  for (const type of types) {
    const recs = await dnsLookup(host, type, customDoh)
    if (recs.length > 0) results[type] = recs
  }
  return results
}

// ── WHOIS (via RDAP + fallback APIs) ──
export async function whoisLookup(query: string): Promise<string> {
  const errors: string[] = []
  const trimmed = query.trim()
  
  // ── IP (v4 + v6) RDAP ──
  if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed) || /^[\da-fA-F:]+$/.test(trimmed) && trimmed.includes(':')) {
    try {
      const r = await fetch(`https://rdap.org/ip/${trimmed}`, { timeout: 12 } as any)
      if (!r.ok) throw new Error(`RDAP IP returned ${r.status}`)
      const d = await r.json()
      const result = formatRDAP(d)
      if (result !== 'No data') return result
    } catch (e: any) { errors.push(`RDAP IP: ${e.message}`) }
  }
  
  // ── ASN RDAP ──
  if (/^AS\d+$/i.test(trimmed)) {
    const asn = trimmed.replace(/^AS/i, '')
    try {
      const r = await fetch(`https://rdap.org/autnum/${asn}`, { timeout: 12 } as any)
      if (!r.ok) throw new Error(`RDAP ASN returned ${r.status}`)
      const d = await r.json()
      const result = formatRDAP(d)
      if (result !== 'No data') return result
    } catch (e: any) { errors.push(`RDAP ASN: ${e.message}`) }
  }
  
  // ── Domain: try RDAP first ──
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z]$/.test(trimmed)) {
    // RDAP domain lookup
    try {
      const r = await fetch(`https://rdap.org/domain/${trimmed}`, { timeout: 10 } as any)
      if (r.ok) {
        const d = await r.json()
        const result = formatRDAP(d)
        if (result !== 'No data') return result
      }
    } catch (e: any) { errors.push(`RDAP domain: ${e.message}`) }
    
    // Fallback: WHOIS JSON API
    try {
      const r = await fetch(`https://whois.freeaiapi.xyz/?name=${encodeURIComponent(trimmed)}`, { timeout: 10 } as any)
      if (!r.ok) throw new Error(`Status ${r.status}`)
      const d = await r.json()
      if (d.result) {
        const lines: string[] = []
        for (const [k, v] of Object.entries(d.result)) {
          if (v && typeof v === 'object') {
            lines.push(`${k}:`)
            for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
              if (sv !== null && sv !== undefined && sv !== '') lines.push(`  ${sk}: ${sv}`)
            }
          } else if (v !== null && v !== undefined && v !== '') {
            lines.push(`${k}: ${v}`)
          }
        }
        if (lines.length > 0) return lines.join('\n')
      }
    } catch (e: any) { errors.push(`WHOIS API: ${e.message}`) }
  }
  
  // ── Last resort: WhoisXML (domains only) ──
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z]$/.test(trimmed)) {
    try {
      const r = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${encodeURIComponent(trimmed)}&outputFormat=JSON&apiKey=at_demo`, { timeout: 10 } as any)
      if (!r.ok) throw new Error(`WhoisXML returned ${r.status}`)
      const d = await r.json()
      const raw = d.WhoisRecord?.rawText
      if (raw) return raw
    } catch (e: any) { errors.push(`WhoisXML: ${e.message}`) }
  }
  
  return errors.length > 0
    ? `WHOIS lookup failed:\n${errors.join('\n')}`
    : `No WHOIS data found for "${trimmed}"\nSupported: IP address, ASN (AS1234), or domain name`
}

function formatRDAP(d: any): string {
  const lines: string[] = []
  if (d.name) lines.push(`Name: ${d.name}`)
  if (d.handle) lines.push(`Handle: ${d.handle}`)
  if (d.startAutnum) lines.push(`ASN Range: ${d.startAutnum} - ${d.endAutnum}`)
  if (d.startAddress) lines.push(`IP Range: ${d.startAddress} - ${d.endAddress}`)
  if (d.ipVersion) lines.push(`IP Version: ${d.ipVersion}`)
  if (d.type) lines.push(`Type: ${d.type}`)
  if (d.status) lines.push(`Status: ${d.status.join(', ')}`)
  if (d.country) lines.push(`Country: ${d.country}`)
  if (d.parentHandle) lines.push(`Parent: ${d.parentHandle}`)
  if (d.remarks) {
    for (const r of d.remarks) {
      if (r.title) lines.push(`${r.title}: ${r.description?.join(' ') || ''}`)
    }
  }
  // Entities
  if (d.entities) {
    for (const e of d.entities) {
      const roles = e.roles?.join(', ') || 'contact'
      const name = e.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || e.handle || 'Unknown'
      lines.push(`${roles}: ${name}`)
      if (e.vcardArray?.[1]) {
        for (const v of e.vcardArray[1]) {
          if (v[0] === 'email') lines.push(`  email: ${v[3]}`)
          if (v[0] === 'tel') lines.push(`  phone: ${v[3]}`)
        }
      }
    }
  }
  // Events
  if (d.events) {
    for (const e of d.events) {
      lines.push(`${e.eventAction}: ${e.eventDate}`)
    }
  }
  return lines.join('\n') || 'No data'
}

// ── TLS Certificate (via crt.sh + SSL Labs) ──
export interface SSLCheckResult {
  subject: string
  issuer: string
  commonName: string
  notBefore: string
  notAfter: string
  isExpired: boolean
  expiresInDays: number
  serialNumber: string
  sans: string[]
  entryTimestamp: string
  certCount: number
  latestId: string
  // Key & signature info (from cert extensions)
  keyAlgorithm?: string
  keySize?: string
  signatureAlgorithm?: string
  error?: string
}

export interface TLSConnectionInfo {
  protocols: string[]
  cipherSuites: Array<{ name: string; strength: string }>
  grade: string
  gradeTrust?: string
  serverName: string
  ip?: string
  port?: number
  // Certificate chain
  certSubject?: string
  certIssuer?: string
  certNotBefore?: string
  certNotAfter?: string
  certKey?: string
  certSigAlg?: string
  // Security features
  forwardSecrecy?: boolean
  hsts?: string
  ocspStapling?: boolean
  sessionResumption?: boolean
  // Named groups
  namedGroups?: string[]
  // Renegotiation
  renegotiationSupport?: string
  // Raw JSON for debug toggle
  rawJSON?: string
  error?: string
}

export async function sslCheck(host: string): Promise<SSLCheckResult | null> {
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
  
  // Try crt.sh with retry (it can be flaky)
  let lastError: string | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://crt.sh/?q=${encodeURIComponent(cleanHost)}&output=json`, { timeout: attempt === 0 ? 30 : 45 } as any)
      if (!r.ok) {
        lastError = `crt.sh returned HTTP ${r.status}`
        if (attempt === 0) continue
        throw new Error(lastError)
      }
      
      const text = await r.text()
      
      // Check for HTML error pages (crt.sh sometimes returns these)
      if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
        lastError = 'crt.sh returned HTML instead of JSON (server may be down)'
        if (attempt === 0) continue
        throw new Error(lastError)
      }
      
      let certs: any[]
      try {
        certs = JSON.parse(text)
      } catch {
        lastError = 'crt.sh returned invalid JSON (server may be overloaded)'
        if (attempt === 0) continue
        throw new Error(lastError)
      }
      
      if (!Array.isArray(certs) || certs.length === 0) return null
      
      // Sort by not_before descending, pick newest
      certs.sort((a: any, b: any) => 
        new Date(b.not_before).getTime() - new Date(a.not_before).getTime()
      )
      const latest = certs[0]
      
      // Expiry check
      const notAfter = new Date(latest.not_after)
      const now = new Date()
      const isExpired = notAfter < now
      const expiresInDays = Math.round((notAfter.getTime() - now.getTime()) / 86400000)
      
      // Parse SANs
      const sans = (latest.name_value || '').split('\n').filter((s: string) => s.trim())
      
      // Extract cert ID for linking
      const latestId = String(latest.id || '')
      
      return {
        subject: cleanHost,
        issuer: latest.issuer_name || 'Unknown',
        commonName: latest.common_name || cleanHost,
        notBefore: latest.not_before || '',
        notAfter: latest.not_after || '',
        isExpired,
        expiresInDays,
        serialNumber: latest.serial_number || '',
        sans,
        entryTimestamp: latest.entry_timestamp || '',
        certCount: certs.length,
        latestId,
      }
    } catch (e: any) {
      lastError = e.message || 'Certificate lookup failed'
      if (attempt === 1) break // don't retry on second attempt
    }
  }
  
  // All attempts failed
  return {
    subject: cleanHost,
    issuer: '',
    commonName: '',
    notBefore: '',
    notAfter: '',
    isExpired: false,
    expiresInDays: 0,
    serialNumber: '',
    sans: [],
    entryTimestamp: '',
    certCount: 0,
    latestId: '',
    error: lastError || 'Certificate lookup failed',
  }
}

// ── TLS connection analysis (via SSL Labs API) ──
export async function tlsAnalyze(host: string): Promise<TLSConnectionInfo> {
  const cleanHost = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim()
  try {
    // Start or get analysis
    const startUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(cleanHost)}&startNew=off&all=done`
    const r = await fetch(startUrl, { timeout: 30 } as any)
    if (!r.ok) throw new Error(`SSL Labs returned ${r.status}`)
    const d = await r.json()
    
    if (d.status === 'ERROR') throw new Error(d.statusMessage || 'Analysis failed')
    if (d.status !== 'READY') {
      return {
        protocols: [],
        cipherSuites: [],
        grade: 'N/A',
        serverName: cleanHost,
        error: 'Analysis in progress — try again in 1-2 minutes',
      }
    }
    
    const endpoints = d.endpoints || []
    if (endpoints.length === 0) throw new Error('No endpoints found')
    
    const ep = endpoints[0]
    const details = ep.details || {}
    
    // Extract protocols
    const protocols: string[] = []
    if (details.protocols) {
      for (const p of details.protocols) {
        protocols.push(`${p.name} ${p.version}`)
      }
    }
    
    // Extract cipher suites
    const cipherSuites: Array<{ name: string; strength: string }> = []
    if (details.suites?.list) {
      for (const s of details.suites.list) {
        cipherSuites.push({
          name: s.name || 'Unknown',
          strength: s.cipherStrength ? `${s.cipherStrength}-bit` : 'Unknown',
        })
      }
    }
    
    // Extract certificate chain info
    const certs = details.cert?.chain || details.certChains?.[0]?.certs || []
    const leaf = certs[0] || {}
    
    // Security features
    const forwardSecrecy = details.forwardSecrecy === 2 || details.forwardSecrecy === 3
    const hsts = details.hstsPolicy?.status || undefined
    const ocspStapling = details.ocspStapling || false
    const sessionResumption = details.sessionResumption || false
    const renegotiationSupport = details.renegotiationSupport !== undefined ? 
      (details.renegotiationSupport === 2 ? 'Secure' : details.renegotiationSupport === 1 ? 'Insecure' : 'No') : undefined
    
    // Named groups
    const namedGroups: string[] = []
    if (details.namedGroups?.list) {
      for (const g of details.namedGroups.list) {
        namedGroups.push(g.name || String(g.id || ''))
      }
    }
    
    return {
      protocols,
      cipherSuites,
      grade: ep.grade || d.endpoints?.[0]?.grade || 'N/A',
      gradeTrust: ep.gradeTrustIgnored || undefined,
      serverName: d.host || cleanHost,
      ip: ep.ipAddress || undefined,
      port: ep.port || undefined,
      certSubject: leaf.subject || undefined,
      certIssuer: leaf.issuerLabel || leaf.issuer || undefined,
      certNotBefore: leaf.notBefore || undefined,
      certNotAfter: leaf.notAfter || undefined,
      certKey: `${leaf.keyAlgorithm || ''} ${leaf.keySize || ''}bit`.trim() || undefined,
      certSigAlg: leaf.sigAlgorithm || undefined,
      forwardSecrecy,
      hsts,
      ocspStapling,
      sessionResumption,
      namedGroups: namedGroups.length > 0 ? namedGroups : undefined,
      renegotiationSupport,
      rawJSON: JSON.stringify(d, null, 2),
    }
  } catch (e: any) {
    return {
      protocols: [],
      cipherSuites: [],
      grade: 'N/A',
      serverName: cleanHost,
      error: e.message || 'TLS analysis failed',
    }
  }
}

// ── Port Scan (HTTP HEAD fallback) ──
export interface PortScanResult {
  port: number
  state: 'open' | 'closed' | 'filtered'
  service?: string
}

export async function portScan(host: string, port: number): Promise<PortScanResult> {
  const service = getPortService(port)
  try {
    const scheme = [443, 8443].includes(port) ? 'https' : 'http'
    const t0 = Date.now()
    const r = await fetch(`${scheme}://${host}:${port}`, { timeout: 3, method: 'HEAD' } as any)
    const elapsed = Date.now() - t0
    return { port, state: 'open', service: `${service} (${elapsed}ms)` }
  } catch (e: any) {
    const msg = String(e)
    if (msg.includes('SSL') || msg.includes('certificate') || msg.includes('CERTIFICATE') || msg.includes('403') || msg.includes('401') || msg.includes('404') || msg.includes('301') || msg.includes('302')) {
      return { port, state: 'open', service }
    }
    return { port, state: 'closed', service }
  }
}

export async function portScanRange(host: string, ports: number[]): Promise<PortScanResult[]> {
  const results: PortScanResult[] = []
  for (let i = 0; i < ports.length; i += 3) {
    const batch = ports.slice(i, i + 3)
    const batchResults = await Promise.all(batch.map(p => portScan(host, p)))
    results.push(...batchResults)
  }
  return results.sort((a, b) => a.port - b.port)
}

function getPortService(port: number): string {
  const m: Record<number, string> = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 465: 'SMTPS',
    587: 'SMTP', 993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
    5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
    27017: 'MongoDB',
  }
  return m[port] || 'Unknown'
}

export const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 5432, 8080, 8443]
export const TOP_PORTS = [21, 22, 23, 25, 53, 80, 443, 3306, 8080]

// ── Traceroute (via external APIs with fallback) ──
export interface TracerouteHop {
  hop: number
  ip: string | null
  host: string | null
  rtt_ms: number[]
  timeout: boolean
  geo?: { city: string; country: string; org: string; asn?: string }
}

/** Parse traceroute-style text output into hops */
function parseTracerouteText(text: string): TracerouteHop[] {
  const hops: TracerouteHop[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 3) continue
    // Skip header / error lines
    if (/^(traceroute|Tracing|TRACEROUTE|Host|\-)/i.test(trimmed)) continue

    // Pattern 1: "1  1.2.3.4  1.234 ms"
    const m1 = trimmed.match(/^(\d+)\s+([\d.]+)\s+([\d.]+)\s*ms/)
    // Pattern 2: "1  hostname (1.2.3.4)  1.234 ms"
    const m2 = trimmed.match(/^(\d+)\s+(\S+)\s+\(([\d.]+)\)\s+([\d.]+)\s*ms/)
    // Pattern 3: "1  * * *" (timeout)
    const m3 = trimmed.match(/^(\d+)\s+\*\s*\*?\s*\*?/)
    // Pattern 4: "1  1.2.3.4  1.234 ms  2.345 ms  3.456 ms" (multiple RTTs)
    const m4 = trimmed.match(/^(\d+)\s+([\d.]+)\s+(([\d.]+\s*ms\s*)+)/)
    // Pattern 5: "1  hostname (1.2.3.4)  1.234 ms  2.345 ms" (hostname + multiple)
    const m5 = trimmed.match(/^(\d+)\s+(\S+)\s+\(([\d.]+)\)\s+(([\d.]+\s*ms\s*)+)/)

    if (m5) {
      const rtts = [...m5[4].matchAll(/([\d.]+)\s*ms/g)].map(r => parseFloat(r[1]))
      hops.push({ hop: parseInt(m5[1]), ip: m5[3], host: m5[2], rtt_ms: rtts, timeout: false })
    } else if (m2) {
      hops.push({ hop: parseInt(m2[1]), ip: m2[3], host: m2[2], rtt_ms: [parseFloat(m2[4])], timeout: false })
    } else if (m4) {
      const rtts = [...m4[3].matchAll(/([\d.]+)\s*ms/g)].map(r => parseFloat(r[1]))
      hops.push({ hop: parseInt(m4[1]), ip: m4[2], host: null, rtt_ms: rtts, timeout: false })
    } else if (m1) {
      hops.push({ hop: parseInt(m1[1]), ip: m1[2], host: null, rtt_ms: [parseFloat(m1[3])], timeout: false })
    } else if (m3) {
      hops.push({ hop: parseInt(m3[1]), ip: '*', host: null, rtt_ms: [], timeout: true })
    }
  }
  return hops
}

function isErrorResponse(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes('error') && (t.includes('api count') || t.includes('limit') || t.includes('quota') || t.includes('rate'))) {
    return 'API rate limited — try again later'
  }
  if (text.trim().startsWith('<') || text.trim().startsWith('<!doctype')) {
    return 'Server returned HTML instead of data (service may be down)'
  }
  if (t.includes('error') && text.split('\n').length < 5) {
    return text.trim()
  }
  return null
}

async function enrichHopsWithGeo(hops: TracerouteHop[]): Promise<void> {
  const uniqueIPs = [...new Set(hops.filter(h => h.ip && h.ip !== '*' && !h.timeout).map(h => h.ip!))]
  if (uniqueIPs.length === 0) return
  
  const geoMap = new Map<string, { city: string; country: string; org: string; asn?: string }>()
  
  // Batch lookup via ip-api.com (up to 100 per request)
  for (let i = 0; i < uniqueIPs.length; i += 100) {
    const batch = uniqueIPs.slice(i, i + 100)
    try {
      const r = await fetch('http://ip-api.com/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map(ip => ({ query: ip, fields: 'status,country,city,org,as,query' }))),
        timeout: 15,
        allowInsecureRequest: true,
      } as any)
      const results = await r.json()
      for (const d of results) {
        if (d.status === 'success') {
          geoMap.set(d.query, {
            city: d.city || 'Unknown',
            country: d.country || '',
            org: d.org || '',
            asn: d.as ? d.as.split(' ')[0] : undefined,
          })
        }
      }
    } catch {}
  }
  
  for (const hop of hops) {
    if (hop.ip && hop.ip !== '*' && geoMap.has(hop.ip)) {
      hop.geo = geoMap.get(hop.ip)
    }
  }
}

function parseCheckHostTrace(resData: any): TracerouteHop[] {
  const allNodeResults = Object.values(resData || {}) as any[]
  for (const nodeResult of allNodeResults) {
    if (!Array.isArray(nodeResult) || nodeResult.length === 0) continue
    const nodeData = nodeResult[0]
    if (!Array.isArray(nodeData)) continue
    const hops: TracerouteHop[] = []
    for (let i = 0; i < nodeData.length; i++) {
      const entry = nodeData[i]
      const hopNo = i + 1
      if (!entry || entry === '*') {
        hops.push({ hop: hopNo, ip: '*', host: null, rtt_ms: [], timeout: true })
        continue
      }
      if (!Array.isArray(entry) || entry.length === 0) {
        hops.push({ hop: hopNo, ip: '*', host: null, rtt_ms: [], timeout: true })
        continue
      }
      let chosenIp: string | null = null
      const rtts: number[] = []
      for (const probe of entry) {
        if (!probe || typeof probe !== 'object') continue
        const ip = probe.host || probe.ip || probe.address || null
        if (!chosenIp && ip) chosenIp = String(ip)
        const qts = Array.isArray(probe.query_times) ? probe.query_times : []
        for (const qt of qts) {
          const n = Number(qt)
          if (isFinite(n) && n >= 0) rtts.push(Math.round(n * 10) / 10)
        }
      }
      if (!chosenIp && rtts.length === 0) {
        hops.push({ hop: hopNo, ip: '*', host: null, rtt_ms: [], timeout: true })
      } else {
        hops.push({ hop: hopNo, ip: chosenIp || '*', host: null, rtt_ms: rtts, timeout: !chosenIp })
      }
    }
    if (hops.length > 0) return hops
  }
  return []
}

export async function traceroute(host: string, maxHops: number = 20): Promise<TracerouteHop[]> {
  const errors: string[] = []

  // ── API 1: check-host.net (primary; currently works) ──
  try {
    const reqR = await fetch(`https://check-host.net/check-traceroute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: `host=${encodeURIComponent(host)}&max_nodes=${maxHops}`,
      timeout: 15,
    } as any)
    const reqData = await reqR.json()
    if (reqData.request_id) {
      // @ts-ignore — setTimeout works at runtime
      await new Promise<void>(r => setTimeout(r, 4000))
      const resR = await fetch(`https://check-host.net/check-result/${reqData.request_id}`, {
        timeout: 20,
        headers: { 'Accept': 'application/json' },
      } as any)
      const resData = await resR.json()
      const hops = parseCheckHostTrace(resData)
      if (hops.length > 0) { await enrichHopsWithGeo(hops); return hops }
      errors.push('check-host: no hop data in response')
    } else {
      errors.push('check-host: no request_id returned')
    }
  } catch (e: any) {
    errors.push(`check-host: ${e.message || 'request failed'}`)
  }

  // ── API 2: hackertarget (secondary; often unavailable) ──
  try {
    const r = await fetch(`https://api.hackertarget.com/traceroute/?q=${encodeURIComponent(host)}`, { timeout: 45 } as any)
    const text = await r.text()
    const errMsg = isErrorResponse(text)
    if (errMsg) {
      errors.push(`hackertarget: ${errMsg}`)
    } else {
      const hops = parseTracerouteText(text)
      if (hops.length > 0) { await enrichHopsWithGeo(hops); return hops }
      errors.push('hackertarget: no hops found in response')
    }
  } catch (e: any) {
    errors.push(`hackertarget: ${e.message || 'request failed'}`)
  }

  throw new Error(`Traceroute failed — all services returned errors:\n${errors.join('\n')}`)
}

// ── Geolocate IP ──
export interface GeoLocation {
  ip: string
  lat: number
  lon: number
  city: string
  country: string
  org: string
}

export async function geolocateIP(ip: string): Promise<GeoLocation | null> {
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,org,query`, { timeout: 8, allowInsecureRequest: true } as any)
    const d = await r.json()
    if (d.status === 'success') {
      return { ip: d.query, lat: d.lat, lon: d.lon, city: d.city || 'Unknown', country: d.country || '', org: d.org || '' }
    }
  } catch {}
  return null
}
