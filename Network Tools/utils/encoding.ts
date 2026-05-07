// Encoding / hashing utilities — pure JS + Native Crypto API (Scripting environment)
// Uses `Crypto` (capital C) with `Data` objects, NOT Web Crypto's `crypto`
// No Shell.run or Python.run needed

// ── Native Crypto helpers ──
function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256)
  return arr
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
// PBKDF2-HMAC-SHA256 using native Crypto.hmacSHA256
// @ts-ignore — Data/Crypto return nullable but we're inside try/catch callers
function pbkdf2_sha256(password: Uint8Array, salt: Uint8Array, iterations: number, keylen: number): Uint8Array {
  const hashLen = 32
  const blocks = Math.ceil(keylen / hashLen)
  const result = new Uint8Array(blocks * hashLen)
  // @ts-ignore
  const pwData: Data = Data.fromUint8Array(password)
  for (let i = 1; i <= blocks; i++) {
    const sc = new Uint8Array(salt.length + 4)
    sc.set(salt)
    sc[salt.length] = (i >>> 24) & 0xff; sc[salt.length+1] = (i >>> 16) & 0xff
    sc[salt.length+2] = (i >>> 8) & 0xff; sc[salt.length+3] = i & 0xff
    // @ts-ignore
    let U: Uint8Array = Crypto.hmacSHA256(Data.fromUint8Array(sc), pwData).toUint8Array()
    const T = new Uint8Array(U)
    for (let j = 1; j < iterations; j++) {
      // @ts-ignore
      U = Crypto.hmacSHA256(Data.fromUint8Array(U), pwData).toUint8Array()
      for (let k = 0; k < hashLen; k++) T[k] ^= U[k]
    }
    result.set(T, (i - 1) * hashLen)
  }
  return result.slice(0, keylen)
}

// MD5 hash (pure JS)
function md5cycle(x: number[], k: number[]) {
  let a = x[0], b = x[1], c = x[2], d = x[3]
  a = ff(a,b,c,d,k[0],7,-680876936);d = ff(d,a,b,c,k[1],12,-389564586);c = ff(c,d,a,b,k[2],17,606105819);b = ff(b,c,d,a,k[3],22,-1044525330)
  a = ff(a,b,c,d,k[4],7,-176418897);d = ff(d,a,b,c,k[5],12,1200080426);c = ff(c,d,a,b,k[6],17,-1473231341);b = ff(b,c,d,a,k[7],22,-45705983)
  a = ff(a,b,c,d,k[8],7,1770035416);d = ff(d,a,b,c,k[9],12,-1958414417);c = ff(c,d,a,b,k[10],17,-42063);b = ff(b,c,d,a,k[11],22,-1990404162)
  a = ff(a,b,c,d,k[12],7,1804603682);d = ff(d,a,b,c,k[13],12,-40341101);c = ff(c,d,a,b,k[14],17,-1502002290);b = ff(b,c,d,a,k[15],22,1236535329)
  a = gg(a,b,c,d,k[1],5,-165796510);d = gg(d,a,b,c,k[6],9,-1069501632);c = gg(c,d,a,b,k[11],14,643717713);b = gg(b,c,d,a,k[0],20,-373897302)
  a = gg(a,b,c,d,k[5],5,-701558691);d = gg(d,a,b,c,k[10],9,38016083);c = gg(c,d,a,b,k[15],14,-660478335);b = gg(b,c,d,a,k[4],20,-405537848)
  a = gg(a,b,c,d,k[9],5,568446438);d = gg(d,a,b,c,k[14],9,-1019803690);c = gg(c,d,a,b,k[3],14,-187363961);b = gg(b,c,d,a,k[8],20,1163531501)
  a = gg(a,b,c,d,k[13],5,-1444681467);d = gg(d,a,b,c,k[2],9,-51403784);c = gg(c,d,a,b,k[7],14,1735328473);b = gg(b,c,d,a,k[12],20,-1926607734)
  a = hh(a,b,c,d,k[5],4,-378558);d = hh(d,a,b,c,k[8],11,-2022574463);c = hh(c,d,a,b,k[11],16,1839030562);b = hh(b,c,d,a,k[14],23,-35309556)
  a = hh(a,b,c,d,k[1],4,-1530992060);d = hh(d,a,b,c,k[4],11,1272893353);c = hh(c,d,a,b,k[7],16,-155497632);b = hh(b,c,d,a,k[10],23,-1094730640)
  a = hh(a,b,c,d,k[13],4,681279174);d = hh(d,a,b,c,k[0],11,-358537222);c = hh(c,d,a,b,k[3],16,-722521979);b = hh(b,c,d,a,k[6],23,76029189)
  a = hh(a,b,c,d,k[9],4,-640364487);d = hh(d,a,b,c,k[12],11,-421815835);c = hh(c,d,a,b,k[15],16,530742520);b = hh(b,c,d,a,k[2],23,-995338651)
  a = ii(a,b,c,d,k[0],6,-198630844);d = ii(d,a,b,c,k[7],10,1126891415);c = ii(c,d,a,b,k[14],15,-1416354905);b = ii(b,c,d,a,k[5],21,-57434055)
  a = ii(a,b,c,d,k[12],6,1700485571);d = ii(d,a,b,c,k[3],10,-1894986606);c = ii(c,d,a,b,k[10],15,-1051523);b = ii(b,c,d,a,k[1],21,-2054922799)
  a = ii(a,b,c,d,k[8],6,1873313359);d = ii(d,a,b,c,k[15],10,-30611744);c = ii(c,d,a,b,k[6],15,-1560198380);b = ii(b,c,d,a,k[13],21,1309151649)
  a = ii(a,b,c,d,k[4],6,-145523070);d = ii(d,a,b,c,k[11],10,-1120210379);c = ii(c,d,a,b,k[14],15,718787259);b = ii(b,c,d,a,k[3],21,-343485551)
  x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3])
}
function cmn(q:number,a:number,b:number,x:number,s:number,t:number){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b)}
function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&c)|((~b)&d),a,b,x,s,t)}
function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&d)|(c&(~d)),a,b,x,s,t)}
function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(b^c^d,a,b,x,s,t)}
function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(c^(b|(~d)),a,b,x,s,t)}
function md51(s:string){const n=s.length;let state=[1732584193,-271733879,-1732584194,271733878];let i=0;for(i=64;i<=n;i+=64)md5cycle(state,md5blk(s.substring(i-64,i)));s=s.substring(i-64);const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);tail[i>>2]|=0x80<<((i%4)<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i++)tail[i]=0}tail[14]=n*8;md5cycle(state,tail);return state}
function md5blk(s:string){const md5blks:number[]=[];for(let i=0;i<64;i+=4)md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);return md5blks}
const hex_chr='0123456789abcdef'.split('')
function rhex(n:number){let s='';for(let j=0;j<4;j++)s+=hex_chr[(n>>(j*8+4))&0x0F]+hex_chr[(n>>(j*8))&0x0F];return s}
function add32(a:number,b:number){return(a+b)&0xFFFFFFFF}
export async function md5(input:string):Promise<string>{const s=unescape(encodeURIComponent(input));return md51(s).map(rhex).join('')}

// SHA256 hash (native Crypto API)
export async function sha256(input: string): Promise<string> {
  // @ts-ignore — Data/Crypto return nullable in types but guaranteed at runtime
  return Crypto.sha256(Data.fromString(input)).toHexString()
}

// SHA512 hash (native Crypto API)
export async function sha512(input: string): Promise<string> {
  // @ts-ignore
  return Crypto.sha512(Data.fromString(input)).toHexString()
}

// Base64 encode (native Data API)
export function base64Encode(input: string): string {
  // @ts-ignore
  try { return Data.fromString(input).toBase64String() }
  catch { return '' }
}

// Base64 decode (native Data API)
export function base64Decode(input: string): string {
  // @ts-ignore
  try { return Data.fromBase64String(input).toRawString() }
  catch { return 'Invalid base64' }
}

// URL encode
export function urlEncode(input: string): string {
  return encodeURIComponent(input)
}

// URL decode
export function urlDecode(input: string): string {
  try { return decodeURIComponent(input) }
  catch { return 'Invalid URL encoding' }
}

