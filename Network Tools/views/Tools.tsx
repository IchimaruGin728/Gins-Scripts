// Tools — IT-Tools style utilities (all pure JS + Web Crypto)
// @ts-ignore — onResume works at runtime
import { useState, useEffect, VStack, HStack, Text, ScrollView, Button, TextField, Divider, Spacer, ProgressView, Picker, Toggle, Gauge, Image, Navigation, Script, onResume } from 'scripting'
import {
  md5, sha256, sha512, base64Encode, base64Decode,
  urlEncode, urlDecode, generateUUID, hmacSha256, calculateSubnet,
  generateToken, generateLorem, textStats, jsonPrettify, jsonMinify,
  convertCase, hexToRgb, rgbToHex, convertBase, regexTest, evaluateMath,
  analyzePassword, textToBinary, binaryToText, convertTemperature,
  calculateChmod, slugify, textDiff,
  parseJWT, htmlEncode, htmlDecode, parseCron, generateMAC,
  ipv4ToInt, intToIPv4,
  numberToWords, etaEstimate, generateULID, parseUserAgent,
  mimeLookup, basicAuthEncode, xmlPrettify, xmlMinify,
  generateIPv6ULA, epochToDate, dateToEpoch, formatFileSize,
  hexEncode, hexDecode, parseURL, formatDateInfo, numberToRoman, romanToNumber,
  textToNATO, textToUnicode, unicodeToText, randomPort, obfuscateString,
  calculatePercentage, normalizeEmail, emailValidator,
  jsonToCSV, encryptText, decryptText, generateTOTP, generateNumeronym,
  formatHttpStatus, getAllHttpStatusCodes, generateSVGPlaceholder,
  markdownToHTML, generateOpenGraphMeta, generateGitCheatsheet,
  generateRobotsTxt, dockerRunToCompose,
  jsonDiff, sqlPrettify, xmlToJSON, jsonToXML,
  jsonToYAML, yamlToJSON, decodeSafelink, ipv4RangeExpand,
  validateIBAN, parsePhoneNumber, generateRSAKeyPair,
  listConverter, macAddressLookup, tomlToJSON, jsonToTOML,
  chronometerFormat, generateOTP,
  bcryptHash, bcryptVerify, yamlPrettify, yamlMinify, generateBIP39
} from '../utils/encoding'

function safeFileName(name: string): string {
  return name.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 80) || 'file'
}
function makeQRUrl(text: string, size: number = 320): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
}
function makeWifiQRText(ssid: string, password: string, encryption: string, hidden: boolean): string {
  const esc = (s: string) => s.replace(/([\\;,":])/g, '\\$1')
  return `WIFI:T:${encryption};S:${esc(ssid)};P:${esc(password)};H:${hidden ? 'true' : 'false'};;`
}
function convertDateTime(input: string): Record<string, string> {
  const raw = input.trim()
  let d: Date
  if (!raw) d = new Date()
  else if (/^\d{10}$/.test(raw)) d = new Date(Number(raw) * 1000)
  else if (/^\d{13}$/.test(raw)) d = new Date(Number(raw))
  else d = new Date(raw)
  if (isNaN(d.getTime())) return { Error: 'Invalid date/time' }
  return {
    Local: d.toLocaleString(),
    UTC: d.toUTCString(),
    ISO: d.toISOString(),
    'Unix seconds': String(Math.floor(d.getTime() / 1000)),
    'Unix ms': String(d.getTime()),
    Date: d.toDateString(),
    Time: d.toTimeString(),
  }
}
function yamlToTomlText(input: string): string { return jsonToTOML(yamlToJSON(input)) }
function tomlToYamlText(input: string): string { return jsonToYAML(tomlToJSON(input)) }
function asciiArt(input: string): string {
  const font: Record<string, string[]> = {
    A:[' ### ','#   #','#####','#   #','#   #'], B:['#### ','#   #','#### ','#   #','#### '], C:[' ####','#    ','#    ','#    ',' ####'], D:['#### ','#   #','#   #','#   #','#### '], E:['#####','#    ','#### ','#    ','#####'], F:['#####','#    ','#### ','#    ','#    '], G:[' ####','#    ','#  ##','#   #',' ####'], H:['#   #','#   #','#####','#   #','#   #'], I:['#####','  #  ','  #  ','  #  ','#####'], J:['#####','   # ','   # ','#  # ',' ##  '], K:['#   #','#  # ','###  ','#  # ','#   #'], L:['#    ','#    ','#    ','#    ','#####'], M:['#   #','## ##','# # #','#   #','#   #'], N:['#   #','##  #','# # #','#  ##','#   #'], O:[' ### ','#   #','#   #','#   #',' ### '], P:['#### ','#   #','#### ','#    ','#    '], Q:[' ### ','#   #','# # #','#  # ',' ## #'], R:['#### ','#   #','#### ','#  # ','#   #'], S:[' ####','#    ',' ### ','    #','#### '], T:['#####','  #  ','  #  ','  #  ','  #  '], U:['#   #','#   #','#   #','#   #',' ### '], V:['#   #','#   #','#   #',' # # ','  #  '], W:['#   #','#   #','# # #','## ##','#   #'], X:['#   #',' # # ','  #  ',' # # ','#   #'], Y:['#   #',' # # ','  #  ','  #  ','  #  '], Z:['#####','   # ','  #  ',' #   ','#####'],
    '0':[' ### ','#  ##','# # #','##  #',' ### '], '1':['  #  ',' ##  ','  #  ','  #  ',' ### '], '2':[' ### ','#   #','   # ','  #  ','#####'], '3':['#### ','    #',' ### ','    #','#### '], '4':['#  # ','#  # ','#####','   # ','   # '], '5':['#####','#    ','#### ','    #','#### '], '6':[' ### ','#    ','#### ','#   #',' ### '], '7':['#####','   # ','  #  ',' #   ','#    '], '8':[' ### ','#   #',' ### ','#   #',' ### '], '9':[' ### ','#   #',' ####','    #',' ### '], ' ':['     ','     ','     ','     ','     ']
  }
  const lines = ['', '', '', '', '']
  for (const ch of input.toUpperCase()) {
    const glyph = font[ch] || ['?????','?   ?','?   ?','?   ?','?????']
    for (let i = 0; i < 5; i++) lines[i] += glyph[i] + '  '
  }
  return lines.join('\n')
}
function generateCrontab(min: string, hour: string, dom: string, mon: string, dow: string): string {
  return `${min || '*'} ${hour || '*'} ${dom || '*'} ${mon || '*'} ${dow || '*'}`
}
async function presentKeycodeInfo(): Promise<void> {
  const html = `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:-apple-system;padding:24px"><h1>Keycode Info</h1><input autofocus placeholder="Tap here and press keys" style="font-size:22px;padding:12px;width:100%"><pre id="out" style="font-size:16px;background:#f2f2f7;padding:16px;border-radius:12px">Press any key…</pre><script>addEventListener('keydown',e=>{out.textContent=JSON.stringify({key:e.key,code:e.code,keyCode:e.keyCode,which:e.which,alt:e.altKey,ctrl:e.ctrlKey,shift:e.shiftKey,meta:e.metaKey,location:e.location},null,2)})</script></body></html>`
  const w = new WebViewController()
  await w.loadHTML(html)
  await w.present({ navigationTitle: 'Keycode Info' })
  w.dispose()
}
async function presentHtmlEditor(initial: string): Promise<string> {
  const html = `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:-apple-system;margin:0"><div contenteditable id="ed" style="min-height:85vh;padding:18px;font-size:17px;outline:none">${initial || '<h1>Hello</h1><p>Edit HTML here…</p>'}</div><script>document.body.style.background='#fff'</script></body></html>`
  const w = new WebViewController()
  await w.loadHTML(html)
  await w.present({ navigationTitle: 'HTML Editor' })
  const out = await w.evaluateJavaScript<string>('return document.getElementById("ed").innerHTML')
  w.dispose()
  return out || ''
}
async function analyzePdfFile(path: string): Promise<Record<string, string>> {
  const data = Data.fromFile(path)
  if (!data) return { Error: 'Cannot read file' }
  const txt = data.toRawString() || ''
  const name = path.split('/').pop() || 'PDF'
  let hash = ''
  try { hash = Crypto.sha256(data).toHexString() } catch {}
  return {
    File: name,
    Size: formatFileSize(data.size),
    PDF: txt.includes('%PDF') ? 'Yes' : 'Unknown',
    Signed: txt.includes('/ByteRange') || txt.includes('/Sig') ? 'Likely signed' : 'No signature markers found',
    ByteRange: txt.includes('/ByteRange') ? 'Found' : 'Not found',
    Contents: txt.includes('/Contents') ? 'Found' : 'Not found',
    Filter: (txt.match(/\/Filter\s*\/([A-Za-z0-9]+)/)?.[1] || 'Unknown'),
    SHA256: hash,
  }
}

const CIDR_PRESETS = [8, 16, 24, 25, 26, 27, 28, 29, 30, 32]

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack>
      <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 100 }}>{label}</Text>
      <Spacer />
      <Text font="subheadline">{value}</Text>
    </HStack>
  )
}