// Generate UUID v4 (Math.random based)
export function generateUUID(): string {
  const bytes = randomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 1
  const hex = bytesToHex(bytes)
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

// HMAC-SHA256 (native Crypto API)
export async function hmacSha256(key: string, message: string): Promise<string> {
  // @ts-ignore
  return Crypto.hmacSHA256(Data.fromString(message), Data.fromString(key)).toHexString()
}

// Subnet calculator (pure JS)
export function calculateSubnet(ip: string, cidr: number): {
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  totalHosts: number
  usableHosts: number
  subnetMask: string
  wildcardMask: string
  binaryMask: string
  ipClass: string
} | null {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null
  if (cidr < 0 || cidr > 32) return null
  
  const ipInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0
  const wildcardInt = (~maskInt) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0
  const totalHosts = Math.pow(2, 32 - cidr)
  const usableHosts = Math.max(0, totalHosts - 2)
  
  const intToIP = (n: number) => `${(n >>> 24) & 0xFF}.${(n >>> 16) & 0xFF}.${(n >>> 8) & 0xFF}.${n & 0xFF}`
  
  const firstHost = cidr >= 31 ? intToIP(networkInt) : intToIP(networkInt + 1)
  const lastHost = cidr >= 31 ? intToIP(broadcastInt) : intToIP(broadcastInt - 1)
  
  let ipClass = 'A'
  if (parts[0] >= 192) ipClass = 'C'
  else if (parts[0] >= 128) ipClass = 'B'
  if (parts[0] >= 224) ipClass = parts[0] >= 240 ? 'E' : 'D'
  
  const binaryMask = intToIP(maskInt).split('.').map(p => 
    parseInt(p).toString(2).padStart(8, '0')
  ).join('.')
  
  return {
    network: `${intToIP(networkInt)}/${cidr}`,
    broadcast: intToIP(broadcastInt),
    firstHost,
    lastHost,
    totalHosts,
    usableHosts,
    subnetMask: intToIP(maskInt),
    wildcardMask: intToIP(wildcardInt),
    binaryMask,
    ipClass,
  }
}

// Parse WHOIS output into structured data
export function parseWhoisOutput(raw: string): Record<string, string> {
  const data: Record<string, string> = {}
  const lines = raw.split('\n')
  for (const line of lines) {
    const m = line.match(/^\s*([^#%][^:]+):\s*(.+)/)
    if (m) {
      const key = m[1].trim().toLowerCase().replace(/\s+/g, '_')
      const value = m[2].trim()
      if (!data[key]) data[key] = value
    }
  }
  return data
}

// ─── NEW: IT-Tools Features ─────────────────────────────────────────────────

// 1. Token Generator (configurable length & charset)
const TOKEN_CHARSETS: Record<string, string> = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numeric: '0123456789',
  hex: '0123456789abcdef',
  'no-ambiguous': 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
}

export function generateToken(length: number, charset: string): string {
  const chars = TOKEN_CHARSETS[charset] || TOKEN_CHARSETS.alphanumeric
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 2. Lorem Ipsum Generator
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ')

export function generateLorem(paragraphs: number): string {
  const result: string[] = []
  for (let p = 0; p < paragraphs; p++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 4)
    const sentences: string[] = []
    for (let s = 0; s < sentenceCount; s++) {
      const wordCount = 6 + Math.floor(Math.random() * 10)
      const words: string[] = []
      for (let w = 0; w < wordCount; w++) {
        words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)])
      }
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
      sentences.push(words.join(' ') + '.')
    }
    result.push(sentences.join(' '))
  }
  return result.join('\n\n')
}

// 3. Text Statistics
export function textStats(input: string): {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  lines: number
  bytes: number
} {
  return {
    characters: input.length,
    charactersNoSpaces: input.replace(/\s/g, '').length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    sentences: input.trim() ? (input.match(/[.!?]+/g) || ['']).length : 0,
    lines: input.trim() ? input.split('\n').length : 0,
    bytes: unescape(encodeURIComponent(input)).length,
  }
}

// 4. JSON Prettify / Minify
export function jsonPrettify(input: string, indent: number = 2): string {
  try { return JSON.stringify(JSON.parse(input), null, indent) }
  catch { return 'Invalid JSON' }
}

export function jsonMinify(input: string): string {
  try { return JSON.stringify(JSON.parse(input)) }
  catch { return 'Invalid JSON' }
}

// 5. Case Converter
export function convertCase(input: string, mode: string): string {
  switch (mode) {
    case 'upper': return input.toUpperCase()
    case 'lower': return input.toLowerCase()
    case 'title': return input.replace(/\b\w/g, c => c.toUpperCase())
    case 'sentence': return input.replace(/(^\s*|[.!?]\s+)(\w)/g, (_, pre, c) => pre + c.toUpperCase())
    case 'camel': return input.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase())
    case 'snake': return input.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase()
    case 'kebab': return input.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase()
    case 'pascal': return input.replace(/(^\w|[^a-zA-Z0-9]+\w)/g, c => c.replace(/[^a-zA-Z0-9]/, '').toUpperCase())
    default: return input
  }
}

// 6. Color Converter (hex ↔ rgb)
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')
}

// 7. Integer Base Converter
export function convertBase(input: string, from: number, to: number): string | null {
  const n = parseInt(input, from)
  if (isNaN(n)) return null
  return n.toString(to).toUpperCase()
}

// 8. Regex Tester (pure JS)
export function regexTest(pattern: string, flags: string, text: string): { matches: string[]; error?: string } {
  try {
    const re = new RegExp(pattern, flags)
    const matches: string[] = []
    let m: RegExpExecArray | null
    if (flags.includes('g')) {
      while ((m = re.exec(text)) !== null) { matches.push(m[0]); if (!m[0]) re.lastIndex++ }
    } else {
      m = re.exec(text); if (m) matches.push(m[0])
    }
    return { matches }
  } catch (e) { return { matches: [], error: String(e) } }
}

// 9. Math Evaluator (pure JS with Math.*)
export function evaluateMath(expression: string): string {
  try {
    const fn = new Function(
      'pi', 'e', 'sqrt', 'sin', 'cos', 'tan', 'log', 'log2', 'log10',
      'ceil', 'floor', 'round', 'abs', 'pow', 'min', 'max', 'exp', 'PI', 'E',
      `'use strict'; return (${expression})`
    )
    const result = fn(
      Math.PI, Math.E, Math.sqrt, Math.sin, Math.cos, Math.tan,
      Math.log, Math.log2, Math.log10, Math.ceil, Math.floor, Math.round,
      Math.abs, Math.pow, Math.min, Math.max, Math.exp, Math.PI, Math.E
    )
    return String(result)
  } catch (e) { return `Error: ${e}` }
}

// 10. Password Strength Analyzer
export function analyzePassword(password: string): {
  score: number
  level: string
  suggestions: string[]
} {
  let score = 0
  const suggestions: string[] = []
  if (password.length >= 8) score += 1; else suggestions.push('Use at least 8 characters')
  if (password.length >= 12) score += 1; else if (password.length >= 8) suggestions.push('Use 12+ characters for better security')
  if (/[a-z]/.test(password)) score += 1; else suggestions.push('Add lowercase letters')
  if (/[A-Z]/.test(password)) score += 1; else suggestions.push('Add uppercase letters')
  if (/[0-9]/.test(password)) score += 1; else suggestions.push('Add numbers')
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; else suggestions.push('Add special characters')
  if (!/(.)\1{2,}/.test(password)) score += 1; else suggestions.push('Avoid repeating characters')
  if (!/^(password|123456|qwerty)/i.test(password)) score += 1; else suggestions.push('Avoid common passwords')
  const level = score <= 2 ? 'Weak' : score <= 4 ? 'Fair' : score <= 6 ? 'Good' : 'Strong'
  return { score, level, suggestions }
}

// 11. Text ↔ Binary converter
export function textToBinary(input: string): string {
  return Array.from(input).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
}

export function binaryToText(input: string): string {
  try {
    return input.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('')
  } catch { return 'Invalid binary' }
}

// 12. Temperature Converter (°C, °F, K)
export function convertTemperature(value: number, from: string, to: string): number | null {
  let celsius: number
  if (from === 'C') celsius = value
  else if (from === 'F') celsius = (value - 32) * 5 / 9
  else if (from === 'K') celsius = value - 273.15
  else return null

  if (to === 'C') return Math.round(celsius * 100) / 100
  if (to === 'F') return Math.round((celsius * 9 / 5 + 32) * 100) / 100
  if (to === 'K') return Math.round((celsius + 273.15) * 100) / 100
  return null
}

// 13. Chmod Calculator
export function calculateChmod(user: { read: boolean; write: boolean; execute: boolean }, group: { read: boolean; write: boolean; execute: boolean }, others: { read: boolean; write: boolean; execute: boolean }): {
  octal: string
  symbolic: string
  command: string
} {
  const calc = (p: { read: boolean; write: boolean; execute: boolean }) => (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0)
  const u = calc(user), g = calc(group), o = calc(others)
  const sym = (p: { read: boolean; write: boolean; execute: boolean }) => (p.read ? 'r' : '-') + (p.write ? 'w' : '-') + (p.execute ? 'x' : '-')
  return {
    octal: `${u}${g}${o}`,
    symbolic: sym(user) + sym(group) + sym(others),
    command: `chmod ${u}${g}${o} <file>`,
  }
}

// 14. Slugify
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// 15. Text Diff (line-by-line)
export function textDiff(textA: string, textB: string): Array<{ type: 'same' | 'added' | 'removed'; line: string }> {
  const linesA = textA.split('\n')
  const linesB = textB.split('\n')
  const result: Array<{ type: 'same' | 'added' | 'removed'; line: string }> = []
  const maxLen = Math.max(linesA.length, linesB.length)
  for (let i = 0; i < maxLen; i++) {
    const a = i < linesA.length ? linesA[i] : undefined
    const b = i < linesB.length ? linesB[i] : undefined
    if (a === b) result.push({ type: 'same', line: a ?? '' })
    else {
      if (a !== undefined) result.push({ type: 'removed', line: a })
      if (b !== undefined) result.push({ type: 'added', line: b })
    }
  }
  return result
}

// 16. JWT Parser
export function parseJWT(token: string): { header: any; payload: any; error?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { header: null, payload: null, error: 'Invalid JWT: expected 3 parts' }
    // @ts-ignore
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
    // @ts-ignore
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { header, payload }
  } catch (e) { return { header: null, payload: null, error: `Parse error: ${e}` } }
}

// 17. HTML Entities
export function htmlEncode(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
export function htmlDecode(input: string): string {
  return input.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

// 18. Cron Parser
export function parseCron(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Invalid cron: expected 5 fields (min hour dom month dow)'
  const names = ['minute', 'hour', 'day of month', 'month', 'day of week']
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return parts.map((p, i) => {
    let desc = `${names[i]}: `
    if (p === '*') desc += 'every'
    else if (p.startsWith('*/')) desc += `every ${p.slice(2)}`
    else if (p.includes('-')) desc += `range ${p}`
    else if (p.includes(',')) desc += `at ${p}`
    else desc += p
    if (i === 4 && p !== '*' && !isNaN(Number(p))) desc += ` (${dow[Number(p)] || p})`
    if (i === 3 && p !== '*' && !isNaN(Number(p))) desc += ` (${months[Number(p)] || p})`
    return desc
  }).join('\n')
}

// 19. MAC Address Generator
export function generateMAC(separator: string = ':'): string {
  const hex = '0123456789ABCDEF'
  const bytes: string[] = []
  for (let i = 0; i < 6; i++) {
    bytes.push(hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)])
  }
  return bytes.join(separator)
}

// 20. IPv4 Address Converter
export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}
export function intToIPv4(n: number): string {
  return `${(n >>> 24) & 0xFF}.${(n >>> 16) & 0xFF}.${(n >>> 8) & 0xFF}.${n & 0xFF}`
}

// 21. Number to Words
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function _under1000(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + _under1000(n % 100) : '')
}

export function numberToWords(n: number): string {
  try {
    if (!Number.isInteger(n) || n < 0 || n > 999999) return 'out of range'
    if (n === 0) return 'zero'
    const thousands = Math.floor(n / 1000)
    const remainder = n % 1000
    let result = ''
    if (thousands > 0) result += _under1000(thousands) + ' thousand'
    if (remainder > 0) result += (result ? ' ' : '') + _under1000(remainder)
    return result
  } catch { return 'error' }
}