export default function ToolsView() {
  const dismiss = Navigation.useDismiss()

  // Reset loading on resume
  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) {
        setHashLoading(false)
        setUuidLoading(false)
      }
    })
    return dispose
  }, [])

  // Subnet state
  const [subnetIP, setSubnetIP] = useState('192.168.1.0')
  const [subnetCIDR, setSubnetCIDR] = useState(3)
  const [subnetResult, setSubnetResult] = useState<ReturnType<typeof calculateSubnet>>(null)

  // Hash state
  const [hashInput, setHashInput] = useState('')
  const [hashResults, setHashResults] = useState<Record<string, string>>({})
  const [hashLoading, setHashLoading] = useState(false)

  // HMAC state
  const [hmacInput, setHmacInput] = useState('')
  const [hmacKey, setHmacKey] = useState('')
  const [hmacResult, setHmacResult] = useState('')
  const [hmacLoading, setHmacLoading] = useState(false)

  // Base64 state
  const [b64Input, setB64Input] = useState('')
  const [b64Output, setB64Output] = useState('')

  // URL encode state
  const [urlInput, setUrlInput] = useState('')
  const [urlOutput, setUrlOutput] = useState('')

  // UUID state
  const [uuidValue, setUuidValue] = useState('')
  const [uuidLoading, setUuidLoading] = useState(false)

  // Token state
  const [tokenLen, setTokenLen] = useState(32)
  const [tokenCharset, setTokenCharset] = useState(0)
  const [tokenValue, setTokenValue] = useState('')

  // Lorem state
  const [loremCount, setLoremCount] = useState(3)
  const [loremText, setLoremText] = useState('')

  // Text Stats state
  const [statsInput, setStatsInput] = useState('')
  const [statsResult, setStatsResult] = useState<ReturnType<typeof textStats> | null>(null)

  // JSON state
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')

  // Case state
  const [caseInput, setCaseInput] = useState('')
  const [caseMode, setCaseMode] = useState(0)
  const [caseOutput, setCaseOutput] = useState('')

  // Color state
  const [colorInput, setColorInput] = useState('#007AFF')
  const [colorOutput, setColorOutput] = useState('')
  const [colorDir, setColorDir] = useState(0) // 0=hex→rgb, 1=rgb→hex

  // Base converter state
  const [baseInput, setBaseInput] = useState('255')
  const [baseFrom, setBaseFrom] = useState(3) // 0=bin,1=oct,2=dec,3=hex
  const [baseOutput, setBaseOutput] = useState('')

  // Regex state
  const [regexPattern, setRegexPattern] = useState('')
  const [regexText, setRegexText] = useState('')
  const [regexFlags, setRegexFlags] = useState('')
  const [regexResult, setRegexResult] = useState<string[]>([])
  const [regexError, setRegexError] = useState('')

  // Math state
  const [mathInput, setMathInput] = useState('')
  const [mathOutput, setMathOutput] = useState('')

  // Password state
  const [pwdInput, setPwdInput] = useState('')
  const [pwdResult, setPwdResult] = useState<ReturnType<typeof analyzePassword> | null>(null)

  // Binary state
  const [binInput, setBinInput] = useState('')
  const [binOutput, setBinOutput] = useState('')
  const [binDir, setBinDir] = useState(0) // 0=text→bin, 1=bin→text

  // Temp state
  const [tempInput, setTempInput] = useState('')
  const [tempFrom, setTempFrom] = useState(0)
  const [tempTo, setTempTo] = useState(1)
  const [tempOutput, setTempOutput] = useState('')

  // Chmod state
  const [chmodU, setChmodU] = useState([true, true, true])
  const [chmodG, setChmodG] = useState([true, false, true])
  const [chmodO, setChmodO] = useState([true, false, true])
  const [chmodResult, setChmodResult] = useState('')

  // Slugify state
  const [slugInput, setSlugInput] = useState('')
  const [slugOutput, setSlugOutput] = useState('')

  // Diff state
  const [diffA, setDiffA] = useState('')
  const [diffB, setDiffB] = useState('')
  const [diffResult, setDiffResult] = useState<Array<{ type: string; line: string }>>([])

  // JWT state
  const [jwtInput, setJwtInput] = useState('')
  const [jwtHeader, setJwtHeader] = useState('')
  const [jwtPayload, setJwtPayload] = useState('')
  const [jwtError, setJwtError] = useState('')

  // HTML Entities state
  const [htmlInput, setHtmlInput] = useState('')
  const [htmlOutput, setHtmlOutput] = useState('')
  const [htmlDir, setHtmlDir] = useState(0) // 0=encode, 1=decode

  // Cron state
  const [cronInput, setCronInput] = useState('*/5 * * * *')
  const [cronOutput, setCronOutput] = useState('')

  // MAC state
  const [macSep, setMacSep] = useState(0) // 0=:, 1=-, 2=none
  const [macValue, setMacValue] = useState('')

  // IPv4 Converter state
  const [ipv4Input, setIpv4Input] = useState('192.168.1.1')
  const [ipv4Output, setIpv4Output] = useState('')

  // Number to Words state
  const [numInput, setNumInput] = useState('12345')
  const [numOutput, setNumOutput] = useState('')

  // ETA Estimator state
  const [etaTotal, setEtaTotal] = useState('100')
  const [etaDone, setEtaDone] = useState('30')
  const [etaElapsed, setEtaElapsed] = useState('10')
  const [etaOutput, setEtaOutput] = useState<{ remaining: string; rate: string; eta: string } | null>(null)

  // ULID state
  const [ulidValue, setUlidValue] = useState('')

  // User-Agent state
  const [uaInput, setUaInput] = useState('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
  const [uaOutput, setUaOutput] = useState<{ browser: string; version: string; os: string; device: string } | null>(null)

  // MIME state
  const [mimeInput, setMimeInput] = useState('json')
  const [mimeOutput, setMimeOutput] = useState<{ type: string; description: string } | null>(null)

  // Basic Auth state
  const [baUser, setBaUser] = useState('')
  const [baPass, setBaPass] = useState('')
  const [baOutput, setBaOutput] = useState('')

  // XML state
  const [xmlInput, setXmlInput] = useState('')
  const [xmlOutput, setXmlOutput] = useState('')

  // IPv6 ULA state
  const [ulaValue, setUlaValue] = useState('')

  // Epoch state
  const [epochInput, setEpochInput] = useState(String(Math.floor(Date.now() / 1000)))
  const [epochOutput, setEpochOutput] = useState('')
  const [epochDir, setEpochDir] = useState(0) // 0=epoch→date, 1=date→epoch

  // File Size state
  const [sizeInput, setSizeInput] = useState('1048576')
  const [sizeOutput, setSizeOutput] = useState('')

  // Hex String state
  const [hexStrInput, setHexStrInput] = useState('')
  const [hexStrOutput, setHexStrOutput] = useState('')
  const [hexStrDir, setHexStrDir] = useState(0) // 0=text→hex, 1=hex→text

  // New tool states
  const [urlParseInput, setUrlParseInput] = useState('')
  const [urlParseResult, setUrlParseResult] = useState<any>(null)
  const [romanInput, setRomanInput] = useState('')
  const [romanOutput, setRomanOutput] = useState('')
  const [romanDir, setRomanDir] = useState(0)
  const [natoInput, setNatoInput] = useState('')
  const [natoOutput, setNatoOutput] = useState('')
  const [uniInput, setUniInput] = useState('')
  const [uniOutput, setUniOutput] = useState('')
  const [uniDir, setUniDir] = useState(0)
  const [portValue, setPortValue] = useState(0)
  const [obfInput, setObfInput] = useState('')
  const [obfOutput, setObfOutput] = useState('')
  const [pctVal, setPctVal] = useState('')
  const [pctTotal, setPctTotal] = useState('')
  const [pctResult, setPctResult] = useState('')
  const [emailNormInput, setEmailNormInput] = useState('')
  const [emailNormOutput, setEmailNormOutput] = useState('')
  const [emailValidInput, setEmailValidInput] = useState('')
  const [emailValidResult, setEmailValidResult] = useState('')
  const [csvJsonInput, setCsvJsonInput] = useState('')
  const [csvOutput, setCsvOutput] = useState('')
  const [encInput, setEncInput] = useState('')
  const [encPass, setEncPass] = useState('')
  const [encOutput, setEncOutput] = useState('')
  const [encLoading, setEncLoading] = useState(false)
  const [totpSecret, setTotpSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpRemaining, setTotpRemaining] = useState(0)
  const [numerInput, setNumerInput] = useState('')
  const [numerOutput, setNumerOutput] = useState('')
  const [httpCodeInput, setHttpCodeInput] = useState('')
  const [httpCodeResult, setHttpCodeResult] = useState<any>(null)
  const [svgW, setSvgW] = useState('300')
  const [svgH, setSvgH] = useState('200')
  const [svgText, setSvgText] = useState('')
  const [svgOutput, setSvgOutput] = useState('')
  const [mdInput, setMdInput] = useState('# Hello\nThis is **bold**')
  const [mdOutput, setMdOutput] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDesc, setOgDesc] = useState('')
  const [ogUrl, setOgUrl] = useState('')
  const [ogOutput, setOgOutput] = useState('')
  const [gitData, setGitData] = useState<any>(null)
  const [robotsAllow, setRobotsAllow] = useState('/')
  const [robotsDisallow, setRobotsDisallow] = useState('')
  const [robotsSitemap, setRobotsSitemap] = useState('')
  const [robotsOutput, setRobotsOutput] = useState('')
  const [dockerInput, setDockerInput] = useState('')
  const [dockerOutput, setDockerOutput] = useState('')
  const [jsonDiffA, setJsonDiffA] = useState('')
  const [jsonDiffB, setJsonDiffB] = useState('')
  const [jsonDiffResult, setJsonDiffResult] = useState('')
  const [sqlInput, setSqlInput] = useState('')
  const [sqlOutput, setSqlOutput] = useState('')
  const [xmlJsonInput, setXmlJsonInput] = useState('')
  const [xmlJsonOutput, setXmlJsonOutput] = useState('')
  const [jsonXmlInput, setJsonXmlInput] = useState('')
  const [jsonXmlOutput, setJsonXmlOutput] = useState('')
  const [jsonYamlInput, setJsonYamlInput] = useState('')
  const [jsonYamlOutput, setJsonYamlOutput] = useState('')
  const [yamlJsonInput, setYamlJsonInput] = useState('')
  const [yamlJsonOutput, setYamlJsonOutput] = useState('')
  const [safelinkInput, setSafelinkInput] = useState('')
  const [safelinkOutput, setSafelinkOutput] = useState('')
  const [rangeStartIp, setRangeStartIp] = useState('')
  const [rangeEndIp, setRangeEndIp] = useState('')
  const [rangeResult, setRangeResult] = useState<any[]>([])
  const [ibanInput, setIbanInput] = useState('')
  const [ibanResult, setIbanResult] = useState<any>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneResult, setPhoneResult] = useState<any>(null)
  const [rsaKeys, setRsaKeys] = useState<any>(null)
  const [rsaLoading, setRsaLoading] = useState(false)
  const [listInput, setListInput] = useState('')
  const [listOutput, setListOutput] = useState('')
  const [listSort, setListSort] = useState(false)
  const [listUnique, setListUnique] = useState(false)
  const [listReverse, setListReverse] = useState(false)
  const [macLookupInput, setMacLookupInput] = useState('')
  const [macLookupResult, setMacLookupResult] = useState<any>(null)
  const [tomlJsonInput, setTomlJsonInput] = useState('')
  const [tomlJsonOutput, setTomlJsonOutput] = useState('')
  const [jsonTomlInput, setJsonTomlInput] = useState('')
  const [jsonTomlOutput, setJsonTomlOutput] = useState('')
  const [chronoInput, setChronoInput] = useState('')
  const [chronoOutput, setChronoOutput] = useState('')
  const [otpLen, setOtpLen] = useState(6)
  const [otpValue, setOtpValue] = useState('')
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  // Bcrypt state
  const [bcInput, setBcInput] = useState('')
  const [bcHash, setBcHash] = useState('')
  const [bcVerifyPwd, setBcVerifyPwd] = useState('')
  const [bcVerifyHash, setBcVerifyHash] = useState('')
  const [bcVerifyResult, setBcVerifyResult] = useState('')
  const [bcLoading, setBcLoading] = useState(false)
  const [bcIter, setBcIter] = useState(0)

  // YAML Prettify state
  const [yamlInput, setYamlInput] = useState('')
  const [yamlOutput, setYamlOutput] = useState('')

  // BIP39 state
  const [bip39Count, setBip39Count] = useState(0) // 0=12, 1=15, 2=24
  const [bip39Output, setBip39Output] = useState('')

  // Regex Cheatsheet state
  const [regexCheatCat, setRegexCheatCat] = useState(0)

  // Emoji Picker state
  const [emojiSearch, setEmojiSearch] = useState('')
  const [emojiCopied, setEmojiCopied] = useState('')

  // Benchmark Builder state
  const [benchTasks, setBenchTasks] = useState<string[]>(['', ''])
  const [benchResults, setBenchResults] = useState<number[]>([])
  const [benchRunning, setBenchRunning] = useState(false)

  // it-tools missing tools state
  const [qrInput, setQrInput] = useState('https://it-tools.tech')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [wifiEnc, setWifiEnc] = useState(0)
  const [wifiHidden, setWifiHidden] = useState(false)
  const [b64FileResult, setB64FileResult] = useState('')
  const [dateTimeInput, setDateTimeInput] = useState('')
  const [dateTimeResult, setDateTimeResult] = useState<Record<string, string> | null>(null)
  const [ytInput, setYtInput] = useState('')
  const [ytOutput, setYtOutput] = useState('')
  const [tyInput, setTyInput] = useState('')
  const [tyOutput, setTyOutput] = useState('')
  const [asciiInput, setAsciiInput] = useState('IT Tools')
  const [asciiOutput, setAsciiOutput] = useState('')
  const [cronMin, setCronMin] = useState('*')
  const [cronHour, setCronHour] = useState('*')
  const [cronDom, setCronDom] = useState('*')
  const [cronMon, setCronMon] = useState('*')
  const [cronDow, setCronDow] = useState('*')
  const [cronGenOutput, setCronGenOutput] = useState('')
  const [htmlEditorInput, setHtmlEditorInput] = useState('<h1>Hello</h1><p>Edit me</p>')
  const [htmlEditorOutput, setHtmlEditorOutput] = useState('')
  const [cameraResult, setCameraResult] = useState('')
  const [pdfResult, setPdfResult] = useState<Record<string, string> | null>(null)

  // Search & category filter
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const TOOL_CATEGORIES = [
    { key: 'all', label: '全部', icon: 'square.grid.2x2' },
    { key: 'crypto', label: '加密', icon: 'lock.shield' },
    { key: 'convert', label: '转换', icon: 'arrow.left.arrow.right' },
    { key: 'text', label: '文本', icon: 'text.alignleft' },
    { key: 'network', label: '网络', icon: 'network' },
    { key: 'web', label: 'Web', icon: 'globe' },
    { key: 'dev', label: '开发', icon: 'chevron.left.forwardslash.chevron.right' },
    { key: 'gen', label: '生成', icon: 'wand.and.stars' },
    { key: 'math', label: '数学', icon: 'function' },
  ]
  // Pre-compute tool count per category
  const TOOL_CAT_MAP: Record<string, string[]> = {
    crypto: ['Hash Calculator', 'HMAC Generator', 'Password Strength', 'RSA Key Pair Generator', 'Encrypt / Decrypt Text', 'TOTP Generator', 'Bcrypt Generator', 'BIP39 Mnemonic'],
    convert: ['Base64', 'Base64 File Converter', 'URL Encode/Decode', 'JSON Formatter', 'Case Converter', 'Color Converter', 'Base Converter', 'Text ↔ Binary', 'Temperature', 'Date-time Converter', 'Unix Epoch Converter', 'File Size Formatter', 'Hex String Converter', 'XML Formatter', 'JSON ⇄ YAML', 'YAML ⇄ TOML', 'XML ⇄ JSON', 'TOML ⇄ JSON', 'Roman Numeral Converter', 'Unicode Converter', 'Markdown to HTML', 'JSON to CSV', 'YAML Prettify', 'List Converter'],
    text: ['Lorem Ipsum', 'Text Statistics', 'Text Diff', 'Slugify', 'Numeronym Generator', 'String Obfuscator', 'Text to NATO Alphabet', 'ASCII Art Text Generator', 'Emoji Picker'],
    network: ['Subnet Calculator', 'IPv4 Converter', 'IPv6 ULA Generator', 'IPv4 Range Expander', 'MAC Address Lookup', 'Random Port Generator'],
    web: ['HTML Entities', 'User-Agent Parser', 'MIME Type Lookup', 'Basic Auth Generator', 'URL Parser', 'HTTP Status Codes', 'SVG Placeholder', 'QR Code Generator', 'WiFi QR Code Generator', 'Open Graph Meta', 'Robots.txt Generator', 'Outlook Safelink Decoder', 'HTML WYSIWYG Editor', 'Camera Recorder', 'Device Information'],
    dev: ['Regex Tester', 'Chmod Calculator', 'JWT Parser', 'Cron Parser', 'Crontab Generator', 'Keycode Info', 'SQL Prettify', 'JSON Diff', 'Docker Run to Compose', 'Git Cheatsheet', 'IBAN Validator', 'Phone Number Parser', 'Email Tools', 'Regex Cheatsheet', 'PDF Signature Checker'],
    gen: ['UUID Generator', 'Token Generator', 'MAC Address Generator', 'ULID Generator', 'OTP Generator'],
    math: ['Math Evaluator', 'Number to Words', 'ETA Estimator', 'Percentage Calculator', 'Chronometer', 'Benchmark Builder'],
  }
  function getCatCount(key: string): number {
    if (key === 'all') return Object.values(TOOL_CAT_MAP).reduce((s, a) => s + a.length, 0)
    return TOOL_CAT_MAP[key]?.length || 0
  }
  const TOOL_META: Record<string, { icon: string; color: string; desc: string }> = {
    'Subnet Calculator': { icon: 'chart.bar', color: '#007AFF', desc: 'CIDR子网' },
    'Hash Calculator': { icon: 'lock.doc', color: '#FF9500', desc: 'MD5/SHA哈希' },
    'HMAC Generator': { icon: 'key', color: '#FF2D55', desc: 'HMAC签名' },
    'Base64': { icon: 'doc.on.doc', color: '#007AFF', desc: 'Base64编解码' },
    'Base64 File Converter': { icon: 'doc.badge.gearshape', color: '#007AFF', desc: '文件Base64' },
    'URL Encode/Decode': { icon: 'link', color: '#34C759', desc: 'URL编解码' },
    'UUID Generator': { icon: 'rectangle.on.rectangle', color: '#5856D6', desc: '生成UUID' },
    'Token Generator': { icon: 'lock.rotation', color: '#FF9500', desc: '随机令牌' },
    'Lorem Ipsum': { icon: 'text.quote', color: '#8E8E93', desc: '假文生成' },
    'Text Statistics': { icon: 'text.word.spacing', color: '#007AFF', desc: '文本统计' },
    'JSON Formatter': { icon: 'curlybraces', color: '#FF9500', desc: 'JSON格式化' },
    'Case Converter': { icon: 'textformat', color: '#34C759', desc: '大小写转换' },
    'Color Converter': { icon: 'paintpalette', color: '#FF2D55', desc: '颜色转换' },
    'Base Converter': { icon: 'number', color: '#007AFF', desc: '进制转换' },
    'Regex Tester': { icon: 'text.magnifyingglass', color: '#FF9500', desc: '正则测试' },
    'Math Evaluator': { icon: 'function', color: '#5856D6', desc: '数学计算' },
    'Password Strength': { icon: 'lock.shield', color: '#34C759', desc: '密码强度' },
    'Text ↔ Binary': { icon: 'binarycode', color: '#FF2D55', desc: '文本↔二进制' },
    'Temperature': { icon: 'thermometer', color: '#FF9500', desc: '温度转换' },
    'Date-time Converter': { icon: 'calendar.badge.clock', color: '#007AFF', desc: '日期时间转换' },
    'Chmod Calculator': { icon: 'lock.rectangle', color: '#007AFF', desc: '权限计算' },
    'Slugify': { icon: 'textformat.abc', color: '#5856D6', desc: 'URL Slug' },
    'Text Diff': { icon: 'doc.plaintext', color: '#FF9500', desc: '文本对比' },
    'JWT Parser': { icon: 'key.viewfinder', color: '#FF9500', desc: 'JWT解析' },
    'HTML Entities': { icon: 'chevron.left.forwardslash.chevron.right', color: '#34C759', desc: 'HTML实体' },
    'Cron Parser': { icon: 'clock.badge.questionmark', color: '#FF2D55', desc: 'Cron解析' },
    'Crontab Generator': { icon: 'calendar.badge.plus', color: '#FF2D55', desc: 'Crontab生成' },
    'Keycode Info': { icon: 'keyboard', color: '#5856D6', desc: '按键代码' },
    'MAC Address Generator': { icon: 'wifi', color: '#5856D6', desc: 'MAC生成' },
    'IPv4 Converter': { icon: 'number.square', color: '#007AFF', desc: 'IPv4转换' },
    'Number to Words': { icon: 'textformat.123', color: '#5856D6', desc: '数字→文字' },
    'ETA Estimator': { icon: 'clock.arrow.circlepath', color: '#FF9500', desc: '预估时间' },
    'ULID Generator': { icon: 'barcode', color: '#007AFF', desc: '生成ULID' },
    'User-Agent Parser': { icon: 'desktopcomputer', color: '#FF9500', desc: 'UA解析' },
    'MIME Type Lookup': { icon: 'doc.text', color: '#34C759', desc: 'MIME查询' },
    'Basic Auth Generator': { icon: 'person.badge.key', color: '#FF2D55', desc: 'Basic认证' },
    'XML Formatter': { icon: 'doc.text.magnifyingglass', color: '#FF9500', desc: 'XML格式化' },
    'IPv6 ULA Generator': { icon: 'network', color: '#5856D6', desc: 'IPv6 ULA' },
    'Unix Epoch Converter': { icon: 'clock', color: '#007AFF', desc: '时间戳' },
    'File Size Formatter': { icon: 'internaldrive', color: '#34C759', desc: '文件大小' },
    'Hex String Converter': { icon: 'hexagon', color: '#FF9500', desc: '十六进制' },
    'URL Parser': { icon: 'link', color: '#007AFF', desc: 'URL解析' },
    'Roman Numeral Converter': { icon: 'textformat.size', color: '#FF9500', desc: '罗马数字' },
    'Text to NATO Alphabet': { icon: 'person.wave.2', color: '#30D158', desc: 'NATO字母' },
    'ASCII Art Text Generator': { icon: 'textformat.size.larger', color: '#5856D6', desc: 'ASCII艺术字' },
    'Unicode Converter': { icon: 'globe', color: '#5856D6', desc: 'Unicode' },
    'Random Port Generator': { icon: 'die.face.5', color: '#FF2D55', desc: '随机端口' },
    'String Obfuscator': { icon: 'eye.slash', color: '#8E8E93', desc: '字符串混淆' },
    'Percentage Calculator': { icon: 'percent', color: '#007AFF', desc: '百分比' },
    'Email Tools': { icon: 'envelope', color: '#007AFF', desc: '邮件工具' },
    'JSON to CSV': { icon: 'tablecells', color: '#34C759', desc: 'JSON→CSV' },
    'Encrypt / Decrypt Text': { icon: 'lock.rotation', color: '#FF2D55', desc: '文本加解密' },
    'TOTP Generator': { icon: 'shield.checkerboard', color: '#FF9500', desc: 'TOTP生成' },
    'Numeronym Generator': { icon: 'textformat.abc.dottedunderline', color: '#5856D6', desc: '缩写生成' },
    'HTTP Status Codes': { icon: 'number.square', color: '#007AFF', desc: 'HTTP状态码' },
    'SVG Placeholder': { icon: 'photo', color: '#FF9500', desc: 'SVG占位图' },
    'QR Code Generator': { icon: 'qrcode', color: '#007AFF', desc: '二维码生成' },
    'WiFi QR Code Generator': { icon: 'wifi', color: '#34C759', desc: 'WiFi二维码' },
    'Markdown to HTML': { icon: 'doc.richtext', color: '#34C759', desc: 'MD→HTML' },
    'Open Graph Meta': { icon: 'safari', color: '#FF2D55', desc: 'OG标签' },
    'Git Cheatsheet': { icon: 'chevron.left.forwardslash.chevron.right', color: '#FF9500', desc: 'Git速查' },
    'Robots.txt Generator': { icon: 'lock.shield', color: '#30D158', desc: 'Robots.txt' },
    'Docker Run to Compose': { icon: 'shippingbox', color: '#007AFF', desc: 'Docker转换' },
    'JSON Diff': { icon: 'arrow.left.arrow.right', color: '#FF9500', desc: 'JSON对比' },
    'SQL Prettify': { icon: 'database', color: '#FF2D55', desc: 'SQL格式化' },
    'XML ⇄ JSON': { icon: 'arrow.triangle.2.circlepath', color: '#34C759', desc: 'XML↔JSON' },
    'YAML ⇄ TOML': { icon: 'arrow.left.arrow.right.circle', color: '#34C759', desc: 'YAML↔TOML' },
    'JSON ⇄ YAML': { icon: 'arrow.triangle.2.circlepath', color: '#007AFF', desc: 'JSON↔YAML' },
    'TOML ⇄ JSON': { icon: 'doc.plaintext', color: '#FF9500', desc: 'TOML↔JSON' },
    'Outlook Safelink Decoder': { icon: 'link.badge.plus', color: '#007AFF', desc: 'Safelink' },
    'IPv4 Range Expander': { icon: 'arrow.up.left.and.arrow.down.right', color: '#34C759', desc: 'IP范围扩展' },
    'IBAN Validator': { icon: 'creditcard', color: '#FF9500', desc: 'IBAN验证' },
    'Phone Number Parser': { icon: 'phone', color: '#007AFF', desc: '电话解析' },
    'RSA Key Pair Generator': { icon: 'key.fill', color: '#FF2D55', desc: 'RSA密钥对' },
    'List Converter': { icon: 'list.bullet', color: '#34C759', desc: '列表转换' },
    'MAC Address Lookup': { icon: 'wifi', color: '#5856D6', desc: 'MAC查询' },
    'Chronometer': { icon: 'stopwatch', color: '#FF2D55', desc: '计时器' },
    'OTP Generator': { icon: 'shield.checkerboard', color: '#FF9500', desc: 'OTP生成' },
    'Bcrypt Generator': { icon: 'lock.fill', color: '#34C759', desc: 'Bcrypt哈希' },
    'YAML Prettify': { icon: 'doc.text', color: '#FF9500', desc: 'YAML格式化' },
    'BIP39 Mnemonic': { icon: 'key.fill', color: '#5856D6', desc: 'BIP39助记词' },
    'Regex Cheatsheet': { icon: 'doc.text.magnifyingglass', color: '#FF9500', desc: '正则速查' },
    'Device Information': { icon: 'iphone', color: '#FF9500', desc: '设备信息' },
    'HTML WYSIWYG Editor': { icon: 'character.cursor.ibeam', color: '#34C759', desc: 'HTML编辑器' },
    'Camera Recorder': { icon: 'camera', color: '#FF2D55', desc: '拍照录像' },
    'PDF Signature Checker': { icon: 'signature', color: '#FF9500', desc: 'PDF签名检查' },
    'Emoji Picker': { icon: 'face.smiling', color: '#FFD60A', desc: 'Emoji选择' },
    'Benchmark Builder': { icon: 'gauge.high', color: '#007AFF', desc: '性能测试' },
  }
  function getFilteredTools(): { name: string; cat: string; icon: string; color: string; desc: string; keywords: string[] }[] {
    const allTools: { name: string; cat: string; icon: string; color: string; desc: string; keywords: string[] }[] = []
    for (const [cat, names] of Object.entries(TOOL_CAT_MAP)) {
      for (const name of names) {
        const meta = TOOL_META[name] || { icon: 'wrench', color: '#8E8E93', desc: '' }
        allTools.push({ name, cat, icon: meta.icon, color: meta.color, desc: meta.desc, keywords: [] })
      }
    }
    return allTools.filter(t => {
      if (activeCategory !== 'all' && activeCategory !== t.cat) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      }
      return true
    })
  }
  function toolVisible(name: string, _cat: string, _keywords: string[]): boolean {
    return activeTool === name
  }
  function shortcutCardColor(color: string): string {
    const map: Record<string, string> = {
      '#007AFF': '#4A90C2',
      '#FF9500': '#D28A2E',
      '#FF2D55': '#C9506D',
      '#34C759': '#47A868',
      '#30D158': '#4FAA6B',
      '#5856D6': '#6B69B8',
      '#8E8E93': '#7F8790',
      '#FFD60A': '#C9A83A',
    }
    return map[color] || '#5F7FA8'
  }

  const CHARSETS = ['alphanumeric', 'alpha', 'numeric', 'hex', 'no-ambiguous']
  const CASE_MODES = ['upper', 'lower', 'title', 'sentence', 'camel', 'snake', 'kebab', 'pascal']
  const BASES = [2, 8, 10, 16]
  const BASE_LABELS = ['Binary', 'Octal', 'Decimal', 'Hex']
  const TEMP_UNITS = ['C', 'F', 'K']

  function runSubnet() {
    const cidr = CIDR_PRESETS[subnetCIDR]
    const result = calculateSubnet(subnetIP.trim(), cidr)
    setSubnetResult(result)
  }

  async function runHash(type: string) {
    if (!hashInput.trim()) return
    setHashLoading(true)
    try {
      let result = ''
      if (type === 'md5') result = await md5(hashInput)
      else if (type === 'sha256') result = await sha256(hashInput)
      else if (type === 'sha512') result = await sha512(hashInput)
      else if (type === 'hmac') result = await hmacSha256('key', hashInput)
      setHashResults((prev: Record<string, string>) => ({ ...prev, [type]: result }))
      HapticFeedback.notificationSuccess()
    } catch (e) { setHashResults((prev: Record<string, string>) => ({ ...prev, [type]: 'Error' })) }
    setHashLoading(false)
  }

  async function runHMAC() {
    if (!hmacInput.trim() || !hmacKey.trim()) return
    setHmacLoading(true)
    try {
      const result = await hmacSha256(hmacKey, hmacInput)
      setHmacResult(result)
      HapticFeedback.notificationSuccess()
    } catch (e) { setHmacResult('Error') }
    setHmacLoading(false)
  }

  async function runBase64(encode: boolean) {
    if (!b64Input.trim()) return
    try {
      setB64Output(encode ? await base64Encode(b64Input) : await base64Decode(b64Input))
    } catch (e) { setB64Output('Error') }
  }

  function runURLEncode(encode: boolean) {
    if (!urlInput.trim()) return
    setUrlOutput(encode ? urlEncode(urlInput) : urlDecode(urlInput))
  }

  async function runUUID() {
    setUuidLoading(true)
    try {
      setUuidValue(await generateUUID())
      HapticFeedback.notificationSuccess()
    } catch (e) { setUuidValue('Error') }
    setUuidLoading(false)
  }

  return (
    <ScrollView
      navigationTitle="Tools"
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>
        {/* ── Search & Category Filter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
          <HStack>
            <VStack spacing={3} alignment="leading">
              <Text font="subheadline" foregroundStyle="secondaryLabel">{getCatCount('all')} 个常用开发、网络、编码和安全小工具</Text>
            </VStack>
            <Spacer />
            <VStack spacing={0} padding={{ horizontal: 10, vertical: 10 }} background="#007AFF18" clipShape={{ type: 'rect', cornerRadius: 14 }}>
              <Image systemName="wrench.and.screwdriver.fill" foregroundStyle="#007AFF" frame={{ width: 24, height: 24 }} />
            </VStack>
          </HStack>

          <HStack spacing={8} padding={{ horizontal: 12, vertical: 8 }} background="systemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 12 }}>
            <Image systemName="magnifyingglass" foregroundStyle="tertiaryLabel" frame={{ width: 15, height: 15 }} />
            <TextField title="" value={searchQuery} onChanged={setSearchQuery} prompt="搜索工具、分类或用途" />
          </HStack>

          <ScrollView axes="horizontal">
            <HStack spacing={8}>
              {TOOL_CATEGORIES.map((cat: { key: string; label: string; icon: string }) => {
                const isActive = activeCategory === cat.key
                const count = getCatCount(cat.key)
                return (
                  <Button
                    key={cat.key}
                    action={() => { setActiveCategory(cat.key); setActiveTool(null); HapticFeedback.selection() }}
                  >
                    <HStack spacing={5} padding={{ horizontal: 11, vertical: 7 }} background={isActive ? '#007AFF' : 'systemGroupedBackground'} clipShape="capsule">
                      <Image systemName={cat.icon} foregroundStyle={isActive ? '#FFFFFF' : '#007AFF'} frame={{ width: 13, height: 13 }} />
                      <Text font="caption" fontWeight={isActive ? 'semibold' : 'regular'} foregroundStyle={isActive ? '#FFFFFF' : 'label'}>{cat.label}</Text>
                      <Text font="caption2" foregroundStyle={isActive ? '#FFFFFFCC' : 'secondaryLabel'}>{count}</Text>
                    </HStack>
                  </Button>
                )
              })}
            </HStack>
          </ScrollView>
        </VStack>

        {activeTool === null ? (
          /* ── Apple-style Tool Grid ── */
          <VStack spacing={10}>
            {(() => {
              const tools = getFilteredTools()
              const activeCatInfo = TOOL_CATEGORIES.find((c: any) => c.key === activeCategory)
              if (tools.length === 0) return (
                <VStack spacing={10} padding={{ vertical: 40 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
                  <VStack spacing={0} padding={{ horizontal: 14, vertical: 14 }} background="systemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
                    <Image systemName="magnifyingglass" foregroundStyle="tertiaryLabel" frame={{ width: 34, height: 34 }} />
                  </VStack>
                  <Text font="headline" foregroundStyle="secondaryLabel">没有找到工具</Text>
                  <Text font="caption" foregroundStyle="tertiaryLabel">换个关键词或切换分类试试</Text>
                </VStack>
              )
              const rows: typeof tools[] = []
              for (let i = 0; i < tools.length; i += 1) rows.push(tools.slice(i, i + 1))
              return (
                <>
                  <HStack padding={{ horizontal: 4 }}>
                    <VStack spacing={2} alignment="leading">
                      <Text font="title2" fontWeight="bold">{activeCatInfo?.label || '全部工具'}</Text>
                      <Text font="caption" foregroundStyle="secondaryLabel">简洁列表 · 搜索更快 · 信息更清楚</Text>
                    </VStack>
                    <Spacer />
                    <Text font="caption" foregroundStyle="secondaryLabel">{tools.length} 项</Text>
                  </HStack>

                  {rows.map((row, ri) => (
                    <VStack key={ri} spacing={0}>
                      {row.map(tool => {
                        const catInfo = TOOL_CATEGORIES.find((c: any) => c.key === tool.cat)
                        return (
                          <Button key={tool.name} action={() => { setActiveTool(tool.name); HapticFeedback.selection() }}>
                            <HStack spacing={12} padding={{ horizontal: 14, vertical: 9 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 14 }}>
                              <VStack spacing={0} padding={{ horizontal: 7, vertical: 7 }} background="#007AFF14" clipShape={{ type: 'rect', cornerRadius: 9 }}>
                                <Image systemName={tool.icon} foregroundStyle={tool.color as any} frame={{ width: 18, height: 18 }} />
                              </VStack>
                              <VStack spacing={2} alignment="leading">
                                <Text font="subheadline" fontWeight="semibold" foregroundStyle="label" lineLimit={1}>{tool.name}</Text>
                                <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>{tool.desc}</Text>
                              </VStack>
                              <Spacer />
                              <Text font="caption2" foregroundStyle="tertiaryLabel" lineLimit={1}>{catInfo?.label || tool.cat}</Text>
                              <Image systemName="chevron.right" foregroundStyle="tertiaryLabel" frame={{ width: 10, height: 10 }} />
                            </HStack>
                          </Button>
                        )
                      })}
                    </VStack>
                  ))}
                </>
              )
            })()}
          </VStack>
        ) : (
          <>
            {/* ── Apple-style Detail Header ── */}
            <VStack spacing={10} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
              <HStack>
                <Button action={() => { setActiveTool(null); HapticFeedback.selection() }}>
                  <HStack spacing={4}>
                    <Image systemName="chevron.left" foregroundStyle="#007AFF" frame={{ width: 14, height: 14 }} />
                    <Text font="subheadline" foregroundStyle="#007AFF">工具</Text>
                  </HStack>
                </Button>
                <Spacer />
              </HStack>
              {activeTool && TOOL_META[activeTool] ? (
                <HStack spacing={12}>
                  <VStack spacing={0} padding={{ horizontal: 10, vertical: 10 }} background="#007AFF14" clipShape={{ type: 'rect', cornerRadius: 14 }}>
                    <Image systemName={TOOL_META[activeTool].icon} foregroundStyle={TOOL_META[activeTool].color as any} frame={{ width: 24, height: 24 }} />
                  </VStack>
                  <VStack spacing={2} alignment="leading">
                    <Text font="title3" fontWeight="semibold">{activeTool}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel">{TOOL_META[activeTool].desc}</Text>
                  </VStack>
                  <Spacer />
                </HStack>
              ) : null}
            </VStack>

        {toolVisible('Subnet Calculator', 'network', ['subnet', 'cidr', 'ip', 'network', 'mask']) && (<>
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="chart.bar" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Subnet Calculator</Text>
            <Spacer />
          </HStack>

          <TextField title="IP Address" value={subnetIP} onChanged={setSubnetIP} prompt="e.g. 192.168.1.0" />
          <Picker title="CIDR" value={subnetCIDR} onChanged={setSubnetCIDR}>
            {CIDR_PRESETS.map((c: number, i: number) => (
              <Text key={i} tag={i}>/{c}</Text>
            ))}
          </Picker>

          <Button title="Calculate" systemImage="function" action={() => { try { runSubnet() } catch (e) { setSubnetResult(null) } }} />
        </VStack>

        {subnetResult && (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 13 }}
          >
            <Text font="headline">Results</Text>
            <Divider />
            <ResultRow label="Network" value={subnetResult.network} />
            <ResultRow label="Broadcast" value={subnetResult.broadcast} />
            <ResultRow label="First Host" value={subnetResult.firstHost} />
            <ResultRow label="Last Host" value={subnetResult.lastHost} />
            <ResultRow label="Total Hosts" value={subnetResult.totalHosts.toLocaleString()} />
            <ResultRow label="Usable Hosts" value={subnetResult.usableHosts.toLocaleString()} />
            <ResultRow label="Subnet Mask" value={subnetResult.subnetMask} />
            <ResultRow label="Wildcard" value={subnetResult.wildcardMask} />
            <ResultRow label="IP Class" value={subnetResult.ipClass} />
            <Divider />
            <Text font="caption" foregroundStyle="secondaryLabel">Binary: {subnetResult.binaryMask}</Text>
          </VStack>
        )}

        </>)}
        {toolVisible('Hash Calculator', 'crypto', ['hash', 'md5', 'sha', 'digest', 'checksum']) && (<>
        {/* ── Hash Calculator ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="lock.doc" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Hash Calculator</Text>
            <Spacer />
          </HStack>

          <TextField title="Input" value={hashInput} onChanged={setHashInput} prompt="Enter text to hash" />

          <HStack spacing={8}>
            <Button title="MD5" action={() => runHash('md5')} disabled={hashLoading} />
            <Button title="SHA256" action={() => runHash('sha256')} disabled={hashLoading} />
            <Button title="SHA512" action={() => runHash('sha512')} disabled={hashLoading} />
          </HStack>
        </VStack>

        {Object.keys(hashResults).length > 0 && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 13 }}
          >
            <Text font="headline">Hash Results</Text>
            <Divider />
            {Object.entries(hashResults).map(([type, value]: [string, string]) => (
              <VStack key={type} spacing={2}>
                <HStack>
                  <Text font="caption" foregroundStyle="#007AFF">{type.toUpperCase()}</Text>
                  <Spacer />
                  <Button
                    title="Copy"
                    systemImage="doc.on.doc"
                    action={() => {
                      Pasteboard.setString(value)
                      HapticFeedback.selection()
                    }}
                  />
                </HStack>
                <Text font="caption">{value}</Text>
                <Divider />
              </VStack>
            ))}
          </VStack>
        )}

        </>)}
        {toolVisible('HMAC Generator', 'crypto', ['hmac', 'sha', 'keyed', 'mac']) && (<>
        {/* ── HMAC Generator ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="key" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> HMAC Generator</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">Web Crypto</Text>
          </HStack>

          <TextField title="Secret Key" value={hmacKey} onChanged={setHmacKey} prompt="Enter secret key" />
          <TextField title="Message" value={hmacInput} onChanged={setHmacInput} prompt="Enter message to sign" />

          <Button
            title={hmacLoading ? 'Computing…' : 'Generate HMAC-SHA256'}
            systemImage={hmacLoading ? 'hourglass' : 'key.fill'}
            action={runHMAC}
            disabled={hmacLoading}
          />

          {Boolean(hmacResult) && (
            <VStack spacing={4}>
              <HStack>
                <Text font="caption" foregroundStyle="secondaryLabel">HMAC-SHA256</Text>
                <Spacer />
                <Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(hmacResult); HapticFeedback.selection() }} />
              </HStack>
              <Text font="caption" foregroundStyle="label">{hmacResult}</Text>
            </VStack>
          )}
        </VStack>

        </>)}
        {toolVisible('Base64', 'convert', ['base64', 'encode', 'decode']) && (<>
        {/* ── Base64 ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="arrow.left.arrow.right" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Base64</Text>
            <Spacer />
          </HStack>

          <TextField title="Input" value={b64Input} onChanged={setB64Input} prompt="Text to encode/decode" />
          <HStack spacing={8}>
            <Button title="Encode" systemImage="lock" action={() => runBase64(true)} />
            <Button title="Decode" systemImage="lock.open" action={() => runBase64(false)} />
          </HStack>
          {Boolean(b64Output) && (
            <VStack spacing={4}>
              <HStack>
                <Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text>
                <Spacer />
                <Button
                  title="Copy"
                  systemImage="doc.on.doc"
                  action={() => {
                    Pasteboard.setString(b64Output)
                    HapticFeedback.selection()
                  }}
                />
              </HStack>
              <Text font="subheadline">{b64Output}</Text>
            </VStack>
          )}
        </VStack>

        </>)}
        {toolVisible('URL Encode/Decode', 'convert', ['url', 'encode', 'decode', 'percent']) && (<>
        {/* ── URL Encode/Decode ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="link" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> URL Encode/Decode</Text>
            <Spacer />
          </HStack>

          <TextField title="Input" value={urlInput} onChanged={setUrlInput} prompt="URL string" />
          <HStack spacing={8}>
            <Button title="Encode" action={() => runURLEncode(true)} />
            <Button title="Decode" action={() => runURLEncode(false)} />
          </HStack>
          {Boolean(urlOutput) && (
            <VStack spacing={4}>
              <HStack>
                <Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text>
                <Spacer />
                <Button
                  title="Copy"
                  systemImage="doc.on.doc"
                  action={() => {
                    Pasteboard.setString(urlOutput)
                    HapticFeedback.selection()
                  }}
                />
              </HStack>
              <Text font="subheadline">{urlOutput}</Text>
            </VStack>
          )}
        </VStack>

        </>)}
        {toolVisible('UUID Generator', 'gen', ['uuid', 'guid', 'unique', 'v4']) && (<>
        {/* ── UUID Generator ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 13 }}
        >
          <HStack>
            <Image systemName="number" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> UUID Generator</Text>
            <Spacer />
          </HStack>

          {uuidValue ? (
            <VStack spacing={6}>
              <HStack>
                <Text font="title3" foregroundStyle="label">{uuidValue}</Text>
                <Spacer />
                <Button
                  title="Copy"
                  systemImage="doc.on.doc"
                  action={() => {
                    Pasteboard.setString(uuidValue)
                    HapticFeedback.selection()
                  }}
                />
              </HStack>
            </VStack>
          ) : (
            <Text font="subheadline" foregroundStyle="secondaryLabel">Tap to generate a UUID v4</Text>
          )}

          <Button
            title={uuidLoading ? 'Generating…' : 'Generate UUID'}
            systemImage={uuidLoading ? 'hourglass' : 'arrow.clockwise'}
            action={runUUID}
            disabled={uuidLoading}
          />
        </VStack>

        </>)}
        {toolVisible('Token Generator', 'gen', ['token', 'random', 'string', 'password']) && (<>
        {/* ── Token Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="key.fill" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Token Generator</Text>
            <Spacer />
          </HStack>
          <Picker title="Charset" value={tokenCharset} onChanged={setTokenCharset}>
            {CHARSETS.map((c: string, i: number) => <Text key={i} tag={i}>{c}</Text>)}
          </Picker>
          <HStack>
            <Text font="subheadline">Length: {tokenLen}</Text>
            <Spacer />
            <Button title="-" frame={{ width: 32 }} action={() => setTokenLen(Math.max(4, tokenLen - 4))} />
            <Button title="+" frame={{ width: 32 }} action={() => setTokenLen(Math.min(256, tokenLen + 4))} />
          </HStack>
          {tokenValue ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">TOKEN</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(tokenValue); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline" foregroundStyle="label">{tokenValue}</Text>
          </VStack> : null}
          <Button title="Generate" systemImage="key.fill" action={() => { try { setTokenValue(generateToken(tokenLen, CHARSETS[tokenCharset])); HapticFeedback.notificationSuccess() } catch (e) { setTokenValue('Error: ' + String(e)) } }} />
        </VStack>

        </>)}
        {toolVisible('Lorem Ipsum', 'text', ['lorem', 'ipsum', 'placeholder', 'text', 'dummy']) && (<>
        {/* ── Lorem Ipsum ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="text.quote" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Lorem Ipsum</Text>
            <Spacer />
          </HStack>
          <HStack>
            <Text font="subheadline">Paragraphs: {loremCount}</Text>
            <Spacer />
            <Button title="-" frame={{ width: 32 }} action={() => setLoremCount(Math.max(1, loremCount - 1))} />
            <Button title="+" frame={{ width: 32 }} action={() => setLoremCount(Math.min(10, loremCount + 1))} />
          </HStack>
          {loremText ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(loremText); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{loremText}</Text>
          </VStack> : null}
          <Button title="Generate" systemImage="text.quote" action={() => { try { setLoremText(generateLorem(loremCount)); HapticFeedback.notificationSuccess() } catch (e) { setLoremText('Error: ' + String(e)) } }} />
        </VStack>

        </>)}
        {toolVisible('Text Statistics', 'text', ['text', 'stats', 'count', 'words', 'chars', 'characters']) && (<>
        {/* ── Text Statistics ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="text.word.spacing" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Text Statistics</Text>
            <Spacer />
          </HStack>
          <TextField title="Text" value={statsInput} onChanged={setStatsInput} prompt="Enter text to analyze" />
          {statsResult ? <VStack spacing={4}>
            <ResultRow label="Characters" value={String(statsResult.characters)} />
            <ResultRow label="No Spaces" value={String(statsResult.charactersNoSpaces)} />
            <ResultRow label="Words" value={String(statsResult.words)} />
            <ResultRow label="Sentences" value={String(statsResult.sentences)} />
            <ResultRow label="Lines" value={String(statsResult.lines)} />
            <ResultRow label="Bytes" value={String(statsResult.bytes)} />
          </VStack> : null}
          <Button title="Analyze" systemImage="text.word.spacing" action={() => { setStatsResult(textStats(statsInput)); HapticFeedback.notificationSuccess() }} />
        </VStack>

        </>)}
        {toolVisible('JSON Formatter', 'convert', ['json', 'format', 'prettify', 'minify', 'beautify']) && (<>
        {/* ── JSON Formatter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="curlybraces" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> JSON Formatter</Text>
            <Spacer />
          </HStack>
          <TextField title="JSON" value={jsonInput} onChanged={setJsonInput} prompt="Paste JSON here" />
          <HStack spacing={8}>
            <Button title="Prettify" systemImage="text.alignleft" action={() => { setJsonOutput(jsonPrettify(jsonInput)); HapticFeedback.notificationSuccess() }} />
            <Button title="Minify" systemImage="arrow.down.right.and.arrow.up.left" action={() => { setJsonOutput(jsonMinify(jsonInput)); HapticFeedback.notificationSuccess() }} />
          </HStack>
          {jsonOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jsonOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{jsonOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Case Converter', 'text', ['case', 'upper', 'lower', 'camel', 'snake', 'kebab', 'pascal']) && (<>
        {/* ── Case Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Case Converter</Text>
            <Spacer />
          </HStack>
          <TextField title="Input" value={caseInput} onChanged={setCaseInput} prompt="Enter text" />
          <Picker title="Mode" value={caseMode} onChanged={setCaseMode}>
            {CASE_MODES.map((m: string, i: number) => <Text key={i} tag={i}>{m}</Text>)}
          </Picker>
          <Button title="Convert" systemImage="textformat" action={() => { setCaseOutput(convertCase(caseInput, CASE_MODES[caseMode])); HapticFeedback.notificationSuccess() }} />
          {caseOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(caseOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{caseOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Color Converter', 'convert', ['color', 'hex', 'rgb', 'hsl']) && (<>
        {/* ── Color Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="paintpalette" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Color Converter</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={colorDir} onChanged={setColorDir}>
            <Text tag={0}>HEX → RGB</Text>
            <Text tag={1}>RGB → HEX</Text>
          </Picker>
          <TextField title="Input" value={colorInput} onChanged={setColorInput} prompt={colorDir === 0 ? "#FF9500" : "255,149,0"} />
          <Button title="Convert" systemImage="paintpalette" action={() => {
            try {
              if (colorDir === 0) { const r = hexToRgb(colorInput); setColorOutput(r ? `rgb(${r.r}, ${r.g}, ${r.b})` : 'Invalid hex') }
              else { const p = colorInput.split(',').map(Number); setColorOutput(p.length === 3 ? rgbToHex(p[0], p[1], p[2]) : 'Invalid RGB') }
              HapticFeedback.notificationSuccess()
            } catch (e) { setColorOutput('Error: ' + String(e)) }
          }} />
          {colorOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(colorOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{colorOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Base Converter', 'convert', ['base', 'binary', 'octal', 'decimal', 'hex']) && (<>
        {/* ── Base Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="number" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Base Converter</Text>
            <Spacer />
          </HStack>
          <TextField title="Value" value={baseInput} onChanged={setBaseInput} prompt="Enter number" />
          <Picker title="From" value={baseFrom} onChanged={setBaseFrom}>
            {BASE_LABELS.map((b: string, i: number) => <Text key={i} tag={i}>{b}</Text>)}
          </Picker>
          <Button title="Convert" systemImage="number" action={() => {
            try {
              const r = convertBase(baseInput, BASES[baseFrom], 10)
              if (r !== null) { const dec = parseInt(r); setBaseOutput(`Bin: ${dec.toString(2)}\nOct: ${dec.toString(8)}\nDec: ${dec}\nHex: ${dec.toString(16).toUpperCase()}`) }
              else setBaseOutput('Invalid input')
              HapticFeedback.notificationSuccess()
            } catch (e) { setBaseOutput('Error: ' + String(e)) }
          }} />
          {baseOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">ALL BASES</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(baseOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{baseOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Regex Tester', 'dev', ['regex', 'regexp', 'pattern', 'match']) && (<>
        {/* ── Regex Tester ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="text.magnifyingglass" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Regex Tester</Text>
            <Spacer />
          </HStack>
          <TextField title="Pattern" value={regexPattern} onChanged={setRegexPattern} prompt="e.g. \\d+" />
          <TextField title="Flags" value={regexFlags} onChanged={setRegexFlags} prompt="i, m, s" />
          <TextField title="Test String" value={regexText} onChanged={setRegexText} prompt="Enter test text" />
          <Button title="Test" systemImage="text.magnifyingglass" action={async () => {
            try {
              const r = await regexTest(regexPattern, regexFlags, regexText)
              setRegexResult(r.matches); setRegexError(r.error || '')
              HapticFeedback.notificationSuccess()
            } catch (e) { setRegexResult([]); setRegexError('Error: ' + String(e)) }
          }} />
          {regexError ? <Text font="caption" foregroundStyle="#FF3B30">{regexError}</Text> : null}
          {regexResult.length > 0 ? <VStack spacing={4}>
            <Text font="caption" foregroundStyle="secondaryLabel">{regexResult.length} match(es)</Text>
            {regexResult.map((m: string, i: number) => <Text key={i} font="subheadline">{m}</Text>)}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Math Evaluator', 'math', ['math', 'calc', 'evaluate', 'expression']) && (<>
        {/* ── Math Evaluator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="function" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Math Evaluator</Text>
            <Spacer />
          </HStack>
          <TextField title="Expression" value={mathInput} onChanged={setMathInput} prompt="e.g. sqrt(144) + pi" />
          <Button title="Evaluate" systemImage="function" action={async () => { try { setMathOutput(await evaluateMath(mathInput)); HapticFeedback.notificationSuccess() } catch (e) { setMathOutput('Error: ' + String(e)) } }} />
          {mathOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(mathOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="title3">{mathOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Password Strength', 'crypto', ['password', 'strength', 'entropy', 'analyze']) && (<>
        {/* ── Password Strength ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.shield" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Password Strength</Text>
            <Spacer />
          </HStack>
          <TextField title="Password" value={pwdInput} onChanged={(v: string) => { setPwdInput(v); setPwdResult(analyzePassword(v)) }} prompt="Enter password to check" />
          {pwdResult ? <VStack spacing={6}>
            <Gauge value={pwdResult.score / 8} label={<Text font="caption">Strength</Text>} currentValueLabel={<Text font="caption" foregroundStyle={pwdResult.score <= 2 ? '#FF3B30' : pwdResult.score <= 4 ? '#FF9500' : pwdResult.score <= 6 ? '#007AFF' : '#34C759'}>{pwdResult.level}</Text>} />
            <Text font="caption" foregroundStyle="secondaryLabel">Score: {pwdResult.score}/8</Text>
            {pwdResult.suggestions.length > 0 ? <VStack spacing={2}>
              <Text font="caption" foregroundStyle="secondaryLabel">Suggestions:</Text>
              {pwdResult.suggestions.map((s: string, i: number) => <Text key={i} font="caption">• {s}</Text>)}
            </VStack> : null}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Text ↔ Binary', 'convert', ['binary', 'text', 'ascii', 'bits']) && (<>
        {/* ── Text ↔ Binary ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="binarycode" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Text ↔ Binary</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={binDir} onChanged={setBinDir}>
            <Text tag={0}>Text → Binary</Text>
            <Text tag={1}>Binary → Text</Text>
          </Picker>
          <TextField title="Input" value={binInput} onChanged={setBinInput} prompt={binDir === 0 ? "Hello" : "01001000 01101001"} />
          <Button title="Convert" systemImage="binarycode" action={() => { try { setBinOutput(binDir === 0 ? textToBinary(binInput) : binaryToText(binInput)); HapticFeedback.notificationSuccess() } catch (e) { setBinOutput('Error: ' + String(e)) } }} />
          {binOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(binOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{binOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Temperature', 'convert', ['temperature', 'celsius', 'fahrenheit', 'kelvin']) && (<>
        {/* ── Temperature ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="thermometer" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Temperature</Text>
            <Spacer />
          </HStack>
          <TextField title="Value" value={tempInput} onChanged={setTempInput} prompt="Enter temperature" />
          <HStack spacing={8}>
            <Picker title="From" value={tempFrom} onChanged={setTempFrom}>
              {TEMP_UNITS.map((u: string, i: number) => <Text key={i} tag={i}>°{u}</Text>)}
            </Picker>
            <Picker title="To" value={tempTo} onChanged={setTempTo}>
              {TEMP_UNITS.map((u: string, i: number) => <Text key={i} tag={i}>°{u}</Text>)}
            </Picker>
          </HStack>
          <Button title="Convert" systemImage="thermometer" action={() => {
            try {
              const v = parseFloat(tempInput)
              if (!isNaN(v)) { const r = convertTemperature(v, TEMP_UNITS[tempFrom], TEMP_UNITS[tempTo]); setTempOutput(r !== null ? `${r} °${TEMP_UNITS[tempTo]}` : 'Error') }
              else setTempOutput('Invalid number')
              HapticFeedback.notificationSuccess()
            } catch (e) { setTempOutput('Error: ' + String(e)) }
          }} />
          {tempOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(tempOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="title3">{tempOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Chmod Calculator', 'dev', ['chmod', 'permission', 'unix', 'file']) && (<>
        {/* ── Chmod Calculator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.rectangle" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Chmod Calculator</Text>
            <Spacer />
          </HStack>
          <HStack spacing={16}>
            <VStack spacing={4}>
              <Text font="caption" foregroundStyle="secondaryLabel">OWNER</Text>
              <Toggle title="R" value={chmodU[0]} onChanged={(v: boolean) => setChmodU([v, chmodU[1], chmodU[2]])} />
              <Toggle title="W" value={chmodU[1]} onChanged={(v: boolean) => setChmodU([chmodU[0], v, chmodU[2]])} />
              <Toggle title="X" value={chmodU[2]} onChanged={(v: boolean) => setChmodU([chmodU[0], chmodU[1], v])} />
            </VStack>
            <VStack spacing={4}>
              <Text font="caption" foregroundStyle="secondaryLabel">GROUP</Text>
              <Toggle title="R" value={chmodG[0]} onChanged={(v: boolean) => setChmodG([v, chmodG[1], chmodG[2]])} />
              <Toggle title="W" value={chmodG[1]} onChanged={(v: boolean) => setChmodG([chmodG[0], v, chmodG[2]])} />
              <Toggle title="X" value={chmodG[2]} onChanged={(v: boolean) => setChmodG([chmodG[0], chmodG[1], v])} />
            </VStack>
            <VStack spacing={4}>
              <Text font="caption" foregroundStyle="secondaryLabel">OTHERS</Text>
              <Toggle title="R" value={chmodO[0]} onChanged={(v: boolean) => setChmodO([v, chmodO[1], chmodO[2]])} />
              <Toggle title="W" value={chmodO[1]} onChanged={(v: boolean) => setChmodO([chmodO[0], v, chmodO[2]])} />
              <Toggle title="X" value={chmodO[2]} onChanged={(v: boolean) => setChmodO([chmodO[0], chmodO[1], v])} />
            </VStack>
          </HStack>
          <Button title="Calculate" systemImage="lock.rectangle" action={() => {
            try {
              const r = calculateChmod(
                { read: chmodU[0], write: chmodU[1], execute: chmodU[2] },
                { read: chmodG[0], write: chmodG[1], execute: chmodG[2] },
                { read: chmodO[0], write: chmodO[1], execute: chmodO[2] }
              )
              setChmodResult(`${r.octal}  ${r.symbolic}  ${r.command}`)
              HapticFeedback.notificationSuccess()
            } catch (e) { setChmodResult('Error: ' + String(e)) }
          }} />
          {chmodResult ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(chmodResult); HapticFeedback.selection() }} /></HStack>
            <Text font="title3">{chmodResult}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Slugify', 'text', ['slug', 'url', 'friendly']) && (<>
        {/* ── Slugify ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat.abc" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Slugify</Text>
            <Spacer />
          </HStack>
          <TextField title="Input" value={slugInput} onChanged={setSlugInput} prompt="Hello World! This is a Test." />
          <Button title="Slugify" systemImage="textformat.abc" action={() => { setSlugOutput(slugify(slugInput)); HapticFeedback.notificationSuccess() }} />
          {slugOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">SLUG</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(slugOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{slugOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Text Diff', 'text', ['diff', 'compare', 'text']) && (<>
        {/* ── Text Diff ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="doc.plaintext" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Text Diff</Text>
            <Spacer />
          </HStack>
          <TextField title="Text A" value={diffA} onChanged={setDiffA} prompt="Original text" />
          <TextField title="Text B" value={diffB} onChanged={setDiffB} prompt="Modified text" />
          <Button title="Compare" systemImage="doc.plaintext" action={() => { try { setDiffResult(textDiff(diffA, diffB)); HapticFeedback.notificationSuccess() } catch (e) { setDiffResult([{ type: 'removed', line: 'Error: ' + String(e) }]) } }} />
          {diffResult.length > 0 ? <VStack spacing={2}>
            <Text font="caption" foregroundStyle="secondaryLabel">DIFF ({diffResult.filter((d: any) => d.type !== 'same').length} changes)</Text>
            {diffResult.map((d: any, i: number) => (
              <HStack key={i}>
                <Text font="caption" foregroundStyle={d.type === 'added' ? '#34C759' : d.type === 'removed' ? '#FF3B30' : 'secondaryLabel'} frame={{ minWidth: 16 }}>
                  {d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' '}
                </Text>
                <Text font="caption" foregroundStyle={d.type === 'added' ? '#34C759' : d.type === 'removed' ? '#FF3B30' : 'label'}>{d.line || '(empty)'}</Text>
              </HStack>
            ))}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('JWT Parser', 'dev', ['jwt', 'token', 'json web', 'decode']) && (<>
        {/* ── JWT Parser ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="key.viewfinder" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> JWT Parser</Text>
            <Spacer />
          </HStack>
          <TextField title="JWT Token" value={jwtInput} onChanged={setJwtInput} prompt="eyJhbGci..." />
          <Button title="Decode" systemImage="key.viewfinder" action={() => {
            const r = parseJWT(jwtInput)
            setJwtError(r.error || '')
            setJwtHeader(r.header ? JSON.stringify(r.header, null, 2) : '')
            setJwtPayload(r.payload ? JSON.stringify(r.payload, null, 2) : '')
            HapticFeedback.notificationSuccess()
          }} />
          {jwtError ? <Text font="caption" foregroundStyle="#FF3B30">{jwtError}</Text> : null}
          {jwtHeader ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="#007AFF">HEADER</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jwtHeader); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{jwtHeader}</Text>
          </VStack> : null}
          {jwtPayload ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="#FF9500">PAYLOAD</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jwtPayload); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{jwtPayload}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('HTML Entities', 'web', ['html', 'entity', 'encode', 'decode', 'escape']) && (<>
        {/* ── HTML Entities ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="chevron.left.forwardslash.chevron.right" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> HTML Entities</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={htmlDir} onChanged={setHtmlDir}>
            <Text tag={0}>Encode</Text>
            <Text tag={1}>Decode</Text>
          </Picker>
          <TextField title="Input" value={htmlInput} onChanged={setHtmlInput} prompt="<div>Hello</div>" />
          <Button title={htmlDir === 0 ? 'Encode' : 'Decode'} systemImage="chevron.left.forwardslash.chevron.right" action={() => { setHtmlOutput(htmlDir === 0 ? htmlEncode(htmlInput) : htmlDecode(htmlInput)); HapticFeedback.notificationSuccess() }} />
          {htmlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(htmlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{htmlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Cron Parser', 'dev', ['cron', 'schedule', 'expression', 'timer']) && (<>
        {/* ── Cron Parser ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="clock.badge.questionmark" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Cron Parser</Text>
            <Spacer />
          </HStack>
          <TextField title="Expression" value={cronInput} onChanged={setCronInput} prompt="*/5 * * * *" />
          <Button title="Parse" systemImage="clock.badge.questionmark" action={() => { setCronOutput(parseCron(cronInput)); HapticFeedback.notificationSuccess() }} />
          {cronOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">MEANING</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(cronOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{cronOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('MAC Address Generator', 'gen', ['mac', 'address', 'ethernet', 'generate']) && (<>
        {/* ── MAC Address Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="wifi" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> MAC Address</Text>
            <Spacer />
          </HStack>
          <Picker title="Separator" value={macSep} onChanged={setMacSep}>
            <Text tag={0}>Colon (AA:BB:CC)</Text>
            <Text tag={1}>Dash (AA-BB-CC)</Text>
            <Text tag={2}>None (AABBCC)</Text>
          </Picker>
          {macValue ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">MAC</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(macValue); HapticFeedback.selection() }} /></HStack>
            <Text font="title3" foregroundStyle="label">{macValue}</Text>
          </VStack> : null}
          <Button title="Generate" systemImage="wifi" action={() => { try { setMacValue(generateMAC([':', '-', ''][macSep])); HapticFeedback.notificationSuccess() } catch (e) { setMacValue('Error: ' + String(e)) } }} />
        </VStack>

        </>)}
        {toolVisible('IPv4 Converter', 'network', ['ipv4', 'ip', 'convert', 'integer']) && (<>
        {/* ── IPv4 Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="number.square" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> IPv4 Converter</Text>
            <Spacer />
          </HStack>
          <TextField title="IP Address" value={ipv4Input} onChanged={setIpv4Input} prompt="192.168.1.1" />
          <Button title="Convert" systemImage="number.square" action={() => {
            try {
              const n = ipv4ToInt(ipv4Input.trim())
              if (n !== null) setIpv4Output(`Decimal: ${n}\nHex: 0x${n.toString(16).toUpperCase()}\nBinary: ${n.toString(2).padStart(32, '0')}`)
              else setIpv4Output('Invalid IPv4 address')
              HapticFeedback.notificationSuccess()
            } catch (e) { setIpv4Output('Error: ' + String(e)) }
          }} />
          {ipv4Output ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(ipv4Output); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{ipv4Output}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Number to Words', 'math', ['number', 'words', 'english', 'spell']) && (<>
        {/* ── Number to Words ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat.123" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Number to Words</Text>
            <Spacer />
          </HStack>
          <TextField title="Number" value={numInput} onChanged={setNumInput} prompt="e.g. 12345" />
          <Button title="Convert" systemImage="textformat.123" action={() => { setNumOutput(numberToWords(parseInt(numInput) || 0)); HapticFeedback.notificationSuccess() }} />
          {numOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">WORDS</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(numOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{numOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('ETA Estimator', 'math', ['eta', 'time', 'estimate', 'speed']) && (<>
        {/* ── ETA Estimator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="clock.arrow.circlepath" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> ETA Estimator</Text>
            <Spacer />
          </HStack>
          <TextField title="Total Items" value={etaTotal} onChanged={setEtaTotal} prompt="100" />
          <TextField title="Done" value={etaDone} onChanged={setEtaDone} prompt="30" />
          <TextField title="Elapsed (sec)" value={etaElapsed} onChanged={setEtaElapsed} prompt="10" />
          <Button title="Calculate" systemImage="clock.arrow.circlepath" action={() => {
            setEtaOutput(etaEstimate(parseInt(etaTotal) || 1, parseInt(etaDone) || 0, (parseFloat(etaElapsed) || 0) * 1000))
            HapticFeedback.notificationSuccess()
          }} />
          {etaOutput ? <VStack spacing={6}>
            <ResultRow label="Remaining" value={etaOutput.remaining} />
            <ResultRow label="Rate" value={etaOutput.rate} />
            <ResultRow label="ETA" value={etaOutput.eta} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('ULID Generator', 'gen', ['ulid', 'unique', 'sortable', 'id']) && (<>
        {/* ── ULID Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="barcode" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> ULID Generator</Text>
            <Spacer />
          </HStack>
          {ulidValue ? <VStack spacing={4}>
            <HStack><Text font="title3" foregroundStyle="label">{ulidValue}</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(ulidValue); HapticFeedback.selection() }} /></HStack>
          </VStack> : <Text font="subheadline" foregroundStyle="secondaryLabel">Tap to generate a ULID</Text>}
          <Button title="Generate ULID" systemImage="barcode" action={() => { try { setUlidValue(generateULID()); HapticFeedback.notificationSuccess() } catch (e) { setUlidValue('Error: ' + String(e)) } }} />
        </VStack>

        </>)}
        {toolVisible('User-Agent Parser', 'web', ['user-agent', 'browser', 'ua', 'parse']) && (<>
        {/* ── User-Agent Parser ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="person.text.rectangle" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> User-Agent Parser</Text>
            <Spacer />
          </HStack>
          <TextField title="User-Agent" value={uaInput} onChanged={setUaInput} prompt="Paste User-Agent string" />
          <Button title="Parse" systemImage="person.text.rectangle" action={() => { setUaOutput(parseUserAgent(uaInput)); HapticFeedback.notificationSuccess() }} />
          {uaOutput ? <VStack spacing={6}>
            <ResultRow label="Browser" value={`${uaOutput.browser} ${uaOutput.version}`} />
            <ResultRow label="OS" value={uaOutput.os} />
            <ResultRow label="Device" value={uaOutput.device} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('MIME Type Lookup', 'web', ['mime', 'type', 'content', 'extension']) && (<>
        {/* ── MIME Type Lookup ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="doc.text" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> MIME Type Lookup</Text>
            <Spacer />
          </HStack>
          <TextField title="Extension" value={mimeInput} onChanged={setMimeInput} prompt="e.g. json, png, pdf" />
          <Button title="Lookup" systemImage="doc.text" action={() => { setMimeOutput(mimeLookup(mimeInput.trim().replace(/^\./, ''))); HapticFeedback.notificationSuccess() }} />
          {mimeOutput ? <VStack spacing={6}>
            <ResultRow label="MIME Type" value={mimeOutput.type} />
            <ResultRow label="Description" value={mimeOutput.description} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Basic Auth Generator', 'web', ['basic', 'auth', 'header', 'authorization']) && (<>
        {/* ── Basic Auth Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.rectangle" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Basic Auth Generator</Text>
            <Spacer />
          </HStack>
          <TextField title="Username" value={baUser} onChanged={setBaUser} prompt="admin" />
          <TextField title="Password" value={baPass} onChanged={setBaPass} prompt="secret" />
          <Button title="Generate" systemImage="lock.rectangle" action={() => { setBaOutput(basicAuthEncode(baUser, baPass)); HapticFeedback.notificationSuccess() }} />
          {baOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">AUTHORIZATION HEADER</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(baOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{baOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('XML Formatter', 'convert', ['xml', 'format', 'prettify', 'minify']) && (<>
        {/* ── XML Formatter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="chevron.left.forwardslash.chevron.right" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> XML Formatter</Text>
            <Spacer />
          </HStack>
          <TextField title="XML" value={xmlInput} onChanged={setXmlInput} prompt="Paste XML here" />
          <HStack spacing={8}>
            <Button title="Prettify" systemImage="text.alignleft" action={() => { setXmlOutput(xmlPrettify(xmlInput)); HapticFeedback.notificationSuccess() }} />
            <Button title="Minify" systemImage="arrow.down.right.and.arrow.up.left" action={() => { setXmlOutput(xmlMinify(xmlInput)); HapticFeedback.notificationSuccess() }} />
          </HStack>
          {xmlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(xmlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{xmlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('IPv6 ULA Generator', 'network', ['ipv6', 'ula', 'generate', 'address']) && (<>
        {/* ── IPv6 ULA Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="globe.americas" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> IPv6 ULA Generator</Text>
            <Spacer />
          </HStack>
          {ulaValue ? <VStack spacing={4}>
            <HStack><Text font="subheadline" foregroundStyle="label">{ulaValue}</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(ulaValue); HapticFeedback.selection() }} /></HStack>
          </VStack> : <Text font="subheadline" foregroundStyle="secondaryLabel">Generate a Unique Local Address (fd00::/8)</Text>}
          <Button title="Generate ULA" systemImage="globe.americas" action={() => { try { setUlaValue(generateIPv6ULA()); HapticFeedback.notificationSuccess() } catch (e) { setUlaValue('Error: ' + String(e)) } }} />
        </VStack>

        </>)}
        {toolVisible('Unix Epoch Converter', 'convert', ['epoch', 'unix', 'timestamp', 'date']) && (<>
        {/* ── Unix Epoch Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="clock" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Unix Epoch Converter</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={epochDir} onChanged={setEpochDir}>
            <Text tag={0}>Epoch → Date</Text>
            <Text tag={1}>Date → Epoch</Text>
          </Picker>
          <TextField title={epochDir === 0 ? 'Timestamp' : 'Date String'} value={epochInput} onChanged={setEpochInput} prompt={epochDir === 0 ? '1704067200' : '2024-01-01 00:00:00'} />
          <Button title="Convert" systemImage="clock" action={() => {
            try {
              if (epochDir === 0) setEpochOutput(epochToDate(epochInput))
              else setEpochOutput(String(dateToEpoch(epochInput)))
              HapticFeedback.notificationSuccess()
            } catch (e) { setEpochOutput('Error: ' + String(e)) }
          }} />
          {epochOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(epochOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{epochOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('File Size Formatter', 'convert', ['file', 'size', 'bytes', 'format']) && (<>
        {/* ── File Size Formatter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="internaldrive" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> File Size Formatter</Text>
            <Spacer />
          </HStack>
          <TextField title="Bytes" value={sizeInput} onChanged={setSizeInput} prompt="1048576" />
          <Button title="Format" systemImage="internaldrive" action={() => { setSizeOutput(formatFileSize(parseInt(sizeInput) || 0)); HapticFeedback.notificationSuccess() }} />
          {sizeOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">FORMATTED</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(sizeOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="title3">{sizeOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Hex String Converter', 'convert', ['hex', 'string', 'encode', 'decode']) && (<>
        {/* ── Hex String Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat.size" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Hex String Converter</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={hexStrDir} onChanged={setHexStrDir}>
            <Text tag={0}>Text → Hex</Text>
            <Text tag={1}>Hex → Text</Text>
          </Picker>
          <TextField title="Input" value={hexStrInput} onChanged={setHexStrInput} prompt={hexStrDir === 0 ? 'Hello World' : '48656c6c6f'} />
          <Button title="Convert" systemImage="textformat.size" action={() => { setHexStrOutput(hexStrDir === 0 ? hexEncode(hexStrInput) : hexDecode(hexStrInput)); HapticFeedback.notificationSuccess() }} />
          {hexStrOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(hexStrOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption">{hexStrOutput}</Text>
          </VStack> : null}
        </VStack>

        {/* ═══ CRYPTO & GENERATORS ═══ */}

        </>)}
        {toolVisible('OTP Generator', 'gen', ['otp', 'one-time', 'pin', 'code']) && (<>
        {/* ── OTP Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="key.fill" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> OTP Generator</Text>
            <Spacer />
          </HStack>
          <Picker title="Length" value={otpLen} onChanged={setOtpLen}>
            {[4,5,6,8].map(n => <Text key={n} tag={n}>{n} digits</Text>)}
          </Picker>
          <Button title="Generate OTP" systemImage="key.fill" action={() => { try { setOtpValue(generateOTP(otpLen)); HapticFeedback.notificationSuccess() } catch (e) { setOtpValue('Error: ' + String(e)) } }} />
          {otpValue ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">CODE</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(otpValue); HapticFeedback.selection() }} /></HStack>
            <Text font="largeTitle" fontWeight="bold">{otpValue}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('RSA Key Pair Generator', 'crypto', ['rsa', 'key', 'pair', 'public', 'private']) && (<>
        {/* ── RSA Key Pair Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.shield" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> RSA Key Pair Generator</Text>
            <Spacer />
          </HStack>
          <Button title="Generate RSA-2048 Keys" systemImage="lock.shield" action={async () => {
            setRsaLoading(true)
            try {
              const keys = await generateRSAKeyPair()
              setRsaKeys(keys)
              HapticFeedback.notificationSuccess()
            } catch (e) { setRsaKeys({ publicKey: '', privateKey: 'Error: ' + String(e) }) }
            setRsaLoading(false)
          }} />
          {rsaLoading ? <ProgressView /> : null}
          {rsaKeys ? <VStack spacing={8}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">PUBLIC KEY</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(rsaKeys.publicKey); HapticFeedback.selection() }} /></HStack>
            <Text font="caption2" lineLimit={4}>{rsaKeys.publicKey}</Text>
            <Divider />
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">PRIVATE KEY</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(rsaKeys.privateKey); HapticFeedback.selection() }} /></HStack>
            <Text font="caption2" lineLimit={4}>{rsaKeys.privateKey}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Encrypt / Decrypt Text', 'crypto', ['encrypt', 'decrypt', 'aes', 'cipher']) && (<>
        {/* ── Encrypt / Decrypt Text ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.rotation" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> AES Encrypt / Decrypt</Text>
            <Spacer />
          </HStack>
          <TextField title="Text" value={encInput} onChanged={setEncInput} prompt="Enter text" />
          <TextField title="Password" value={encPass} onChanged={setEncPass} prompt="Secret key" />
          <HStack spacing={8}>
            <Button title="Encrypt" systemImage="lock.fill" action={async () => {
              if (!encInput || !encPass) return; setEncLoading(true)
              try { setEncOutput(await encryptText(encInput, encPass)) } catch { setEncOutput('Error') }
              setEncLoading(false); HapticFeedback.notificationSuccess()
            }} />
            <Button title="Decrypt" systemImage="lock.open" action={async () => {
              if (!encInput || !encPass) return; setEncLoading(true)
              try { setEncOutput(await decryptText(encInput, encPass)) } catch { setEncOutput('Decryption failed') }
              setEncLoading(false); HapticFeedback.notificationSuccess()
            }} />
          </HStack>
          {encLoading ? <ProgressView /> : null}
          {encOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(encOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline" lineLimit={6}>{encOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('TOTP Generator', 'crypto', ['totp', 'time', 'otp', '2fa', 'authenticator']) && (<>
        {/* ── TOTP Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="clock.badge.checkmark" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> TOTP Generator</Text>
            <Spacer />
          </HStack>
          <TextField title="Secret (Base32)" value={totpSecret} onChanged={setTotpSecret} prompt="JBSWY3DPEHPK3PXP" />
          <Button title="Generate Code" systemImage="clock" action={async () => {
            if (!totpSecret) return
            const result = await generateTOTP(totpSecret)
            setTotpCode(result.code)
            setTotpRemaining(result.remaining)
            HapticFeedback.notificationSuccess()
          }} />
          {totpCode ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">TOTP CODE</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(totpCode); HapticFeedback.selection() }} /></HStack>
            <HStack>
              <Text font="largeTitle" fontWeight="bold">{totpCode}</Text>
              <Spacer />
              <Text font="caption" foregroundStyle="tertiaryLabel">{totpRemaining}s left</Text>
            </HStack>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Numeronym Generator', 'text', ['numeronym', 'i18n', 'l10n']) && (<>
        {/* ── Numeronym Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat.abc" foregroundStyle="#AF52DE" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Numeronym Generator</Text>
            <Spacer />
          </HStack>
          <TextField title="Word" value={numerInput} onChanged={setNumerInput} prompt="e.g. internationalization" />
          <Button title="Generate" systemImage="textformat.abc" action={() => { try { setNumerOutput(generateNumeronym(numerInput)); HapticFeedback.notificationSuccess() } catch (e) { setNumerOutput('Error: ' + String(e)) } }} />
          {numerOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">NUMERONYM</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(numerOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="title2" fontWeight="semibold">{numerOutput}</Text>
          </VStack> : null}
        </VStack>

        {/* ═══ MORE CONVERTERS ═══ */}

        </>)}
        {toolVisible('List Converter', 'text', ['list', 'convert', 'lines', 'comma']) && (<>
        {/* ── List Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="list.bullet" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> List Converter</Text><Spacer /></HStack>
          <TextField title="Input (one per line)" value={listInput} onChanged={setListInput} axis="vertical" prompt="apple\nbanana\ncherry" />
          <HStack spacing={16}>
            <Toggle value={listSort} onChanged={setListSort} title="Sort" />
            <Toggle value={listUnique} onChanged={setListUnique} title="Unique" />
            <Toggle value={listReverse} onChanged={setListReverse} title="Reverse" />
          </HStack>
          <Button title="Convert" systemImage="list.bullet" action={() => { setListOutput(listConverter(listInput, { sort: listSort, unique: listUnique, reverse: listReverse, filterEmpty: true })); HapticFeedback.notificationSuccess() }} />
          {listOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(listOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{listOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('String Obfuscator', 'text', ['obfuscate', 'mask', 'hide', 'scramble']) && (<>
        {/* ── String Obfuscator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="eye.slash" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} /><Text font="headline"> String Obfuscator</Text><Spacer /></HStack>
          <TextField title="Input" value={obfInput} onChanged={setObfInput} prompt="secret-api-key-12345" />
          <Button title="Obfuscate" systemImage="eye.slash" action={() => { setObfOutput(obfuscateString(obfInput)); HapticFeedback.notificationSuccess() }} />
          {obfOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OBFUSCATED</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(obfOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{obfOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Percentage Calculator', 'math', ['percentage', 'percent', 'calc']) && (<>
        {/* ── Percentage Calculator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="percent" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} /><Text font="headline"> Percentage Calculator</Text><Spacer /></HStack>
          <TextField title="Value" value={pctVal} onChanged={setPctVal} prompt="25" />
          <TextField title="Total" value={pctTotal} onChanged={setPctTotal} prompt="200" />
          <Button title="Calculate" systemImage="percent" action={() => {
            const r = calculatePercentage(parseFloat(pctVal) || 0, parseFloat(pctTotal) || 0)
            setPctResult(r.percent); HapticFeedback.notificationSuccess()
          }} />
          {pctResult ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(pctResult); HapticFeedback.selection() }} /></HStack>
            <Text font="largeTitle" fontWeight="bold">{pctResult}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Email Tools', 'dev', ['email', 'validate', 'normalize', 'mail']) && (<>
        {/* ── Email Tools ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="envelope" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> Email Tools</Text><Spacer /></HStack>
          <TextField title="Normalize Email" value={emailNormInput} onChanged={setEmailNormInput} prompt="User@Gmail.COM" />
          <Button title="Normalize" systemImage="envelope" action={() => { setEmailNormOutput(normalizeEmail(emailNormInput)); HapticFeedback.notificationSuccess() }} />
          {emailNormOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">NORMALIZED</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(emailNormOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{emailNormOutput}</Text>
          </VStack> : null}
          <Divider />
          <TextField title="Validate Email" value={emailValidInput} onChanged={setEmailValidInput} prompt="user@example.com" />
          <Button title="Validate" systemImage="envelope.badge" action={() => {
            const r = emailValidator(emailValidInput)
            setEmailValidResult(r.valid ? `✅ Valid — ${r.parts!.local}@${r.parts!.domain} (${r.parts!.tld})` : '❌ Invalid email')
            HapticFeedback.notificationSuccess()
          }} />
          {emailValidResult ? <Text font="subheadline">{emailValidResult}</Text> : null}
        </VStack>

        </>)}
        {toolVisible('Outlook Safelink Decoder', 'web', ['safelink', 'outlook', 'decode', 'microsoft']) && (<>
        {/* ── Outlook Safelink Decoder ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="link.badge.plus" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> Outlook Safelink Decoder</Text><Spacer /></HStack>
          <TextField title="Safelink URL" value={safelinkInput} onChanged={setSafelinkInput} prompt="https://nam02.safelinks.protection.outlook.com/?url=..." />
          <Button title="Decode" systemImage="link.badge.plus" action={() => { setSafelinkOutput(decodeSafelink(safelinkInput)); HapticFeedback.notificationSuccess() }} />
          {safelinkOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">REAL URL</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(safelinkOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={3}>{safelinkOutput}</Text>
          </VStack> : null}
        </VStack>

        {/* ═══ DEV TOOLS ═══ */}

        </>)}
        {toolVisible('SQL Prettify', 'dev', ['sql', 'format', 'prettify', 'query']) && (<>
        {/* ── SQL Prettify ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="tablecells" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> SQL Prettify</Text><Spacer /></HStack>
          <TextField title="SQL Query" value={sqlInput} onChanged={setSqlInput} axis="vertical" prompt="SELECT * FROM users WHERE id=1" />
          <Button title="Format SQL" systemImage="tablecells" action={() => { setSqlOutput(sqlPrettify(sqlInput)); HapticFeedback.notificationSuccess() }} />
          {sqlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">FORMATTED</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(sqlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={12}>{sqlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('JSON Diff', 'dev', ['json', 'diff', 'compare', 'patch']) && (<>
        {/* ── JSON Diff ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="arrow.left.arrow.right" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> JSON Diff</Text><Spacer /></HStack>
          <TextField title="JSON A" value={jsonDiffA} onChanged={setJsonDiffA} axis="vertical" prompt='{"a":1}' />
          <TextField title="JSON B" value={jsonDiffB} onChanged={setJsonDiffB} axis="vertical" prompt='{"a":2}' />
          <Button title="Compare" systemImage="arrow.left.arrow.right" action={() => {
            try {
              const diffs = jsonDiff(JSON.parse(jsonDiffA), JSON.parse(jsonDiffB))
              setJsonDiffResult(diffs.length === 0 ? '✅ No differences' : diffs.map((d: any) => `${d.type.toUpperCase()} ${d.path}: ${JSON.stringify(d.value ?? d.oldValue)}`).join('\n'))
            } catch { setJsonDiffResult('Invalid JSON input') }
            HapticFeedback.notificationSuccess()
          }} />
          {jsonDiffResult ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">DIFFERENCES</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jsonDiffResult); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={12}>{jsonDiffResult}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Markdown to HTML', 'convert', ['markdown', 'md', 'html', 'render']) && (<>
        {/* ── Markdown to HTML ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="doc.richtext" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} /><Text font="headline"> Markdown to HTML</Text><Spacer /></HStack>
          <TextField title="Markdown" value={mdInput} onChanged={setMdInput} axis="vertical" prompt="# Title\n\nParagraph" />
          <Button title="Convert" systemImage="doc.richtext" action={() => { setMdOutput(markdownToHTML(mdInput)); HapticFeedback.notificationSuccess() }} />
          {mdOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">HTML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(mdOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{mdOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('JSON to CSV', 'convert', ['json', 'csv', 'convert', 'export']) && (<>
        {/* ── JSON to CSV ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="tablecells.badge.ellipsis" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} /><Text font="headline"> JSON to CSV</Text><Spacer /></HStack>
          <TextField title="JSON Array" value={csvJsonInput} onChanged={setCsvJsonInput} axis="vertical" prompt='[{"name":"Alice","age":30}]' />
          <Button title="Convert to CSV" systemImage="tablecells.badge.ellipsis" action={() => { setCsvOutput(jsonToCSV(csvJsonInput)); HapticFeedback.notificationSuccess() }} />
          {csvOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">CSV</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(csvOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{csvOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Docker Run to Compose', 'dev', ['docker', 'compose', 'run', 'container']) && (<>
        {/* ── Docker Run to Compose ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="shippingbox" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> Docker Run → Compose</Text><Spacer /></HStack>
          <TextField title="docker run command" value={dockerInput} onChanged={setDockerInput} axis="vertical" prompt="docker run -p 8080:80 -e APP_ENV=prod nginx" />
          <Button title="Convert" systemImage="shippingbox" action={() => { setDockerOutput(dockerRunToCompose(dockerInput)); HapticFeedback.notificationSuccess() }} />
          {dockerOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">DOCKER COMPOSE</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(dockerOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={12}>{dockerOutput}</Text>
          </VStack> : null}
        </VStack>

        {/* ═══ NETWORK ═══ */}

        </>)}
        {toolVisible('IPv4 Range Expander', 'network', ['ipv4', 'range', 'cidr', 'expand']) && (<>
        {/* ── IPv4 Range Expander ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="network" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> IPv4 Range Expander</Text><Spacer /></HStack>
          <TextField title="Start IP" value={rangeStartIp} onChanged={setRangeStartIp} prompt="192.168.1.0" />
          <TextField title="End IP" value={rangeEndIp} onChanged={setRangeEndIp} prompt="192.168.1.255" />
          <Button title="Expand Range" systemImage="network" action={() => { try { setRangeResult(ipv4RangeExpand(rangeStartIp, rangeEndIp)); HapticFeedback.notificationSuccess() } catch (e) { setRangeResult([]) } }} />
          {rangeResult.length > 0 ? <VStack spacing={4}>
            <Text font="caption" foregroundStyle="secondaryLabel">CIDR BLOCKS ({rangeResult.length})</Text>
            <Divider />
            {rangeResult.map((r: any, i: number) => <ResultRow key={i} label={r.cidr} value={`${r.count} hosts`} />)}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('MAC Address Lookup', 'network', ['mac', 'lookup', 'vendor', 'oui']) && (<>
        {/* ── MAC Address Lookup ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="antenna.radiowaves.left.and.right" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> MAC Address Lookup</Text><Spacer /></HStack>
          <TextField title="MAC Address" value={macLookupInput} onChanged={setMacLookupInput} prompt="AA:BB:CC:DD:EE:FF" />
          <Button title="Lookup Vendor" systemImage="antenna.radiowaves.left.and.right" action={() => { setMacLookupResult(macAddressLookup(macLookupInput)); HapticFeedback.notificationSuccess() }} />
          {macLookupResult ? <VStack spacing={4}>
            <ResultRow label="Vendor" value={macLookupResult.vendor} />
            <ResultRow label="OUI" value={macLookupResult.oui} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('IBAN Validator', 'dev', ['iban', 'bank', 'validate', 'account']) && (<>
        {/* ── IBAN Validator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="creditcard" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} /><Text font="headline"> IBAN Validator</Text><Spacer /></HStack>
          <TextField title="IBAN" value={ibanInput} onChanged={setIbanInput} prompt="DE89370400440532013000" />
          <Button title="Validate" systemImage="creditcard" action={() => { setIbanResult(validateIBAN(ibanInput)); HapticFeedback.notificationSuccess() }} />
          {ibanResult ? <VStack spacing={4}>
            <ResultRow label="Valid" value={ibanResult.valid ? '✅ Yes' : '❌ No'} />
            <ResultRow label="Country" value={ibanResult.country} />
            <ResultRow label="Formatted" value={ibanResult.formatted} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Phone Number Parser', 'dev', ['phone', 'parse', 'number', 'international']) && (<>
        {/* ── Phone Number Parser ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="phone" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} /><Text font="headline"> Phone Parser</Text><Spacer /></HStack>
          <TextField title="Phone" value={phoneInput} onChanged={setPhoneInput} prompt="+1 234 567 8900" />
          <Button title="Parse" systemImage="phone" action={() => { setPhoneResult(parsePhoneNumber(phoneInput)); HapticFeedback.notificationSuccess() }} />
          {phoneResult ? <VStack spacing={4}>
            <ResultRow label="Country" value={phoneResult.country} />
            <ResultRow label="Formatted" value={phoneResult.formatted} />
            <ResultRow label="Valid" value={phoneResult.valid ? '✅' : '❌'} />
            <ResultRow label="E.164" value={phoneResult.e164} />
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('HTTP Status Codes', 'web', ['http', 'status', 'code', 'response']) && (<>
        {/* ── HTTP Status Codes ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="globe.desktop" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} /><Text font="headline"> HTTP Status Codes</Text><Spacer /></HStack>
          <TextField title="Status Code" value={httpCodeInput} onChanged={setHttpCodeInput} prompt="404" />
          <Button title="Lookup" systemImage="globe.desktop" action={() => { const c = parseInt(httpCodeInput); if (!isNaN(c)) setHttpCodeResult(formatHttpStatus(c)); HapticFeedback.notificationSuccess() }} />
          {httpCodeResult ? <VStack spacing={4}>
            <ResultRow label="Name" value={httpCodeResult.name} />
            <ResultRow label="Category" value={httpCodeResult.category} />
            <Text font="caption" foregroundStyle="secondaryLabel">{httpCodeResult.description}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('SVG Placeholder', 'web', ['svg', 'placeholder', 'image', 'dummy']) && (<>
        {/* ── SVG Placeholder ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="photo" foregroundStyle="#AF52DE" frame={{ width: 20, height: 20 }} /><Text font="headline"> SVG Placeholder</Text><Spacer /></HStack>
          <HStack spacing={8}>
            <TextField title="W" value={svgW} onChanged={setSvgW} prompt="300" />
            <TextField title="H" value={svgH} onChanged={setSvgH} prompt="200" />
          </HStack>
          <TextField title="Label" value={svgText} onChanged={setSvgText} prompt="300x200" />
          <Button title="Generate SVG" systemImage="photo" action={() => { try { setSvgOutput(generateSVGPlaceholder(parseInt(svgW)||300, parseInt(svgH)||200, svgText)); HapticFeedback.notificationSuccess() } catch (e) { setSvgOutput('Error: ' + String(e)) } }} />
          {svgOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">SVG</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(svgOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={3}>{svgOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Open Graph Meta', 'web', ['og', 'open graph', 'meta', 'social']) && (<>
        {/* ── Open Graph Meta ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="safari" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> Open Graph Meta</Text><Spacer /></HStack>
          <TextField title="Title" value={ogTitle} onChanged={setOgTitle} prompt="My Page" />
          <TextField title="Description" value={ogDesc} onChanged={setOgDesc} prompt="Page desc" />
          <TextField title="URL" value={ogUrl} onChanged={setOgUrl} prompt="https://example.com" />
          <Button title="Generate OG Tags" systemImage="safari" action={() => { setOgOutput(generateOpenGraphMeta({ title: ogTitle, description: ogDesc, url: ogUrl })); HapticFeedback.notificationSuccess() }} />
          {ogOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">META TAGS</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(ogOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={6}>{ogOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Git Cheatsheet', 'dev', ['git', 'cheat', 'command', 'version']) && (<>
        {/* ── Git Cheatsheet ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="chevron.left.forwardslash.chevron.right" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> Git Cheatsheet</Text><Spacer /><Button title={showCheatsheet ? 'Hide' : 'Show'} action={() => setShowCheatsheet(!showCheatsheet)} /></HStack>
          {showCheatsheet ? <VStack spacing={8}>
            {generateGitCheatsheet().map((cat: any, ci: number) => <VStack key={ci} spacing={4}>
              <Text font="subheadline" fontWeight="bold">{cat.category}</Text>
              {cat.commands.map((cmd: any, di: number) => <HStack key={di}>
                <Text font="caption2" foregroundStyle="#007AFF">{cmd.cmd}</Text>
                <Spacer />
                <Text font="caption2" foregroundStyle="secondaryLabel">{cmd.desc}</Text>
              </HStack>)}
            </VStack>)}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Robots.txt Generator', 'web', ['robots', 'crawl', 'seo', 'sitemap']) && (<>
        {/* ── Robots.txt Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="lock.shield" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} /><Text font="headline"> Robots.txt Generator</Text><Spacer /></HStack>
          <TextField title="Allow paths" value={robotsAllow} onChanged={setRobotsAllow} prompt="/" />
          <TextField title="Disallow paths" value={robotsDisallow} onChanged={setRobotsDisallow} prompt="/admin" />
          <TextField title="Sitemap URL" value={robotsSitemap} onChanged={setRobotsSitemap} prompt="https://example.com/sitemap.xml" />
          <Button title="Generate" systemImage="lock.shield" action={() => { setRobotsOutput(generateRobotsTxt({ allow: robotsAllow.split(',').map(s=>s.trim()).filter(Boolean), disallow: robotsDisallow.split(',').map(s=>s.trim()).filter(Boolean), sitemap: robotsSitemap })); HapticFeedback.notificationSuccess() }} />
          {robotsOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">ROBOTS.TXT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(robotsOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{robotsOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Chronometer', 'math', ['chrono', 'timer', 'stopwatch', 'time']) && (<>
        {/* ── Chronometer ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="stopwatch" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} /><Text font="headline"> Chronometer</Text><Spacer /></HStack>
          <TextField title="Milliseconds" value={chronoInput} onChanged={setChronoInput} prompt="123456" />
          <Button title="Format" systemImage="stopwatch" action={() => { setChronoOutput(chronometerFormat(parseInt(chronoInput) || 0)); HapticFeedback.notificationSuccess() }} />
          {chronoOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">TIME</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(chronoOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="largeTitle" fontWeight="bold" fontDesign="monospaced">{chronoOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('JSON ⇄ YAML', 'convert', ['json', 'yaml', 'yml', 'convert']) && (<>
        {/* ── JSON ⇄ YAML ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="arrow.triangle.2.circlepath" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> JSON ⇄ YAML</Text><Spacer /></HStack>
          <Picker title="Direction" value={0} onChanged={() => {}}>
            <Text tag={0}>JSON → YAML</Text>
            <Text tag={1}>YAML → JSON</Text>
          </Picker>
          <TextField title="JSON Input" value={jsonYamlInput} onChanged={setJsonYamlInput} prompt='{"key":"value"}' />
          <Button title="Convert to YAML" systemImage="arrow.triangle.2.circlepath" action={() => { setJsonYamlOutput(jsonToYAML(jsonYamlInput)); HapticFeedback.notificationSuccess() }} />
          {jsonYamlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">YAML OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jsonYamlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{jsonYamlOutput}</Text>
          </VStack> : null}
          <Divider />
          <TextField title="YAML Input" value={yamlJsonInput} onChanged={setYamlJsonInput} prompt="key: value" />
          <Button title="Convert to JSON" systemImage="arrow.triangle.2.circlepath" action={() => { setYamlJsonOutput(yamlToJSON(yamlJsonInput)); HapticFeedback.notificationSuccess() }} />
          {yamlJsonOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">JSON OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(yamlJsonOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{yamlJsonOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('XML ⇄ JSON', 'convert', ['xml', 'json', 'convert']) && (<>
        {/* ── XML ⇄ JSON ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="doc.text.magnifyingglass" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} /><Text font="headline"> XML ⇄ JSON</Text><Spacer /></HStack>
          <TextField title="XML" value={xmlJsonInput} onChanged={setXmlJsonInput} prompt='<root><item>1</item></root>' />
          <Button title="XML → JSON" systemImage="doc.text.magnifyingglass" action={() => { setXmlJsonOutput(xmlToJSON(xmlJsonInput)); HapticFeedback.notificationSuccess() }} />
          {xmlJsonOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">JSON</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(xmlJsonOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{xmlJsonOutput}</Text>
          </VStack> : null}
          <Divider />
          <TextField title="JSON" value={jsonXmlInput} onChanged={setJsonXmlInput} prompt='{"key":"value"}' />
          <Button title="JSON → XML" systemImage="doc.text.magnifyingglass" action={() => { setJsonXmlOutput(jsonToXML(jsonXmlInput)); HapticFeedback.notificationSuccess() }} />
          {jsonXmlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">XML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jsonXmlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{jsonXmlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('TOML ⇄ JSON', 'convert', ['toml', 'json', 'convert']) && (<>
        {/* ── TOML ⇄ JSON ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="doc.plaintext" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> TOML ⇄ JSON</Text><Spacer /></HStack>
          <TextField title="TOML" value={tomlJsonInput} onChanged={setTomlJsonInput} prompt="key = value" />
          <Button title="TOML → JSON" systemImage="doc.plaintext" action={() => { setTomlJsonOutput(tomlToJSON(tomlJsonInput)); HapticFeedback.notificationSuccess() }} />
          {tomlJsonOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">JSON</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(tomlJsonOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{tomlJsonOutput}</Text>
          </VStack> : null}
          <Divider />
          <TextField title="JSON" value={jsonTomlInput} onChanged={setJsonTomlInput} prompt='{"key":"value"}' />
          <Button title="JSON → TOML" systemImage="doc.plaintext" action={() => { setJsonTomlOutput(jsonToTOML(jsonTomlInput)); HapticFeedback.notificationSuccess() }} />
          {jsonTomlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">TOML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(jsonTomlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={10}>{jsonTomlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('URL Parser', 'web', ['url', 'parse', 'query', 'host']) && (<>
        {/* ── URL Parser ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="link" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> URL Parser</Text>
            <Spacer />
          </HStack>
          <TextField title="URL" value={urlParseInput} onChanged={setUrlParseInput} prompt="https://example.com/path?q=1" />
          <Button title="Parse" systemImage="link" action={() => { try { setUrlParseResult(parseURL(urlParseInput)) } catch (e) { setUrlParseResult(null) }; HapticFeedback.notificationSuccess() }} />
          {urlParseResult ? <VStack spacing={4}>
            <ResultRow label="Protocol" value={urlParseResult.protocol} />
            <ResultRow label="Host" value={urlParseResult.host} />
            <ResultRow label="Pathname" value={urlParseResult.pathname} />
            <ResultRow label="Search" value={urlParseResult.search || '(none)'} />
            <ResultRow label="Hash" value={urlParseResult.hash || '(none)'} />
            {Object.keys(urlParseResult.params).length > 0 && <>
              <Text font="caption" foregroundStyle="secondaryLabel">PARAMS</Text>
              {Object.entries(urlParseResult.params).map(([k, v]) => <ResultRow key={k} label={k} value={String(v)} />)}
            </>}
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Roman Numeral Converter', 'convert', ['roman', 'numeral', 'number', 'convert']) && (<>
        {/* ── Roman Numeral Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="textformat.size" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Roman Numeral Converter</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={romanDir} onChanged={setRomanDir}>
            <Text tag={0}>Number → Roman</Text>
            <Text tag={1}>Roman → Number</Text>
          </Picker>
          <TextField title="Input" value={romanInput} onChanged={setRomanInput} prompt={romanDir === 0 ? '2024' : 'MMXXIV'} />
          <Button title="Convert" systemImage="textformat.size" action={() => {
            try {
              const r = romanDir === 0 ? numberToRoman(parseInt(romanInput)) : romanToNumber(romanInput.toUpperCase())
              setRomanOutput(r !== null ? String(r) : 'Invalid input'); HapticFeedback.notificationSuccess()
            } catch (e) { setRomanOutput('Error: ' + String(e)) }
          }} />
          {romanOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">RESULT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(romanOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="title2" fontWeight="semibold">{romanOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Text to NATO Alphabet', 'text', ['nato', 'phonetic', 'alphabet', 'spell']) && (<>
        {/* ── Text to NATO Alphabet ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="person.wave.2" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Text to NATO Alphabet</Text>
            <Spacer />
          </HStack>
          <TextField title="Text" value={natoInput} onChanged={setNatoInput} prompt="Hello" />
          <Button title="Convert" systemImage="person.wave.2" action={() => { setNatoOutput(textToNATO(natoInput)); HapticFeedback.notificationSuccess() }} />
          {natoOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">NATO</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(natoOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline">{natoOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Unicode Converter', 'convert', ['unicode', 'codepoint', 'utf', 'character']) && (<>
        {/* ── Unicode Converter ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="globe" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Unicode Converter</Text>
            <Spacer />
          </HStack>
          <Picker title="Direction" value={uniDir} onChanged={setUniDir}>
            <Text tag={0}>Text → Unicode</Text>
            <Text tag={1}>Unicode → Text</Text>
          </Picker>
          <TextField title="Input" value={uniInput} onChanged={setUniInput} prompt={uniDir === 0 ? 'Hello' : '\\u0048\\u0065\\u006c\\u006c\\u006f'} />
          <Button title="Convert" systemImage="globe" action={() => { setUniOutput(uniDir === 0 ? textToUnicode(uniInput) : unicodeToText(uniInput)); HapticFeedback.notificationSuccess() }} />
          {uniOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(uniOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={4}>{uniOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}
        {toolVisible('Random Port Generator', 'network', ['port', 'random', 'generate', 'tcp']) && (<>
        {/* ── Random Port Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="number" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Random Port Generator</Text>
            <Spacer />
          </HStack>
          <Button title="Generate Random Port" systemImage="number" action={() => { try { setPortValue(randomPort()); HapticFeedback.notificationSuccess() } catch (e) { setPortValue(-1) } }} />
          {portValue < 0 ? <Text font="caption" foregroundStyle="#FF3B30">Error generating port</Text> : null}
          {portValue > 0 ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">PORT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(String(portValue)); HapticFeedback.selection() }} /></HStack>
            <Text font="largeTitle" fontWeight="bold">:{portValue}</Text>
          </VStack> : null}
        </VStack>

        </>)}

        {toolVisible('Bcrypt Generator', 'crypto', ['bcrypt', 'password', 'hash', 'pbkdf2', 'encrypt']) && (<>
        {/* ── Bcrypt Generator ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="lock.rectangle" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Bcrypt Generator</Text>
            <Spacer />
          </HStack>
          <Picker title="Iterations" value={bcIter} onChanged={setBcIter}>
            <Text tag={0}>600,000 (recommended)</Text>
            <Text tag={1}>100,000 (fast)</Text>
            <Text tag={2}>1,200,000 (slow)</Text>
          </Picker>
          <TextField title="Password" value={bcInput} onChanged={setBcInput} prompt="Enter password to hash" />
          <Button title={bcLoading ? 'Hashing…' : 'Generate Hash'} systemImage={bcLoading ? 'hourglass' : 'lock.fill'} action={async () => {
            if (!bcInput) return
            setBcLoading(true)
            try {
              const iters = [600000, 100000, 1200000][bcIter]
              const h = await bcryptHash(bcInput, iters)
              setBcHash(h)
              HapticFeedback.notificationSuccess()
            } catch (e) { setBcHash('Error: ' + String(e)) }
            setBcLoading(false)
          }} disabled={bcLoading || !bcInput} />
          {bcHash ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">HASH</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(bcHash); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={3}>{bcHash}</Text>
          </VStack> : null}
          <Divider />
          <Text font="subheadline" foregroundStyle="secondaryLabel">Verify Password</Text>
          <TextField title="Password" value={bcVerifyPwd} onChanged={setBcVerifyPwd} prompt="Enter password" />
          <TextField title="Hash" value={bcVerifyHash} onChanged={setBcVerifyHash} prompt="$pbkdf2$…" />
          <Button title="Verify" systemImage="checkmark.shield" action={async () => {
            const ok = await bcryptVerify(bcVerifyPwd, bcVerifyHash)
            setBcVerifyResult(ok ? '✅ Password matches!' : '❌ Password does NOT match')
            HapticFeedback.notificationSuccess()
          }} disabled={!bcVerifyPwd || !bcVerifyHash} />
          {bcVerifyResult ? <Text font="subheadline" foregroundStyle={bcVerifyResult.includes('✅') ? '#34C759' : '#FF3B30'}>{bcVerifyResult}</Text> : null}
        </VStack>

        </>)}

        {toolVisible('YAML Prettify', 'convert', ['yaml', 'prettify', 'format', 'beautify', 'minify']) && (<>
        {/* ── YAML Prettify ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="doc.text" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> YAML Prettify</Text>
            <Spacer />
          </HStack>
          <TextField title="YAML Input" value={yamlInput} onChanged={setYamlInput} prompt="Paste YAML here…" />
          <HStack spacing={12}>
            <Button title="Prettify" systemImage="paintbrush" action={() => { setYamlOutput(yamlPrettify(yamlInput)); HapticFeedback.notificationSuccess() }} />
            <Button title="Minify" systemImage="arrow.down.right.and.arrow.up.left" action={() => { setYamlOutput(yamlMinify(yamlInput)); HapticFeedback.notificationSuccess() }} />
            <Button title="Clear" systemImage="trash" foregroundStyle="#FF3B30" action={() => { setYamlInput(''); setYamlOutput('') }} />
          </HStack>
          {yamlOutput ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">OUTPUT</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(yamlOutput); HapticFeedback.selection() }} /></HStack>
            <Text font="caption" lineLimit={20}>{yamlOutput}</Text>
          </VStack> : null}
        </VStack>

        </>)}

        {toolVisible('BIP39 Mnemonic', 'crypto', ['bip39', 'mnemonic', 'seed', 'phrase', 'wallet', 'crypto']) && (<>
        {/* ── BIP39 Mnemonic ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="key.fill" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> BIP39 Mnemonic</Text>
            <Spacer />
          </HStack>
          <Picker title="Word Count" value={bip39Count} onChanged={setBip39Count}>
            <Text tag={0}>12 words (128-bit)</Text>
            <Text tag={1}>15 words (160-bit)</Text>
            <Text tag={2}>24 words (256-bit)</Text>
          </Picker>
          <Button title="Generate Mnemonic" systemImage="key.fill" action={() => {
            try {
              const counts = [12, 15, 24]
              setBip39Output(generateBIP39(counts[bip39Count]))
              HapticFeedback.notificationSuccess()
            } catch (e) { setBip39Output('Error: ' + String(e)) }
          }} />
          {bip39Output ? <VStack spacing={4}>
            <HStack><Text font="caption" foregroundStyle="secondaryLabel">MNEMONIC</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(bip39Output); HapticFeedback.selection() }} /></HStack>
            <Text font="subheadline" lineLimit={5}>{bip39Output}</Text>
            <Text font="caption2" foregroundStyle="secondaryLabel">⚠️ Store this securely. Anyone with this phrase can access your wallet.</Text>
          </VStack> : null}
        </VStack>

        </>)}

        {toolVisible('Regex Cheatsheet', 'dev', ['regex', 'cheatsheet', 'reference', 'pattern', 'regular expression']) && (<>
        {/* ── Regex Cheatsheet ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="doc.text.magnifyingglass" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Regex Cheatsheet</Text>
            <Spacer />
          </HStack>
          <ScrollView>
            <HStack spacing={8}>
              {['Character', 'Quantifier', 'Anchors', 'Groups', 'Flags'].map((cat: string, i: number) => (
                <Button key={i} title={cat} action={() => setRegexCheatCat(i)}
                  foregroundStyle={regexCheatCat === i ? '#FFF' : '#007AFF'}
                  background={regexCheatCat === i ? '#007AFF' : '#007AFF15'}
                  clipShape={{ type: 'rect', cornerRadius: 12 }} />
              ))}
            </HStack>
          </ScrollView>
          <VStack spacing={4}>
            {([
              [['. ', 'Any character'], ['\\d', 'Digit [0-9]'], ['\\D', 'Non-digit'], ['\\w', 'Word char [A-Za-z0-9_]'], ['\\W', 'Non-word'], ['\\s', 'Whitespace'], ['\\S', 'Non-whitespace'], ['[abc]', 'Character set'], ['[^abc]', 'Negated set'], ['[a-z]', 'Range']],
              [['*', '0 or more'], ['+', '1 or more'], ['?', '0 or 1'], ['{n}', 'Exactly n'], ['{n,}', 'n or more'], ['{n,m}', 'n to m'], ['*?', 'Lazy *'], ['+?', 'Lazy +']],
              [['^', 'Start of string'], ['$', 'End of string'], ['\\b', 'Word boundary'], ['\\B', 'Non-word boundary']],
              [['(abc)', 'Capture group'], ['(?:abc)', 'Non-capture'], ['(?=abc)', 'Lookahead'], ['(?!abc)', 'Neg. lookahead'], ['\\1', 'Back-reference']],
              [['g', 'Global'], ['i', 'Case insensitive'], ['m', 'Multiline'], ['s', 'Dotall'], ['u', 'Unicode']],
            ] as string[][][])[regexCheatCat].map(([pat, desc]: string[], i: number) => (
              <HStack key={i}>
                <Text font="caption" fontWeight="bold" foregroundStyle="#007AFF" frame={{ minWidth: 60 }}>{pat}</Text>
                <Text font="caption" foregroundStyle="secondaryLabel">{desc}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        </>)}

        {toolVisible('Device Information', 'web', ['device', 'screen', 'info', 'model', 'battery', 'ios']) && (<>
        {/* ── Device Information ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="iphone" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Device Information</Text>
            <Spacer />
          </HStack>
          <VStack spacing={6}>
            <ResultRow label="Model" value={Device.model} />
            <ResultRow label="System" value={`${Device.systemName} ${Device.systemVersion}`} />
            <ResultRow label="Screen" value={`${Device.screen.width}×${Device.screen.height} @${Device.screen.scale}x`} />
            <ResultRow label="Orientation" value={Device.orientation} />
            <ResultRow label="Battery" value={`${Math.round(Device.batteryLevel * 100)}% (${Device.batteryState})`} />
            <ResultRow label="Locale" value={Device.systemLocale} />
            <ResultRow label="Language" value={Device.preferredLanguages?.[0] || 'Unknown'} />
            <ResultRow label="iPad" value={Device.isiPad ? 'Yes' : 'No'} />
            <ResultRow label="Mac Catalyst" value={Device.isiOSAppOnMac ? 'Yes' : 'No'} />
          </VStack>
        </VStack>

        </>)}

        {toolVisible('Emoji Picker', 'text', ['emoji', 'copy', 'unicode', 'face', 'symbol']) && (<>
        {/* ── Emoji Picker ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="face.smiling" foregroundStyle="#FFD60A" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Emoji Picker</Text>
            <Spacer />
          </HStack>
          <TextField title="Search" value={emojiSearch} onChanged={setEmojiSearch} prompt="Search emojis…" />
          <VStack spacing={8}>
            {(() => {
              const EMOJI_DB: [string, string][] = [
                ['😀','grin'],['😃','smile'],['😄','laugh'],['😁','beam'],['😆','laughing'],['😅','sweat_smile'],['🤣','rofl'],['😂','joy'],
                ['🙂','slight_smile'],['🙃','upside_down'],['😉','wink'],['😊','blush'],['😇','innocent'],['🥰','hearts'],['😍','heart_eyes'],
                ['🤩','star_struck'],['😘','kiss'],['😗','kissing'],['😚','kissing_closed_eyes'],['😙','kissing_smiling_eyes'],['🥲','smile_tear'],
                ['😋','yum'],['😛','stuck_out_tongue'],['😜','stuck_out_tongue_winking_eye'],['🤪','zany'],['😝','stuck_out_tongue_closed_eyes'],
                ['🤑','money_mouth'],['🤗','hugs'],['🤭','hand_over_mouth'],['🤫','shushing'],['🤔','thinking'],['🤐','zipper_mouth'],
                ['🤨','raised_eyebrow'],['😐','neutral'],['😑','expressionless'],['😶','no_mouth'],['😏','smirk'],['😒','unamused'],
                ['🙄','eye_roll'],['😬','grimace'],['🤥','lying'],['😌','relieved'],['😔','pensive'],['😪','sleepy'],['🤤','drooling'],
                ['😴','sleeping'],['😷','mask'],['🤒','thermometer_face'],['🤕','bandage_head'],['🤢','nauseated'],['🤮','vomiting'],
                ['🥵','hot'],['🥶','cold'],['🥴','woozy'],['😵','dizzy'],['🤯','exploding_head'],['🤠','cowboy'],['🥳','partying'],
                ['🥺','pleading'],['😎','sunglasses'],['🤓','nerd'],['🧐','monocle'],['😕','confused'],['😟','worried'],['🙁','frown'],
                ['😮','open_mouth'],['😯','hushed'],['😲','astonished'],['😳','flushed'],['🥺','pleading'],['😦','frown_open'],
                ['😧','anguished'],['😨','fearful'],['😰','cold_sweat'],['😥','sad_relieved'],['😢','cry'],['😭','sob'],['😱','scream'],
                ['😖','confounded'],['😣','persevere'],['😞','disappointed'],['😓','sweat'],['😩','weary'],['😫','tired'],['🥱','yawning'],
                ['😤','triumph'],['😡','rage'],['😠','angry'],['🤬','cursing'],['😈','smiling_imp'],['👿','imp'],['💀','skull'],['☠️','skull_crossbones'],
                ['💩','poop'],['🤡','clown'],['👹','ogre'],['👺','goblin'],['👻','ghost'],['👽','alien'],['👾','space_invader'],['🤖','robot'],
                ['❤️','heart'],['🧡','orange_heart'],['💛','yellow_heart'],['💚','green_heart'],['💙','blue_heart'],['💜','purple_heart'],
                ['🖤','black_heart'],['🤍','white_heart'],['🤎','brown_heart'],['💔','broken_heart'],['❣️','heart_exclamation'],['💕','two_hearts'],
                ['💞','revolving_hearts'],['💓','heartbeat'],['💗','heartpulse'],['💖','sparkling_heart'],['💘','cupid'],['💝','gift_heart'],
                ['👍','thumbsup'],['👎','thumbsdown'],['👏','clap'],['🙌','raised_hands'],['🤝','handshake'],['🙏','pray'],
                ['✊','fist'],['🤛','fist_left'],['🤜','fist_right'],['🤞','crossed_fingers'],['✌️','v'],['🤟','love_you_gesture'],
                ['👌','ok_hand'],['🤌','pinched_fingers'],['🤏','pinching_hand'],['👈','point_left'],['👉','point_right'],['👆','point_up'],
                ['👇','point_down'],['☝️','point_up_2'],['✋','hand'],['🤚','raised_back_of_hand'],['🖐️','raised_hand'],['🖖','vulcan'],
                ['👋','wave'],['🤙','call_me_hand'],['💪','muscle'],['🦾','mechanical_arm'],['🦿','mechanical_leg'],['🖕','middle_finger'],
                ['🐶','dog'],['🐱','cat'],['🐭','mouse'],['🐹','hamster'],['🐰','rabbit'],['🦊','fox'],['🐻','bear'],['🐼','panda'],
                ['🐨','koala'],['🐯','tiger'],['🦁','lion'],['🐮','cow'],['🐷','pig'],['🐸','frog'],['🐵','monkey'],['🙈','see_no_evil'],
                ['🚀','rocket'],['✈️','airplane'],['🚗','car'],['🚕','taxi'],['🚌','bus'],['🏎️','race_car'],['🚓','police_car'],
                ['🏠','house'],['🏢','office'],['🏥','hospital'],['🏦','bank'],['🏪','convenience_store'],['🏫','school'],['🏰','castle'],
                ['⭐','star'],['🌟','glowing_star'],['✨','sparkles'],['⚡','zap'],['🔥','fire'],['🌈','rainbow'],['☀️','sun'],['🌙','moon'],
                ['🍎','apple'],['🍕','pizza'],['🍔','hamburger'],['🍟','fries'],['🌮','taco'],['🍣','sushi'],['🍜','ramen'],['🍦','icecream'],
                ['⚽','soccer'],['🏀','basketball'],['🏈','football'],['⚾','baseball'],['🎾','tennis'],['🏐','volleyball'],['🎱','8ball'],
                ['🎵','musical_note'],['🎶','notes'],['🎤','microphone'],['🎧','headphone'],['🎸','guitar'],['🎹','musical_keyboard'],
                ['📱','iphone'],['💻','computer'],['🖥️','desktop_computer'],['⌨️','keyboard'],['🖱️','mouse_three_button'],['💾','floppy_disk'],
                ['📷','camera'],['📹','video_camera'],['📺','tv'],['📻','radio'],['🔔','bell'],['🔑','key'],['🔒','lock'],['🔓','unlock'],
              ]
              const q = emojiSearch.toLowerCase()
              const filtered = q ? EMOJI_DB.filter(([e, name]) => name.includes(q)) : EMOJI_DB
              const groups: { label: string; emojis: [string, string][] }[] = []
              const catMap: Record<string, [string, string][]> = { 'Smileys': [], 'Gestures': [], 'Animals': [], 'Travel': [], 'Objects': [], 'Symbols': [], 'Food': [], 'Sports': [], 'Music': [], 'Tech': [] }
              for (const pair of filtered) {
                const n = pair[1]
                if (n.match(/grin|smile|laugh|beam|sweat|rofl|joy|blush|innocent|heart_eyes|star_struck|kiss|yum|tongue|zany|money|hug|shush|think|zipper|neutral|smirk|unamused|eye_roll|grimace|lying|relieved|pensive|sleep|drool|mask|thermometer|bandage|nausea|vomit|hot_face|cold_face|woozy|dizzy|explod|cowboy|party|plead|nerd|monocl|confus|worri|frown|open_mouth|hush|aston|flush|anguish|fear|sad|cry|sob|scream|confound|persev|disappoint|weary|tired|yawn|triumph|rage|angry|curs|imp|skull|poop|clown|ogre|goblin|ghost|alien|robot|pleading|unamused|yawning|vomiting|woozy|exploding_head|star_struck|face_thermometer|sunglasses/)) catMap['Smileys'].push(pair)
                else if (n.match(/thumb|clap|hands|handshake|pray|fist|crossed_fingers|love_you|ok_hand|pinched|pinching|point_left|point_right|point_up|point_down|hand$|back_of_hand|raised_hand|vulcan|wave|call_me|muscle|mechanical|middle_finger|^v$/)) catMap['Gestures'].push(pair)
                else if (n.match(/dog|cat|mouse|hamster|rabbit|fox|bear|panda|koala|tiger|lion|cow|pig|frog|monkey|see_no/)) catMap['Animals'].push(pair)
                else if (n.match(/rocket|airplane|car|taxi|bus|race|police|house|office|hospital|bank|store|school|castle/)) catMap['Travel'].push(pair)
                else if (n.match(/glow|sparkle|zap|fire|rainbow|sun|moon|star$|heart|broken|two|revolving|heartbeat|heartpulse|sparkling|cupid|gift_heart|orange_heart|yellow_heart|green_heart|blue_heart|purple_heart|black_heart|white_heart|brown_heart/)) catMap['Symbols'].push(pair)
                else if (n.match(/apple|pizza|burger|fries|taco|sushi|ramen|icecream/)) catMap['Food'].push(pair)
                else if (n.match(/soccer|basket|foot|base|tennis|volley|8ball/)) catMap['Sports'].push(pair)
                else if (n.match(/note|music|microphone|headphone|guitar|musical_keyboard/)) catMap['Music'].push(pair)
                else if (n.match(/iphone|computer|desktop|keyboard$|mouse_three|floppy|camera|video_camera|tv$|radio$|bell$|^key$|^lock$|^unlock$/)) catMap['Tech'].push(pair)
                else catMap['Objects'].push(pair)
              }
              for (const [label, emojis] of Object.entries(catMap)) {
                if (emojis.length > 0) groups.push({ label, emojis })
              }
              return groups.map((g: { label: string; emojis: [string, string][] }) => (
                <VStack key={g.label} spacing={4}>
                  <Text font="caption" foregroundStyle="secondaryLabel">{g.label} ({g.emojis.length})</Text>
                  <HStack spacing={0}>
                    {g.emojis.slice(0, 30).map(([emoji, name]: [string, string], i: number) => (
                      <Button key={i} title={emoji} action={() => { Pasteboard.setString(emoji); setEmojiCopied(emoji); HapticFeedback.notificationSuccess() }}
                        frame={{ width: 36, height: 36 }} font="title2" />
                    ))}
                  </HStack>
                </VStack>
              ))
            })()}
          </VStack>
          {emojiCopied ? <Text font="caption" foregroundStyle="systemGreen">Copied {emojiCopied}</Text> : null}
        </VStack>

        </>)}

        {toolVisible('Benchmark Builder', 'math', ['benchmark', 'compare', 'performance', 'timer', 'speed']) && (<>
        {/* ── Benchmark Builder ── */}
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack>
            <Image systemName="stopwatch" foregroundStyle="#30D158" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Benchmark Builder</Text>
            <Spacer />
          </HStack>
          {benchTasks.map((task: string, i: number) => (
            <HStack key={i}>
              <TextField title={`Task ${i + 1}`} value={task} onChanged={(v: string) => { const t = [...benchTasks]; t[i] = v; setBenchTasks(t) }} prompt="e.g. Array.sort()" />
              {benchTasks.length > 2 ? <Button title="" systemImage="minus.circle.fill" foregroundStyle="#FF3B30" action={() => { setBenchTasks(benchTasks.filter((_: string, j: number) => j !== i)); setBenchResults([]) }} /> : null}
            </HStack>
          ))}
          <HStack>
            <Button title="Add Task" systemImage="plus.circle" action={() => { setBenchTasks([...benchTasks, '']); setBenchResults([]) }} />
            <Spacer />
          </HStack>
          <Button title={benchRunning ? 'Running…' : 'Run Benchmark'} systemImage={benchRunning ? 'hourglass' : 'play.fill'} action={async () => {
            setBenchRunning(true)
            setBenchResults([])
            const results: number[] = []
            for (const task of benchTasks) {
              if (!task.trim()) { results.push(0); continue }
              const start = Date.now()
              try {
                const iterations = 1000
                // @ts-ignore — dynamic code execution
                const fn = new Function(`for(var i=0;i<${iterations};i++){${task}}`)
                fn()
                results.push((Date.now() - start) / iterations)
              } catch (benchErr) { results.push(-1) }
            }
            setBenchResults(results)
            setBenchRunning(false)
            HapticFeedback.notificationSuccess()
          }} />
          {benchResults.length > 0 ? <VStack spacing={4}>
            <Text font="caption" foregroundStyle="secondaryLabel">Results (ms/iteration, 1000 iterations)</Text>
            {benchResults.map((ms: number, i: number) => (
              <HStack key={i}>
                <Text font="subheadline" frame={{ minWidth: 80 }}>{benchTasks[i]?.slice(0, 20) || `Task ${i + 1}`}</Text>
                <Spacer />
                <Text font="subheadline" fontWeight="bold" foregroundStyle={ms < 0 ? '#FF3B30' : ms === Math.min(...benchResults.filter((r: number) => r > 0)) ? '#30D158' : 'label'}>
                  {ms < 0 ? 'Error' : ms < 1 ? `${(ms * 1000).toFixed(1)}µs` : `${ms.toFixed(2)}ms`}
                </Text>
              </HStack>
            ))}
          </VStack> : null}
        </VStack>

        </>)}

        {/* ── QR Code Generator ── */}
        {toolVisible('QR Code Generator', 'web', ['qr', 'qrcode', 'code', 'generator']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="qrcode" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> QR Code Generator</Text><Spacer /></HStack>
          <TextField title="Text / URL" value={qrInput} onChanged={setQrInput} prompt="https://example.com" />
          <Button title="Preview QR" systemImage="qrcode.viewfinder" action={async () => {
            try { const img = await UIImage.fromURL(makeQRUrl(qrInput)); if (img) await QuickLook.previewImage(img, true) } catch {}
          }} />
          <Button title="Copy QR Image URL" systemImage="doc.on.doc" action={() => { Pasteboard.setString(makeQRUrl(qrInput)); HapticFeedback.selection() }} />
        </VStack>
        </>)}

        {/* ── WiFi QR Code Generator ── */}
        {toolVisible('WiFi QR Code Generator', 'web', ['wifi', 'qr', 'ssid', 'password']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="wifi" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} /><Text font="headline"> WiFi QR Code Generator</Text><Spacer /></HStack>
          <TextField title="SSID" value={wifiSsid} onChanged={setWifiSsid} prompt="Network name" />
          <TextField title="Password" value={wifiPass} onChanged={setWifiPass} prompt="WiFi password" />
          <Picker title="Encryption" value={wifiEnc} onChanged={setWifiEnc}><Text tag={0}>WPA/WPA2</Text><Text tag={1}>WEP</Text><Text tag={2}>None</Text></Picker>
          <Toggle title="Hidden network" value={wifiHidden} onChanged={setWifiHidden} />
          <Button title="Preview WiFi QR" systemImage="qrcode.viewfinder" action={async () => {
            const txt = makeWifiQRText(wifiSsid, wifiPass, ['WPA','WEP','nopass'][wifiEnc], wifiHidden)
            try { const img = await UIImage.fromURL(makeQRUrl(txt)); if (img) await QuickLook.previewImage(img, true) } catch {}
          }} />
          <Button title="Copy WiFi QR Text" systemImage="doc.on.doc" action={() => { Pasteboard.setString(makeWifiQRText(wifiSsid, wifiPass, ['WPA','WEP','nopass'][wifiEnc], wifiHidden)); HapticFeedback.selection() }} />
        </VStack>
        </>)}

        {/* ── Base64 File Converter ── */}
        {toolVisible('Base64 File Converter', 'convert', ['base64', 'file', 'encode', 'decode']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="doc.badge.gearshape" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> Base64 File Converter</Text><Spacer /></HStack>
          <Button title="Pick File → Base64" systemImage="doc" action={async () => {
            const files = await DocumentPicker.pickFiles(); const p = files?.[0]; if (!p) return
            const data = Data.fromFile(p); setB64FileResult(data ? data.toBase64String() : 'Cannot read file'); HapticFeedback.notificationSuccess()
          }} />
          <Button title="Export Base64 as File" systemImage="square.and.arrow.up" action={async () => {
            const data = Data.fromBase64String(b64FileResult.trim()); if (!data) { setB64FileResult('Invalid base64'); return }
            await DocumentPicker.exportFiles({ files: [{ data, name: 'decoded.bin' }] } as any)
          }} />
          {b64FileResult ? <VStack spacing={4}><HStack><Text font="caption" foregroundStyle="secondaryLabel">BASE64</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => { Pasteboard.setString(b64FileResult); HapticFeedback.selection() }} /></HStack><Text font="caption" lineLimit={8}>{b64FileResult}</Text></VStack> : null}
        </VStack>
        </>)}

        {/* ── Date-time Converter ── */}
        {toolVisible('Date-time Converter', 'convert', ['date', 'time', 'timestamp', 'iso']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="calendar.badge.clock" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} /><Text font="headline"> Date-time Converter</Text><Spacer /></HStack>
          <TextField title="Date / Timestamp" value={dateTimeInput} onChanged={setDateTimeInput} prompt="now, ISO, 1715000000, 1715000000000" />
          <Button title="Convert" systemImage="calendar" action={() => { setDateTimeResult(convertDateTime(dateTimeInput)); HapticFeedback.notificationSuccess() }} />
          {dateTimeResult ? <VStack spacing={4}>{Object.entries(dateTimeResult).map(([k, v]) => <ResultRow key={k} label={k} value={String(v)} />)}</VStack> : null}
        </VStack>
        </>)}

        {/* ── YAML ⇄ TOML ── */}
        {toolVisible('YAML ⇄ TOML', 'convert', ['yaml', 'toml', 'convert']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="arrow.left.arrow.right.circle" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} /><Text font="headline"> YAML ⇄ TOML</Text><Spacer /></HStack>
          <TextField title="YAML" value={ytInput} onChanged={setYtInput} prompt="key: value" />
          <Button title="YAML → TOML" systemImage="arrow.right" action={() => { setYtOutput(yamlToTomlText(ytInput)); HapticFeedback.notificationSuccess() }} />
          {ytOutput ? <VStack spacing={4}><HStack><Text font="caption" foregroundStyle="secondaryLabel">TOML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => Pasteboard.setString(ytOutput)} /></HStack><Text font="caption" lineLimit={8}>{ytOutput}</Text></VStack> : null}
          <Divider />
          <TextField title="TOML" value={tyInput} onChanged={setTyInput} prompt={'key = "value"'} />
          <Button title="TOML → YAML" systemImage="arrow.right" action={() => { setTyOutput(tomlToYamlText(tyInput)); HapticFeedback.notificationSuccess() }} />
          {tyOutput ? <VStack spacing={4}><HStack><Text font="caption" foregroundStyle="secondaryLabel">YAML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => Pasteboard.setString(tyOutput)} /></HStack><Text font="caption" lineLimit={8}>{tyOutput}</Text></VStack> : null}
        </VStack>
        </>)}

        {/* ── ASCII Art Text Generator ── */}
        {toolVisible('ASCII Art Text Generator', 'text', ['ascii', 'art', 'text', 'font']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="textformat.size.larger" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} /><Text font="headline"> ASCII Art Text Generator</Text><Spacer /></HStack>
          <TextField title="Text" value={asciiInput} onChanged={setAsciiInput} prompt="IT Tools" />
          <Button title="Generate" systemImage="textformat" action={() => { setAsciiOutput(asciiArt(asciiInput)); HapticFeedback.notificationSuccess() }} />
          {asciiOutput ? <VStack spacing={4}><HStack><Text font="caption" foregroundStyle="secondaryLabel">ASCII</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => Pasteboard.setString(asciiOutput)} /></HStack><Text font="caption" fontDesign="monospaced" lineLimit={10}>{asciiOutput}</Text></VStack> : null}
        </VStack>
        </>)}

        {/* ── Crontab Generator ── */}
        {toolVisible('Crontab Generator', 'dev', ['crontab', 'cron', 'generate', 'schedule']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="calendar.badge.plus" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} /><Text font="headline"> Crontab Generator</Text><Spacer /></HStack>
          <HStack><TextField title="Min" value={cronMin} onChanged={setCronMin} /><TextField title="Hour" value={cronHour} onChanged={setCronHour} /></HStack>
          <HStack><TextField title="Day" value={cronDom} onChanged={setCronDom} /><TextField title="Month" value={cronMon} onChanged={setCronMon} /><TextField title="Weekday" value={cronDow} onChanged={setCronDow} /></HStack>
          <Button title="Generate" systemImage="calendar" action={() => { const c = generateCrontab(cronMin, cronHour, cronDom, cronMon, cronDow); setCronGenOutput(`${c}\n${parseCron(c)}`); HapticFeedback.notificationSuccess() }} />
          {cronGenOutput ? <Text font="subheadline" fontDesign="monospaced">{cronGenOutput}</Text> : null}
        </VStack>
        </>)}

        {/* ── Keycode Info ── */}
        {toolVisible('Keycode Info', 'dev', ['keycode', 'keyboard', 'code', 'event']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="keyboard" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} /><Text font="headline"> Keycode Info</Text><Spacer /></HStack>
          <Text font="caption" foregroundStyle="secondaryLabel">Open a WebView and press hardware/software keyboard keys to inspect key/code/modifiers.</Text>
          <Button title="Open Keycode Tester" systemImage="keyboard" action={() => presentKeycodeInfo()} />
        </VStack>
        </>)}

        {/* ── HTML WYSIWYG Editor ── */}
        {toolVisible('HTML WYSIWYG Editor', 'web', ['html', 'wysiwyg', 'editor']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="character.cursor.ibeam" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} /><Text font="headline"> HTML WYSIWYG Editor</Text><Spacer /></HStack>
          <TextField title="Initial HTML" value={htmlEditorInput} onChanged={setHtmlEditorInput} prompt="<h1>Hello</h1>" />
          <Button title="Open Editor" systemImage="pencil" action={async () => { setHtmlEditorOutput(await presentHtmlEditor(htmlEditorInput)); HapticFeedback.notificationSuccess() }} />
          {htmlEditorOutput ? <VStack spacing={4}><HStack><Text font="caption" foregroundStyle="secondaryLabel">HTML</Text><Spacer /><Button title="Copy" systemImage="doc.on.doc" action={() => Pasteboard.setString(htmlEditorOutput)} /></HStack><Text font="caption" lineLimit={8}>{htmlEditorOutput}</Text></VStack> : null}
        </VStack>
        </>)}

        {/* ── Camera Recorder ── */}
        {toolVisible('Camera Recorder', 'web', ['camera', 'recorder', 'photo', 'video']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="camera" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} /><Text font="headline"> Camera Recorder</Text><Spacer /></HStack>
          <Button title="Take Photo" systemImage="camera" action={async () => { const img = await Photos.takePhoto(); setCameraResult(img ? 'Photo captured' : 'Canceled'); HapticFeedback.notificationSuccess() }} />
          <Button title="Record Video" systemImage="video" action={async () => { const r = await Photos.capture({ mode: 'video', mediaTypes: ['public.movie'] as any, videoMaximumDuration: 600, videoQuality: 'medium' }); setCameraResult(r?.mediaPath ? `Video: ${r.mediaPath}` : 'Canceled'); HapticFeedback.notificationSuccess() }} />
          {cameraResult ? <Text font="caption" foregroundStyle="secondaryLabel">{cameraResult}</Text> : null}
        </VStack>
        </>)}

        {/* ── PDF Signature Checker ── */}
        {toolVisible('PDF Signature Checker', 'dev', ['pdf', 'signature', 'checker', 'verify']) && (<>
        <VStack spacing={12} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 13 }}>
          <HStack><Image systemName="signature" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} /><Text font="headline"> PDF Signature Checker</Text><Spacer /></HStack>
          <Text font="caption" foregroundStyle="secondaryLabel">Basic local check: detects PDF signature markers (/ByteRange, /Sig) and calculates SHA-256. It does not cryptographically validate certificate trust.</Text>
          <Button title="Pick PDF" systemImage="doc" action={async () => { const files = await DocumentPicker.pickFiles(); const p = files?.[0]; if (p) setPdfResult(await analyzePdfFile(p)); HapticFeedback.notificationSuccess() }} />
          {pdfResult ? <VStack spacing={4}>{Object.entries(pdfResult).map(([k, v]) => <ResultRow key={k} label={k} value={String(v)} />)}</VStack> : null}
        </VStack>
        </>)}

        </>
      )}

      </VStack>

    </ScrollView>
  )
}