// 22. ETA Estimate
export function etaEstimate(total: number, done: number, elapsedMs: number): { remaining: string; rate: string; eta: string } {
  try {
    if (done <= 0 || elapsedMs <= 0 || total <= done) {
      return { remaining: done >= total ? '0s' : '∞', rate: '0/s', eta: done >= total ? 'done' : '∞' }
    }
    const rate = done / (elapsedMs / 1000)
    const remainingItems = total - done
    const remainingSec = remainingItems / rate
    const etaDate = new Date(Date.now() + remainingSec * 1000)
    const h = Math.floor(remainingSec / 3600)
    const m = Math.floor((remainingSec % 3600) / 60)
    const s = Math.floor(remainingSec % 60)
    const remaining = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`
    return { remaining, rate: `${rate.toFixed(2)}/s`, eta: etaDate.toLocaleTimeString() }
  } catch { return { remaining: 'error', rate: '0/s', eta: 'error' } }
}

// 23. ULID Generator
const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function generateULID(): string {
  try {
    const now = Date.now()
    let ts = now
    let timeStr = ''
    for (let i = 9; i >= 0; i--) {
      timeStr = CROCKFORD_BASE32[ts % 32] + timeStr
      ts = Math.floor(ts / 32)
    }
    const randBytes = randomBytes(10)
    let randStr = ''
    for (let i = 0; i < 10; i++) {
      randStr += CROCKFORD_BASE32[randBytes[i] % 32]
    }
    return (timeStr + randStr).substring(0, 26)
  } catch { return '00000000000000000000000000' }
}

// 24. User-Agent Parser
export function parseUserAgent(ua: string): { browser: string; version: string; os: string; device: string } {
  try {
    let browser = 'Unknown', version = '', os = 'Unknown', device = 'Desktop'
    if (/Edg\//i.test(ua)) { browser = 'Edge'; const m = ua.match(/Edg\/([\d.]+)/); if (m) version = m[1] }
    else if (/OPR\//i.test(ua)) { browser = 'Opera'; const m = ua.match(/OPR\/([\d.]+)/); if (m) version = m[1] }
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) { browser = 'Chrome'; const m = ua.match(/Chrome\/([\d.]+)/); if (m) version = m[1] }
    else if (/Firefox\//i.test(ua)) { browser = 'Firefox'; const m = ua.match(/Firefox\/([\d.]+)/); if (m) version = m[1] }
    else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) { browser = 'Safari'; const m = ua.match(/Version\/([\d.]+)/); if (m) version = m[1] }
    if (/Windows NT/i.test(ua)) os = 'Windows'
    else if (/Mac OS X/i.test(ua)) os = 'macOS'
    else if (/Android/i.test(ua)) os = 'Android'
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
    else if (/CrOS/i.test(ua)) os = 'ChromeOS'
    else if (/Linux/i.test(ua)) os = 'Linux'
    if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) device = 'Mobile'
    else if (/iPad|Android(?!.*Mobile)/i.test(ua)) device = 'Tablet'
    return { browser, version, os, device }
  } catch { return { browser: 'Unknown', version: '', os: 'Unknown', device: 'Unknown' } }
}

// 25. MIME Type Lookup
const MIME_MAP: Record<string, { type: string; description: string }> = {
  html: { type: 'text/html', description: 'HTML document' },
  htm: { type: 'text/html', description: 'HTML document' },
  css: { type: 'text/css', description: 'CSS stylesheet' },
  js: { type: 'application/javascript', description: 'JavaScript source' },
  mjs: { type: 'application/javascript', description: 'JavaScript module' },
  json: { type: 'application/json', description: 'JSON data' },
  xml: { type: 'application/xml', description: 'XML document' },
  txt: { type: 'text/plain', description: 'Plain text' },
  csv: { type: 'text/csv', description: 'CSV spreadsheet' },
  md: { type: 'text/markdown', description: 'Markdown document' },
  jpg: { type: 'image/jpeg', description: 'JPEG image' },
  jpeg: { type: 'image/jpeg', description: 'JPEG image' },
  png: { type: 'image/png', description: 'PNG image' },
  gif: { type: 'image/gif', description: 'GIF image' },
  svg: { type: 'image/svg+xml', description: 'SVG vector image' },
  webp: { type: 'image/webp', description: 'WebP image' },
  ico: { type: 'image/x-icon', description: 'Icon file' },
  pdf: { type: 'application/pdf', description: 'PDF document' },
  zip: { type: 'application/zip', description: 'ZIP archive' },
  tar: { type: 'application/x-tar', description: 'TAR archive' },
  gz: { type: 'application/gzip', description: 'Gzip compressed' },
  '7z': { type: 'application/x-7z-compressed', description: '7-Zip archive' },
  mp4: { type: 'video/mp4', description: 'MP4 video' },
  mp3: { type: 'audio/mpeg', description: 'MP3 audio' },
  wav: { type: 'audio/wav', description: 'WAV audio' },
  ogg: { type: 'audio/ogg', description: 'OGG audio' },
  webm: { type: 'video/webm', description: 'WebM video' },
  avi: { type: 'video/x-msvideo', description: 'AVI video' },
  woff: { type: 'font/woff', description: 'WOFF font' },
  woff2: { type: 'font/woff2', description: 'WOFF2 font' },
  ttf: { type: 'font/ttf', description: 'TrueType font' },
  otf: { type: 'font/otf', description: 'OpenType font' },
  doc: { type: 'application/msword', description: 'Word document' },
  docx: { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Word document' },
  xls: { type: 'application/vnd.ms-excel', description: 'Excel spreadsheet' },
  xlsx: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Excel spreadsheet' },
  ppt: { type: 'application/vnd.ms-powerpoint', description: 'PowerPoint presentation' },
  pptx: { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'PowerPoint presentation' },
  yaml: { type: 'application/x-yaml', description: 'YAML data' },
  yml: { type: 'application/x-yaml', description: 'YAML data' },
  sh: { type: 'application/x-sh', description: 'Shell script' },
  sql: { type: 'application/sql', description: 'SQL script' },
  iso: { type: 'application/x-iso9660-image', description: 'ISO disc image' },
  wasm: { type: 'application/wasm', description: 'WebAssembly binary' },
}

export function mimeLookup(ext: string): { type: string; description: string } {
  const e = ext.replace(/^\./, '').toLowerCase()
  return MIME_MAP[e] || { type: 'application/octet-stream', description: 'Binary data' }
}

// 26. Basic Auth Encoder
export function basicAuthEncode(user: string, pass: string): string {
  try {
    // @ts-ignore - btoa available at runtime
    return 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass)))
  } catch { // @ts-ignore - btoa available at runtime
    return 'Basic ' + btoa(user + ':' + pass) }
}

// 27. XML Prettify
export function xmlPrettify(input: string, indent: number = 2): string {
  try {
    let xml = input.replace(/(>)\s+(<)/g, '$1\n$2').replace(/\s+\/>/g, '/>')
    const lines = xml.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    let depth = 0
    const pad = (n: number) => ' '.repeat(n * indent)
    const result: string[] = []
    for (const line of lines) {
      if (line.startsWith('</')) depth = Math.max(0, depth - 1)
      result.push(pad(depth) + line)
      if (line.match(/^<[^\/?][^>]*[^\/]$/ ) && !line.startsWith('<\?') && !line.startsWith('<!')) depth++
      if (line.match(/^<[^\/?][^>]*\/>$/)) { /* self-closing, no depth change */ }
    }
    return result.join('\n')
  } catch { return input }
}

// 28. XML Minify
export function xmlMinify(input: string): string {
  try {
    return input.replace(/\n\s*/g, '').replace(/>\s+</g, '><').trim()
  } catch { return input }
}

// 29. IPv6 ULA Generator
export function generateIPv6ULA(): string {
  try {
    const rand = randomBytes(16)
    // fd + 40 random bits (5 bytes) + 16-bit subnet (2 bytes) + 64-bit IID (8 bytes) = 16 bytes total
    const groups: string[] = []
    groups.push('fd' + rand[0].toString(16).padStart(2, '0'))
    for (let i = 1; i < 16; i += 2) {
      groups.push((rand[i] << 8 | rand[i + 1]).toString(16).padStart(4, '0'))
    }
    // Pad to 8 groups
    while (groups.length < 8) groups.push('0000')
    return groups.slice(0, 8).join(':')
  } catch { return 'fd00::1' }
}

// 30. Epoch to ISO Date
export function epochToDate(epoch: string): string {
  try {
    let ms = Number(epoch)
    if (isNaN(ms)) return 'Invalid epoch'
    // Auto-detect: if value < 1e12 it's seconds, else milliseconds
    if (ms < 1e12) ms *= 1000
    return new Date(ms).toISOString()
  } catch { return 'Invalid epoch' }
}

// 31. Date to Epoch
export function dateToEpoch(dateStr: string): number {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 0
    return Math.floor(d.getTime() / 1000)
  } catch { return 0 }
}

// 32. File Size Formatter
export function formatFileSize(bytes: number): string {
  try {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))
    const idx = Math.min(i, units.length - 1)
    return (bytes / Math.pow(1024, idx)).toFixed(idx === 0 ? 0 : 2) + ' ' + units[idx]
  } catch { return '0 B' }
}

// 33. Hex Encode
export function hexEncode(input: string): string {
  try {
    return Array.from(input).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  } catch { return '' }
}

// 34. Hex Decode
export function hexDecode(input: string): string {
  try {
    const hex = input.replace(/\s/g, '')
    let result = ''
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16))
    }
    return result
  } catch { return 'Invalid hex' }
}

// 35. URL Parser
export function parseURL(urlStr: string): { protocol: string; host: string; hostname: string; port: string; pathname: string; search: string; hash: string; origin: string; params: Record<string, string> } {
  try {
    // @ts-ignore
    const u = new URL(urlStr)
    const params: Record<string, string> = {}
    u.searchParams.forEach((v: string, k: string) => { params[k] = v })
    return { protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, origin: u.origin, params }
  } catch { return { protocol: '', host: '', hostname: '', port: '', pathname: '', search: '', hash: '', origin: '', params: {} } }
}

// 36. Date-time Converter
export function formatDateInfo(date: Date): { iso: string; unix: number; utc: string; locale: string; relative: string } {
  const now = Date.now()
  const diff = now - date.getTime()
  let relative = ''
  if (diff < 0) {
    const abs = Math.abs(diff)
    if (abs < 60000) relative = 'in ' + Math.ceil(abs / 1000) + ' seconds'
    else if (abs < 3600000) relative = 'in ' + Math.ceil(abs / 60000) + ' minutes'
    else if (abs < 86400000) relative = 'in ' + Math.ceil(abs / 3600000) + ' hours'
    else relative = 'in ' + Math.ceil(abs / 86400000) + ' days'
  } else {
    if (diff < 60000) relative = Math.floor(diff / 1000) + ' seconds ago'
    else if (diff < 3600000) relative = Math.floor(diff / 60000) + ' minutes ago'
    else if (diff < 86400000) relative = Math.floor(diff / 3600000) + ' hours ago'
    else relative = Math.floor(diff / 86400000) + ' days ago'
  }
  return {
    iso: date.toISOString(),
    unix: Math.floor(date.getTime() / 1000),
    utc: date.toUTCString(),
    locale: date.toLocaleString(),
    relative
  }
}

// 37. Roman Numeral Converter
const ROMAN_MAP: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]

export function numberToRoman(n: number): string | null {
  if (n < 1 || n > 3999 || !Number.isInteger(n)) return null
  let result = ''
  for (const [val, sym] of ROMAN_MAP) { while (n >= val) { result += sym; n -= val } }
  return result
}

export function romanToNumber(roman: string): number | null {
  const s = roman.toUpperCase()
  const vals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let result = 0
  for (let i = 0; i < s.length; i++) {
    const curr = vals[s[i]], next = vals[s[i + 1]]
    if (!curr) return null
    result += (next && curr < next) ? -curr : curr
  }
  return result > 0 ? result : null
}

// 38. Text to NATO Alphabet
const NATO: Record<string, string> = { A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu', '0':'Zero','1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine' }
export function textToNATO(input: string): string {
  return Array.from(input.toUpperCase()).map(c => NATO[c] || c).join(' ')
}

// 39. Text to Unicode / Unicode to Text
export function textToUnicode(input: string): string {
  return Array.from(input).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')
}
export function unicodeToText(input: string): string {
  return input.trim().split(/\s+/).map(u => String.fromCharCode(parseInt(u.replace(/^U\+/i, ''), 16))).join('')
}

// 40. Random Port Generator
export function randomPort(): number {
  return 1024 + Math.floor(Math.random() * 64512)
}

// 41. String Obfuscator
export function obfuscateString(input: string, showFirst: number = 3, showLast: number = 3): string {
  if (input.length <= showFirst + showLast) return input
  return input.slice(0, showFirst) + '•'.repeat(Math.min(input.length - showFirst - showLast, 20)) + input.slice(-showLast)
}

// 42. Percentage Calculator
export function calculatePercentage(value: number, total: number): { percent: string; valueOfX: (x: number) => string } {
  const pct = total === 0 ? 0 : (value / total) * 100
  return {
    percent: pct.toFixed(2) + '%',
    valueOfX: (x: number) => (total * x / 100).toFixed(2)
  }
}

// 43. Email Normalizer
export function normalizeEmail(email: string): string {
  const e = email.trim().toLowerCase()
  const [local, domain] = e.split('@')
  if (!local || !domain) return e
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.replace(/\./g, '').split('+')[0] + '@gmail.com'
  }
  return local.split('+')[0] + '@' + domain
}

export function emailValidator(email: string): { valid: boolean; parts: { local: string; domain: string; tld: string } | null } {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})$/
  const m = email.match(re)
  if (!m) return { valid: false, parts: null }
  return { valid: true, parts: { local: email.split('@')[0], domain: m[1], tld: m[2] } }
}

// 44. JSON to CSV
export function jsonToCSV(jsonStr: string): string {
  try {
    const arr = JSON.parse(jsonStr)
    if (!Array.isArray(arr) || arr.length === 0) return '[]'
    const headers = [...new Set(arr.flatMap((o: any) => Object.keys(o)))] as string[]
    const csvEscape = (v: any) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s }
    const lines = [headers.join(',')]
    for (const row of arr) lines.push(headers.map(h => csvEscape((row as any)[h])).join(','))
    return lines.join('\n')
  } catch { return 'Invalid JSON' }
}

// 45. AES-GCM Encrypt/Decrypt (native Crypto API + PBKDF2)
export async function encryptText(plaintext: string, password: string): Promise<string> {
  try {
    const salt = randomBytes(16)
    // @ts-ignore — Data/Crypto return nullable in types but guaranteed at runtime
    const keyBytes = pbkdf2_sha256(Data.fromString(password).toUint8Array(), salt, 100000, 32)
    // @ts-ignore
    const key = Data.fromUint8Array(keyBytes)
    // @ts-ignore
    const encrypted = Crypto.encryptAESGCM(Data.fromString(plaintext), key)
    if (!encrypted) return 'Encryption failed'
    // @ts-ignore
    const combined = Data.combine([Data.fromUint8Array(salt), encrypted])
    // @ts-ignore
    return combined.toBase64String()
  } catch { return 'Encryption failed' }
}

export async function decryptText(ciphertextB64: string, password: string): Promise<string> {
  try {
    // @ts-ignore
    const raw: Uint8Array = Data.fromBase64String(ciphertextB64).toUint8Array()
    // @ts-ignore
    const salt = raw.slice(0, 16)
    // @ts-ignore
    const ciphertext = Data.fromUint8Array(raw.slice(16))
    // @ts-ignore
    const keyBytes = pbkdf2_sha256(Data.fromString(password).toUint8Array(), salt, 100000, 32)
    // @ts-ignore
    const key = Data.fromUint8Array(keyBytes)
    // @ts-ignore
    const decrypted = Crypto.decryptAESGCM(ciphertext, key)
    if (!decrypted) return 'Decryption failed'
    // @ts-ignore
    return decrypted.toRawString()
  } catch { return 'Decryption failed' }
}

// 46. TOTP Generator
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32Decode(input: string): Uint8Array {
  const s = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  const bytes: number[] = []
  let bits = 0, value = 0
  for (const c of s) {
    const idx = BASE32_CHARS.indexOf(c)
    if (idx < 0) continue
    value = (value << 5) | idx; bits += 5
    if (bits >= 8) { bits -= 8; bytes.push((value >> bits) & 0xff) }
  }
  return new Uint8Array(bytes)
}

export async function generateTOTP(secret: string, period: number = 30): Promise<{ code: string; remaining: number }> {
  try {
    const keyBytes = base32Decode(secret)
    const epoch = Math.floor(Date.now() / 1000)
    const counter = Math.floor(epoch / period)
    const remaining = period - (epoch % period)
    const counterBytes = new Uint8Array(8)
    let c = counter
    for (let i = 7; i >= 0; i--) { counterBytes[i] = c & 0xff; c = Math.floor(c / 256) }
    // @ts-ignore — Crypto/Data nullable in types but works at runtime
    const sig: any = Crypto.hmacSHA1(Data.fromUint8Array(counterBytes), Data.fromUint8Array(keyBytes)).toUint8Array()
    const offset = sig[sig.length - 1] & 0x0f
    const otp = ((sig[offset] & 0x7f) << 24 | (sig[offset + 1] & 0xff) << 16 | (sig[offset + 2] & 0xff) << 8 | (sig[offset + 3] & 0xff)) % 1000000
    return { code: String(otp).padStart(6, '0'), remaining }
  } catch { return { code: '000000', remaining: 0 } }
}

// 47. Numeronym Generator
export function generateNumeronym(input: string): string {
  if (input.length <= 3) return input
  return input[0] + (input.length - 2) + input[input.length - 1]
}

// 48. HTTP Status Codes
const HTTP_STATUS: Record<number, { code: number; name: string; description: string; category: string }> = {
  100:{code:100,name:'Continue',description:'Server received headers, client should send body',category:'Informational'},101:{code:101,name:'Switching Protocols',description:'Server is switching protocols',category:'Informational'},102:{code:102,name:'Processing',description:'Server is processing request',category:'Informational'},200:{code:200,name:'OK',description:'Standard successful response',category:'Success'},201:{code:201,name:'Created',description:'Resource was created',category:'Success'},202:{code:202,name:'Accepted',description:'Request accepted for processing',category:'Success'},204:{code:204,name:'No Content',description:'Success with no content to return',category:'Success'},301:{code:301,name:'Moved Permanently',description:'Resource permanently moved',category:'Redirection'},302:{code:302,name:'Found',description:'Resource temporarily moved',category:'Redirection'},304:{code:304,name:'Not Modified',description:'Resource not modified since last request',category:'Redirection'},307:{code:307,name:'Temporary Redirect',description:'Temporary redirect, keep method',category:'Redirection'},308:{code:308,name:'Permanent Redirect',description:'Permanent redirect, keep method',category:'Redirection'},400:{code:400,name:'Bad Request',description:'Server could not understand the request',category:'Client Error'},401:{code:401,name:'Unauthorized',description:'Authentication required',category:'Client Error'},403:{code:403,name:'Forbidden',description:'Server refuses to authorize',category:'Client Error'},404:{code:404,name:'Not Found',description:'Resource not found',category:'Client Error'},405:{code:405,name:'Method Not Allowed',description:'HTTP method not allowed',category:'Client Error'},408:{code:408,name:'Request Timeout',description:'Server timed out waiting',category:'Client Error'},409:{code:409,name:'Conflict',description:'Request conflicts with current state',category:'Client Error'},410:{code:410,name:'Gone',description:'Resource permanently removed',category:'Client Error'},413:{code:413,name:'Payload Too Large',description:'Request body too large',category:'Client Error'},415:{code:415,name:'Unsupported Media Type',description:'Media type not supported',category:'Client Error'},422:{code:422,name:'Unprocessable Entity',description:'Semantically invalid request',category:'Client Error'},429:{code:429,name:'Too Many Requests',description:'Rate limited',category:'Client Error'},500:{code:500,name:'Internal Server Error',description:'Server encountered an error',category:'Server Error'},502:{code:502,name:'Bad Gateway',description:'Invalid response from upstream',category:'Server Error'},503:{code:503,name:'Service Unavailable',description:'Server temporarily unavailable',category:'Server Error'},504:{code:504,name:'Gateway Timeout',description:'Upstream server timed out',category:'Server Error'}
}
export function formatHttpStatus(code: number): { code: number; name: string; description: string; category: string } {
  return HTTP_STATUS[code] || { code, name: 'Unknown', description: 'Non-standard status code', category: 'Unknown' }
}
export function getAllHttpStatusCodes(): { code: number; name: string; description: string; category: string }[] {
  return Object.entries(HTTP_STATUS).map(([, info]) => info)
}

// 49. SVG Placeholder Generator
export function generateSVGPlaceholder(width: number, height: number, text?: string, bgColor?: string, textColor?: string): string {
  const bg = bgColor || '#cccccc'
  const tc = textColor || '#666666'
  const t = text || `${width}×${height}`
  const fs = Math.min(width, height) / 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${fs}" fill="${tc}">${t}</text></svg>`
}

// 50. Markdown to HTML (basic)
export function markdownToHTML(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.+<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
  return '<p>' + html + '</p>'
}

// 51. Open Graph Meta Generator
export function generateOpenGraphMeta(options: { title: string; description: string; url: string; image?: string; type?: string; siteName?: string }): string {
  const tags = [
    `<meta property="og:title" content="${options.title}" />`,
    `<meta property="og:description" content="${options.description}" />`,
    `<meta property="og:url" content="${options.url}" />`,
    `<meta property="og:type" content="${options.type || 'website'}" />`,
  ]
  if (options.image) tags.push(`<meta property="og:image" content="${options.image}" />`)
  if (options.siteName) tags.push(`<meta property="og:site_name" content="${options.siteName}" />`)
  tags.push(`<meta name="twitter:card" content="${options.image ? 'summary_large_image' : 'summary'}" />`)
  tags.push(`<meta name="twitter:title" content="${options.title}" />`)
  tags.push(`<meta name="twitter:description" content="${options.description}" />`)
  if (options.image) tags.push(`<meta name="twitter:image" content="${options.image}" />`)
  return tags.join('\n')
}

// 52. Git Cheatsheet
export function generateGitCheatsheet(): { category: string; commands: { cmd: string; desc: string }[] }[] {
  return [
    { category: 'Setup', commands: [{ cmd: 'git init', desc: 'Initialize a new repo' }, { cmd: 'git clone <url>', desc: 'Clone a repository' }, { cmd: 'git config user.name "name"', desc: 'Set username' }, { cmd: 'git config user.email "email"', desc: 'Set email' }] },
    { category: 'Branches', commands: [{ cmd: 'git branch', desc: 'List branches' }, { cmd: 'git branch <name>', desc: 'Create branch' }, { cmd: 'git checkout <branch>', desc: 'Switch branch' }, { cmd: 'git checkout -b <name>', desc: 'Create & switch' }, { cmd: 'git merge <branch>', desc: 'Merge branch' }, { cmd: 'git branch -d <name>', desc: 'Delete branch' }] },
    { category: 'Staging', commands: [{ cmd: 'git add .', desc: 'Stage all changes' }, { cmd: 'git add <file>', desc: 'Stage specific file' }, { cmd: 'git reset <file>', desc: 'Unstage file' }, { cmd: 'git status', desc: 'Show working tree status' }] },
    { category: 'Commit', commands: [{ cmd: 'git commit -m "msg"', desc: 'Commit staged changes' }, { cmd: 'git commit --amend', desc: 'Amend last commit' }, { cmd: 'git log --oneline', desc: 'Compact log' }, { cmd: 'git diff', desc: 'Unstaged changes' }, { cmd: 'git diff --staged', desc: 'Staged changes' }] },
    { category: 'Remote', commands: [{ cmd: 'git remote add origin <url>', desc: 'Add remote' }, { cmd: 'git push origin <branch>', desc: 'Push to remote' }, { cmd: 'git pull', desc: 'Fetch & merge' }, { cmd: 'git fetch', desc: 'Download remote changes' }] },
    { category: 'Undo', commands: [{ cmd: 'git reset HEAD~1', desc: 'Undo last commit (keep changes)' }, { cmd: 'git reset --hard HEAD~1', desc: 'Undo last commit (discard)' }, { cmd: 'git revert <commit>', desc: 'Revert a commit' }, { cmd: 'git stash', desc: 'Stash changes' }, { cmd: 'git stash pop', desc: 'Apply stashed changes' }] },
  ]
}

// 53. Robots.txt Generator
export function generateRobotsTxt(rules: { allow: string[]; disallow: string[]; sitemap?: string; userAgent?: string }): string {
  const lines = [`User-agent: ${rules.userAgent || '*'}`]
  for (const d of rules.disallow) lines.push(`Disallow: ${d}`)
  for (const a of rules.allow) lines.push(`Allow: ${a}`)
  if (rules.sitemap) lines.push(`Sitemap: ${rules.sitemap}`)
  return lines.join('\n')
}

// 54. Docker Run to Compose (basic)
export function dockerRunToCompose(cmd: string): string {
  try {
    const parts = cmd.replace(/^docker\s+run\s+/, '').trim().split(/\s+/)
    const service: any = { image: '' }
    const env: string[] = []
    const ports: string[] = []
    const volumes: string[] = []
    let i = 0
    while (i < parts.length) {
      const p = parts[i]
      if (p === '-p' || p === '--port') { ports.push(parts[++i]) }
      else if (p === '-v' || p === '--volume') { volumes.push(parts[++i]) }
      else if (p === '-e' || p === '--env') { env.push(parts[++i]) }
      else if (p === '--name') { service.container_name = parts[++i] }
      else if (p === '--network') { service.networks = [parts[++i]] }
      else if (p === '--restart') { service.restart = parts[++i] }
      else if (p === '-d' || p === '--detach') { /* compose is detached by default */ }
      else if (!p.startsWith('-') && !service.image) { service.image = p }
      i++
    }
    if (ports.length) service.ports = ports
    if (volumes.length) service.volumes = volumes
    if (env.length) service.environment = env
    const yaml = ['services:', '  app:']
    for (const [k, v] of Object.entries(service)) {
      if (Array.isArray(v)) { yaml.push(`    ${k}:`); v.forEach((item: string) => yaml.push(`      - "${item}"`)) }
      else yaml.push(`    ${k}: ${v}`)
    }
    return yaml.join('\n')
  } catch { return 'Could not parse docker run command' }
}

// 55. JSON Diff
export function jsonDiff(a: any, b: any, path: string = ''): { path: string; type: string; value?: any; oldValue?: any }[] {
  const diffs: { path: string; type: string; value?: any; oldValue?: any }[] = []
  if (a === b) return diffs
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) {
    diffs.push({ path: path || '/', type: 'changed', value: b, oldValue: a }); return diffs
  }
  if (typeof a !== 'object' || a === null || b === null) {
    if (a !== b) diffs.push({ path: path || '/', type: 'changed', value: b, oldValue: a }); return diffs
  }
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of allKeys) {
    const p = path ? `${path}/${k}` : `/${k}`
    if (!(k in a)) diffs.push({ path: p, type: 'added', value: b[k] })
    else if (!(k in b)) diffs.push({ path: p, type: 'removed', oldValue: a[k] })
    else diffs.push(...jsonDiff(a[k], b[k], p))
  }
  return diffs
}

// 56. SQL Prettify (keyword-based)
const SQL_KW = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','ON','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','ALTER','DROP','TABLE','INDEX','VIEW','UNION','ALL','AS','DISTINCT','NOT','NULL','IN','BETWEEN','LIKE','EXISTS','CASE','WHEN','THEN','ELSE','END','BEGIN','COMMIT','ROLLBACK','TRUNCATE','GRANT','REVOKE']
const SQL_NEWLINE = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','ALTER','DROP','UNION','TRUNCATE','GRANT','REVOKE']
const SQL_INDENT = ['AND','OR','ON','WHEN','THEN','ELSE','SET','VALUES']
export function sqlPrettify(sql: string): string {
  let s = sql.replace(/\s+/g, ' ').trim()
  // Uppercase keywords (match longest first)
  const sorted = [...SQL_KW].sort((a, b) => b.length - a.length)
  for (const kw of sorted) {
    s = s.replace(new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi'), kw)
  }
  const lines: string[] = []
  const tokens = s.split(' ')
  let current = ''
  for (const tok of tokens) {
    const upper = tok.toUpperCase()
    const isNewline = SQL_NEWLINE.some(kw => kw === upper || (kw.includes(' ') && tokens.slice(tokens.indexOf(tok), tokens.indexOf(tok) + 2).join(' ').toUpperCase() === kw))
    const isIndent = SQL_INDENT.includes(upper)
    if (isIndent && current) { lines.push(current); current = '  ' + tok }
    else if (isNewline && current) { lines.push(current); current = tok }
    else { current += (current ? ' ' : '') + tok }
  }
  if (current) lines.push(current)
  return lines.join('\n')
}

// 57. XML to JSON (basic)
export function xmlToJSON(xml: string): string {
  try {
    const cleaned = xml.replace(/<\?[^?]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim()
    function parseNode(s: string): any {
      s = s.trim()
      const m = s.match(/^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/)
      if (!m) return s
      const attrs: Record<string, string> = {}
      const attrStr = m[2]
      const attrRe = /(\w+)="([^"]*)"/g
      let am: RegExpExecArray | null
      while ((am = attrRe.exec(attrStr))) attrs[`@${am[1]}`] = am[2]
      const children: any = Object.keys(attrs).length ? { ...attrs } : {}
      const inner = m[3].trim()
      const childRe = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>|<(\w+)([^>]*)\/>/g
      let cm: RegExpExecArray | null
      let hasChildren = false
      while ((cm = childRe.exec(inner))) {
        hasChildren = true
        const name = cm[1] || cm[4]
        const val = parseNode(cm[0])
        if (children[name] !== undefined) {
          if (!Array.isArray(children[name])) children[name] = [children[name]]
          children[name].push(val)
        } else children[name] = val
      }
      if (!hasChildren) {
        if (Object.keys(attrs).length) { children['#text'] = inner; return children }
        return isNaN(Number(inner)) ? (inner === 'true' ? true : inner === 'false' ? false : inner || '') : Number(inner)
      }
      return children
    }
    return JSON.stringify(parseNode(cleaned), null, 2)
  } catch { return '{ "error": "Invalid XML" }' }
}

// 58. JSON to XML
export function jsonToXML(jsonStr: string, rootName: string = 'root'): string {
  try {
    const obj = JSON.parse(jsonStr)
    function toXml(val: any, name: string, indent: number = 0): string {
      const pad = '  '.repeat(indent)
      if (val === null || val === undefined) return `${pad}<${name}/>`
      if (typeof val !== 'object') return `${pad}<${name}>${String(val)}</${name}>`
      if (Array.isArray(val)) return val.map(v => toXml(v, name, indent)).join('\n')
      const attrs: string[] = []
      const children: string[] = []
      for (const [k, v] of Object.entries(val)) {
        if (k.startsWith('@')) attrs.push(`${k.slice(1)}="${v}"`)
        else children.push(toXml(v, k, indent + 1))
      }
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : ''
      if (!children.length) return `${pad}<${name}${attrStr}/>`
      return `${pad}<${name}${attrStr}>\n${children.join('\n')}\n${pad}</${name}>`
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(obj, rootName)}`
  } catch { return '<error>Invalid JSON</error>' }
}

// 59. JSON to YAML
export function jsonToYAML(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr)
    function toYaml(val: any, indent: number = 0): string {
      const pad = '  '.repeat(indent)
      if (val === null || val === undefined) return 'null'
      if (typeof val === 'boolean' || typeof val === 'number') return String(val)
      if (typeof val === 'string') {
        if (/[:\n#\[\]{},&*?|>!%@`]/.test(val) || val === '' || val.trim() !== val) return `"${val.replace(/"/g, '\\"')}"`
        return val
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return '[]'
        return val.map(v => {
          const s = toYaml(v, indent + 1)
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            const lines = s.split('\n')
            return `${pad}- ${lines[0]}\n${lines.slice(1).map(l => `${pad}  ${l}`).join('\n')}`
          }
          return `${pad}- ${s}`
        }).join('\n')
      }
      const keys = Object.keys(val)
      if (keys.length === 0) return '{}'
      return keys.map(k => {
        const v = val[k]
        const ks = /[:\n#\[\]{},&*?|>!%@`\s]/.test(k) ? `"${k}"` : k
        if (typeof v === 'object' && v !== null) {
          const nested = toYaml(v, indent + 1)
          if ((Array.isArray(v) && v.length > 0) || (!Array.isArray(v) && Object.keys(v).length > 0)) return `${pad}${ks}:\n${nested}`
          return `${pad}${ks}: ${nested}`
        }
        return `${pad}${ks}: ${toYaml(v, indent + 1)}`
      }).join('\n')
    }
    return toYaml(obj)
  } catch { return 'Invalid JSON' }
}

// 60. YAML to JSON (basic)
export function yamlToJSON(yaml: string): string {
  try {
    const lines = yaml.split('\n')
    const root: any = {}
    const stack: { indent: number; obj: any }[] = [{ indent: -1, obj: root }]
    function parseVal(s: string): any {
      s = s.trim()
      if (s === 'null' || s === '~' || s === '') return null
      if (s === 'true') return true
      if (s === 'false') return false
      if (/^-?\d+$/.test(s)) return parseInt(s)
      if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s)
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
      if (s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1).split(',').map(v => parseVal(v.trim()))
      return s
    }
    for (const line of lines) {
      const raw = line.replace(/\r$/, '')
      if (raw.trim() === '' || raw.trim().startsWith('#')) continue
      const indent = raw.search(/\S/)
      const content = raw.trim()
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop()
      const parent = stack[stack.length - 1].obj
      if (content.startsWith('- ')) {
        const val = parseVal(content.slice(2))
        if (!Array.isArray(parent)) { /* skip */ }
        else parent.push(val)
      } else {
        const ci = content.indexOf(':')
        if (ci === -1) continue
        const key = content.slice(0, ci).trim().replace(/^['"']|['"']$/g, '')
        const vPart = content.slice(ci + 1).trim()
        if (vPart === '') {
          const child: any = {}
          parent[key] = child
          stack.push({ indent, obj: child })
        } else {
          parent[key] = parseVal(vPart)
        }
      }
    }
    return JSON.stringify(root, null, 2)
  } catch { return '{ "error": "Invalid YAML" }' }
}

// 61. Outlook Safelink Decoder
export function decodeSafelink(url: string): string {
  try {
    // @ts-ignore
    const u = new URL(url)
    const real = u.searchParams.get('url')
    return real ? decodeURIComponent(real) : url
  } catch { return url }
}

// 62. IPv4 Range Expander
export function ipv4RangeExpand(startIP: string, endIP: string): { cidr: string; count: number; range: string }[] {
  const toNum = (ip: string) => ip.split('.').reduce((a, o) => (a << 8) + parseInt(o), 0) >>> 0
  const toIP = (n: number) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255].join('.')
  const s = toNum(startIP), e = toNum(endIP)
  if (isNaN(s) || isNaN(e) || s > e) return []
  const blocks: { cidr: string; count: number; range: string }[] = []
  let current = s
  while (current <= e) {
    const maxBit = 32 - Math.floor(Math.log2(current || 1))
    let size = 1
    for (let bits = 0; bits < 32; bits++) {
      const blockSize = 1 << bits
      if (current + blockSize - 1 > e) break
      if ((current & (blockSize - 1)) !== 0) break
      size = blockSize
    }
    const cidr = 32 - Math.floor(Math.log2(size))
    blocks.push({ cidr: `${toIP(current)}/${cidr}`, count: size, range: `${toIP(current)} - ${toIP(current + size - 1)}` })
    current += size
  }
  return blocks
}

// 63. IBAN Validator (ISO 13616 mod-97)
export function validateIBAN(iban: string): { valid: boolean; country: string; bban: string; checkDigits: string; formatted: string } {
  const clean = iban.replace(/\s+/g, '').toUpperCase()
  if (clean.length < 5) return { valid: false, country: '', bban: '', checkDigits: '', formatted: clean }
  const country = clean.slice(0, 2)
  const check = clean.slice(2, 4)
  const bban = clean.slice(4)
  const rearranged = bban + country + check
  const numeric = rearranged.split('').map(c => { const code = c.charCodeAt(0); return code >= 65 ? (code - 55).toString() : c }).join('')
  let remainder = 0
  for (let i = 0; i < numeric.length; i++) remainder = (remainder * 10 + parseInt(numeric[i])) % 97
  const valid = remainder === 1
  const formatted = clean.replace(/(.{4})/g, '$1 ').trim()
  return { valid, country, bban, checkDigits: check, formatted }
}

// 64. Phone Parser (basic)
const PHONE_PREFIXES: Record<string, { country: string; len: number[] }> = {
  '1': { country: 'US/CA', len: [10] }, '7': { country: 'RU', len: [10] }, '20': { country: 'EG', len: [9] },
  '27': { country: 'ZA', len: [9] }, '30': { country: 'GR', len: [10] }, '31': { country: 'NL', len: [9] },
  '33': { country: 'FR', len: [9] }, '34': { country: 'ES', len: [9] }, '39': { country: 'IT', len: [10] },
  '44': { country: 'UK', len: [10] }, '49': { country: 'DE', len: [10, 11] }, '52': { country: 'MX', len: [10] },
  '55': { country: 'BR', len: [10, 11] }, '61': { country: 'AU', len: [9] }, '62': { country: 'ID', len: [10, 11] },
  '65': { country: 'SG', len: [8] }, '81': { country: 'JP', len: [10] }, '82': { country: 'KR', len: [10] },
  '86': { country: 'CN', len: [11] }, '90': { country: 'TR', len: [10] }, '91': { country: 'IN', len: [10] },
}
export function parsePhoneNumber(phone: string): { country: string; type: string; formatted: string; valid: boolean; e164: string } {
  const clean = phone.replace(/[\s\-.()]/g, '')
  const withPlus = clean.startsWith('+') ? clean.slice(1) : clean
  for (let len = 3; len >= 1; len--) {
    const prefix = withPlus.slice(0, len)
    if (PHONE_PREFIXES[prefix]) {
      const { country, len: validLens } = PHONE_PREFIXES[prefix]
      const national = withPlus.slice(len)
      const valid = validLens.includes(national.length)
      const formatted = `+${prefix} ${national.replace(/(\d{3})(?=\d)/g, '$1 ')}`.trim()
      return { country, type: national.startsWith('4') ? 'Mobile' : 'Fixed', formatted, valid, e164: `+${withPlus}` }
    }
  }
  return { country: 'Unknown', type: 'Unknown', formatted: phone, valid: false, e164: phone }
}

// 65. RSA Key Pair Generator
// Note: RSA key generation requires Web Crypto API (crypto.subtle) which is
// not available in the Scripting environment. Use AES encryption instead.
export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  return {
    publicKey: '⚠️ RSA key generation requires Web Crypto API which is not available in this environment.\nUse the Encrypt/Decrypt tool with AES-GCM instead.',
    privateKey: '⚠️ RSA key generation requires Web Crypto API which is not available in this environment.'
  }
}

// 66. List Converter
export function listConverter(input: string, opts: { sort?: boolean; unique?: boolean; reverse?: boolean; filterEmpty?: boolean; prefix?: string; suffix?: string; join?: string } = {}): string {
  let lines = input.split('\n')
  if (opts.filterEmpty !== false) lines = lines.filter(l => l.trim() !== '')
  if (opts.sort) lines.sort()
  if (opts.unique) lines = [...new Set(lines)]
  if (opts.reverse) lines.reverse()
  if (opts.prefix) lines = lines.map(l => opts.prefix + l)
  if (opts.suffix) lines = lines.map(l => l + opts.suffix)
  return lines.join(opts.join || '\n')
}

// 67. MAC Address Lookup (common OUI prefixes)
const OUI_DB: Record<string, string> = {
  '00:00:0C': 'Cisco', '00:03:93': 'Apple', '00:0C:29': 'VMware', '00:0D:3A': 'Microsoft Azure',
  '00:11:22': 'Cisco', '00:15:5D': 'Microsoft Hyper-V', '00:1A:11': 'Google', '00:1B:21': 'Intel',
  '00:1C:42': 'Parallels', '00:1E:67': 'Apple', '00:25:00': 'Apple', '00:26:08': 'Apple',
  '00:26:BB': 'Apple', '00:50:56': 'VMware', '00:9E:C8': 'Xiaomi', '00:A0:98': 'NetApp',
  '04:0C:CE': 'Apple', '08:00:27': 'VirtualBox', '0C:4D:E9': 'Apple', '10:68:3F': 'Samsung',
  '14:10:9F': 'Apple', '18:3E:EF': 'Huawei', '18:AF:61': 'Apple', '1C:1B:0D': 'Dell',
  '20:02:AF': 'Apple', '24:05:0F': 'Ubiquiti', '28:6F:7F': 'Xiaomi', '28:CD:C1': 'Apple',
  '2C:F0:5D': 'Apple', '30:10:E4': 'Apple', '34:97:F6': 'ASUSTek', '38:F9:D3': 'Apple',
  '3C:22:FB': 'Apple', '40:30:04': 'Apple', '44:38:39': 'Cumulus', '48:2C:A0': 'Xiaomi',
  '4C:32:75': 'Apple', '50:7A:55': 'Apple', '54:26:96': 'Apple', '58:55:CA': 'Apple',
  '5C:E9:1E': 'Apple', '60:F8:1D': 'Apple', '64:5A:ED': 'Apple', '68:5B:35': 'Apple',
  '6C:96:CF': 'Apple', '70:56:81': 'Apple', '74:40:BE': 'LG', '78:31:C1': 'Apple',
  '7C:D1:C3': 'Apple', '80:BE:05': 'Apple', '84:38:35': 'Apple', '88:66:A5': 'Apple',
  '8C:85:90': 'Apple', '90:9C:4A': 'Apple', '94:65:2D': 'OnePlus', '98:01:A7': 'Apple',
  '9C:20:7B': 'Apple', 'A0:99:9B': 'Apple', 'A4:83:E7': 'Apple', 'A8:66:7F': 'Apple',
  'AC:DE:48': 'Apple', 'B0:34:95': 'Apple', 'B8:27:EB': 'Raspberry Pi', 'B8:E8:56': 'Apple',
  'BC:D0:74': 'Apple', 'C0:CC:F8': 'Apple', 'C4:2C:03': 'Apple', 'C8:69:CD': 'Apple',
  'CC:46:D6': 'Cisco', 'D0:03:4B': 'Apple', 'D4:61:9D': 'Apple', 'D8:3A:DD': 'Raspberry Pi',
  'DC:A6:32': 'Raspberry Pi', 'E0:B9:BA': 'Apple', 'E4:5F:01': 'Raspberry Pi', 'E8:48:B8': 'Apple',
  'EC:FA:BC': 'Apple', 'F0:18:98': 'Apple', 'F0:B4:D2': 'Apple', 'F4:5C:89': 'Apple',
  'F8:FF:C2': 'Apple', 'FC:E6:6A': 'Samsung', '00:E0:4C': 'Realtek', '00:1D:D8': 'Microsoft',
  '94:10:3E': 'Samsung', 'A0:82:1F': 'Samsung', '30:96:FB': 'Samsung', 'C0:97:27': 'Samsung',
}
export function macAddressLookup(mac: string): { vendor: string; oui: string } {
  const clean = mac.replace(/[-.]/g, ':').toUpperCase()
  const prefix = clean.slice(0, 8)
  const vendor = OUI_DB[prefix] || 'Unknown'
  return { vendor, oui: prefix }
}

// 68. TOML to JSON (basic)
export function tomlToJSON(toml: string): string {
  try {
    const result: any = {}
    let current = result
    const path: any[] = [result]
    for (const line of toml.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const sectionM = trimmed.match(/^\[(\[)?([^\]]+)\](\])?$/)
      if (sectionM) {
        const key = sectionM[2].trim()
        current = path[0]
        const keys = key.split('.').map(k => k.trim().replace(/^['"']|['"']$/g, ''))
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {}
          current = current[keys[i]]
        }
        const finalKey = keys[keys.length - 1]
        if (sectionM[1]) { // [[array]]
          if (!current[finalKey]) current[finalKey] = []
          const item = {}
          current[finalKey].push(item)
          current = item
        } else {
          if (!current[finalKey]) current[finalKey] = {}
          current = current[finalKey]
        }
        continue
      }
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      current[key] = parseTomlVal(val)
    }
    return JSON.stringify(result, null, 2)
    function parseTomlVal(s: string): any {
      if (s === 'true') return true
      if (s === 'false') return false
      if (/^-?\d+$/.test(s)) return parseInt(s)
      if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s)
      if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1)
      if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1)
      if (s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1).split(',').map(v => parseTomlVal(v.trim()))
      return s
    }
  } catch { return '{ "error": "Invalid TOML" }' }
}

// 69. JSON to TOML
export function jsonToTOML(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr)
    const lines: string[] = []
    function emit(o: any, prefix: string[] = []) {
      const simpleKeys = Object.keys(o).filter(k => typeof o[k] !== 'object' || o[k] === null || Array.isArray(o[k]))
      const tableKeys = Object.keys(o).filter(k => typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k]))
      for (const k of simpleKeys) {
        const v = o[k]
        lines.push(`${k} = ${tomlVal(v)}`)
      }
      for (const k of tableKeys) {
        const path = [...prefix, k].map(p => /^[a-zA-Z0-9_-]+$/.test(p) ? p : `"${p}"`).join('.')
        lines.push('')
        lines.push(`[${path}]`)
        emit(o[k], [...prefix, k])
      }
    }
    emit(obj)
    return lines.join('\n')
    function tomlVal(v: any): string {
      if (v === null || v === undefined) return ''
      if (typeof v === 'boolean') return String(v)
      if (typeof v === 'number') return String(v)
      if (typeof v === 'string') return `"${v.replace(/"/g, '\\"')}"`
      if (Array.isArray(v)) return `[${v.map(tomlVal).join(', ')}]`
      return ''
    }
  } catch { return '# Invalid JSON' }
}

// 70. Chronometer format
export function chronometerFormat(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const msR = ms % 1000
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${msR.toString().padStart(3,'0')}`
}

// 71. Generate OTP
export function generateOTP(length: number = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10).toString()
  return code
}

// 72. Bcrypt-style password hashing (PBKDF2-SHA256 using native Crypto HMAC)
export async function bcryptHash(password: string, iterations: number = 600000): Promise<string> {
  const salt = randomBytes(16)
  // @ts-ignore — Data nullable in types but works at runtime
  const pwBytes = Data.fromString(password).toUint8Array()
  // @ts-ignore
  const hashBytes = pbkdf2_sha256(pwBytes, salt, iterations, 32)
  // @ts-ignore
  const saltB64 = Data.fromUint8Array(salt).toBase64String()
  // @ts-ignore
  const hashB64 = Data.fromUint8Array(hashBytes).toBase64String()
  return `$pbkdf2$${iterations}$${saltB64}$${hashB64}`
}

export async function bcryptVerify(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 5 || parts[1] !== 'pbkdf2') return false
    const iterations = parseInt(parts[2])
    // @ts-ignore
    const salt = Data.fromBase64String(parts[3]).toUint8Array()
    // @ts-ignore
    const pwBytes = Data.fromString(password).toUint8Array()
    // @ts-ignore
    const hashBytes = pbkdf2_sha256(pwBytes, salt, iterations, 32)
    // @ts-ignore
    const hashB64 = Data.fromUint8Array(hashBytes).toBase64String()
    return hashB64 === parts[4]
  } catch { return false }
}

// 73. YAML Prettify / Minify
export function yamlPrettify(yaml: string): string {
  const lines = yaml.split('\n')
  const result: string[] = []
  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (!trimmed || trimmed.startsWith('#')) { result.push(trimmed); continue }
    const indent = line.match(/^(\s*)/)?.[1] || ''
    const fixed = trimmed.replace(/^(\S+?)\s*:/, '$1: ')
    result.push(indent + fixed)
  }
  return result.join('\n')
}

export function yamlMinify(yaml: string): string {
  return yaml.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join('\n')
}

// 74. BIP39 Mnemonic Generator
const BIP39_WORDLIST = 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim airport aisle alarm album alcohol alert alien all alley almost alone alpha already also alter always amateur amazing among amount amuse anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below bench benefit best betray better between beyond bicycle bike bind biology bird birth bitter black blade blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box bracket brain brand brave bread breeze bridge brief bright bring brisk broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunny burden burger burst bus business busy butter buyer cabin cable cage cake call calm camera camp can cancel candy cannon canoe canvas canyon capable capital captain carbon card cargo carpet carry cart case cash castle casual catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase cheap check cheese chef chest chicken chief child chimney choice choose chunk churn citizen city civil claim clap clarify claw clay clerk clever click client cliff climb clinic clip clock close cloth cloud clown club clump cluster coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft crane crash crater crawl crazy cream credit crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crush cry crystal cube culture cup cupboard curious current curtain curve cushion customs cute cycle damage damp dance danger daring dash daughter dawn day debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip erase erode erosion error erupt escape essay essence estate eternal event evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eyebrow face faculty fade faint faith fall false fame family famous fancy fantasy farm fashion father fatigue fault favorite feature february federal feel female fence festival fetch fever few fiber fiction field figure file film filter final find finger finish fire firm fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern grace grain grant grape grass gravity great green grid grief grit grocery group grow guard guess guide guitar gun gym habit hair half hammer hamster hand happy harbor harsh harvest hawk hazard head health heart heavy hedgehog height hello helmet help hero high hill hint hire history hobby hockey hold hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact imply import impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar january jargon jealous jeans jelly jewel job join joke journey judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kidney kind kingdom kiss kitchen kite kitten kiwi knee knife knock know lab label labor ladder lake lamp language laptop large later laugh laundry lava lawn lawsuit layer lazy leader leaf learn leave lecture legal legend leisure lemon length lens leopard lesson letter level liberty library license life light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky lumber lunar lunch luxury lyrics machine magic magnet maid major make mammal manage mandate mango mansion manual maple marble march margin marine market marriage mask mass master match material math matrix matter maximum maze meadow measure media melody melt member memory mention menu mercy merge merit mesh method middle midnight milk million mimic mind minimum minor miracle mirror misery miss mistake mixture mobile model modify moment monitor monkey monster month moral morning mother motion motor mountain mouse move movie muffin multiply muscle museum mushroom music must mutual mystery myth naive name nasty nation nature near neck need negative neglect neither nephew nerve network neutral never news next nice night noble noise nominee normal north notable nothing notice novel nuclear number nurse obscure observe obtain obvious occur ocean offense office olive omit once one onion online open opera opinion oppose option orange orchard order organic orient orphan ostrich other outdoor outer output outside oval oven over own owner oxygen oyster ozone page pair palace palm panda panel panic panther paper parade parent park parrot party patch path patient patrol pattern pause pave payment peace peanut pear peasant pelican pen penalty pencil pepper perfect permit person pet phone photo phrase piano picnic picture piece pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pool popular portion position possible potato pottery poverty powder practice prefer prepare present prevent price pride primary print priority prison private prize problem process produce profit program promote proof property prosper protect proud public pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter queen question quick quit quiz quote rabbit raccoon radar radio rail rain raise rally ramp ranch random range rapid rather raven razor ready rebel recipe recycle reduce reflect reform region regret reject relax release relief rely remain remind remove render renew repeat replace report require rescue resist resource response result retire retreat return reunion reveal review reward rhythm rib ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road robot robust rocket romance roof rookie room rotate rough round route royal rubber rude rug rule run runway rural saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save scale scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shine ship shiver shock shoot shop shoulder shove shrimp shrug shuffle sibling siege silent silver simple since sister situate six size sketch ski skill skin skirt skull slab slam sleep slender slice slide slight slow slush small smart smile smoke smooth snack snake snap sniff snow soccer social sock soda soft solar soldier solid solution someone song sort soul sound source south space spare spatial spawn special sphere spike spine spirit split sponsor spoon sport spray spread spring squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stool story stove strategy street strike strong struggle student stuff stumble style subject submit subway success sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme surface surge surprise surround survey suspect sustain swallow swamp swap swarm swear sweet swim swing switch sword symbol symptom syrup system table tackle tag tail talent talk tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank theme theory there thing thought three thrive throw thunder ticket tide tiger timber time tiny tired title toast tobacco today toddler toe together toilet token tomato tomorrow tone tongue tonight tool tooth tornado total tourist toward tower town trade traffic train transfer trap travel tray treat tree trend trial tribe trick trigger trim trophy trouble truck true truly trumpet trust truth try tube tuna tunnel turkey turn turtle twelve twenty twice twin twist type typical ugly umbrella unable unaware uncle under unfold unhappy uniform union unique unit universe unknown unlock until unusual unveil update upgrade upon upper upset urban usage use used useful useless usual vacant vague valid valley valve vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash waste water wave wealth weapon wear weather wedding weekend welcome west whale wheat wheel when where whisper wide width wild will win window winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wrestle wrist wrong yard year yellow young youth zone zombie'.split(' ')

export function generateBIP39(wordCount: number = 12): string {
  const indices = new Uint16Array(wordCount)
  for (let i = 0; i < wordCount; i++) indices[i] = Math.floor(Math.random() * 2048)
  return Array.from(indices).map((i: number) => BIP39_WORDLIST[i % 2048]).join(' ')
}
