// Lookup - DNS (DoH), WHOIS/RDAP, TLS Certificate (crt.sh CT Log)
// @ts-ignore — onResume works at runtime
import { useState, useEffect, VStack, HStack, Text, ScrollView, Button, TextField, Divider, Spacer, ProgressView, Picker, Toggle, Image, Navigation, Script, onResume } from 'scripting'
import {
  dnsLookup, dnsLookupAll, whoisLookup, sslCheck, tlsAnalyze, DNSRecord, SSLCheckResult, TLSConnectionInfo
} from '../utils/shell'
import { parseWhoisOutput } from '../utils/encoding'

const DNS_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'ALL']

export default function LookupView() {
  const dismiss = Navigation.useDismiss()

  // Reset loading states on resume
  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) {
        setDnsLoading(false)
        setWhoisLoading(false)
        setSslLoading(false)
        setTlsLoading(false)
      }
    })
    return dispose
  }, [])

  // DNS state
  const [dnsHost, setDnsHost] = useState('google.com')
  const [dnsType, setDnsType] = useState(0)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsResults, setDnsResults] = useState<Record<string, DNSRecord[]>>({})
  const [dnsError, setDnsError] = useState('')
  const [customDoh, setCustomDoh] = useState('')
  const [showCustomDoh, setShowCustomDoh] = useState(false)

  // WHOIS state
  const [whoisQuery, setWhoisQuery] = useState('')
  const [whoisLoading, setWhoisLoading] = useState(false)
  const [whoisResults, setWhoisResults] = useState<Record<string, string>>({})
  const [whoisRaw, setWhoisRaw] = useState('')
  const [showRawWhois, setShowRawWhois] = useState(false)
  const [whoisError, setWhoisError] = useState('')

  // SSL state
  const [sslHost, setSslHost] = useState('google.com')
  const [sslLoading, setSslLoading] = useState(false)
  const [sslResult, setSslResult] = useState<SSLCheckResult | null>(null)
  const [tlsInfo, setTlsInfo] = useState<TLSConnectionInfo | null>(null)
  const [tlsLoading, setTlsLoading] = useState(false)
  const [showRawTls, setShowRawTls] = useState(false)
  const [sslError, setSslError] = useState('')
  const [tlsError, setTlsError] = useState('')

  async function runDNS() {
    if (!dnsHost.trim()) return
    setDnsLoading(true)
    setDnsResults({})
    setDnsError('')
    try {
      const type = DNS_TYPES[dnsType]
      let results: Record<string, DNSRecord[]>
      const doh = showCustomDoh ? customDoh : undefined
      if (type === 'ALL') {
        results = await dnsLookupAll(dnsHost.trim(), doh)
      } else {
        const records = await dnsLookup(dnsHost.trim(), type, doh)
        results = { [type]: records }
      }
      setDnsResults(results)
      if (Object.keys(results).length === 0) {
        setDnsError(`No ${type} records found for ${dnsHost.trim()}. The domain may not exist or the DNS server returned no results.`)
      }
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setDnsError(e.message || 'DNS lookup failed')
    }
    setDnsLoading(false)
  }

  async function runWhois() {
    if (!whoisQuery.trim()) return
    setWhoisLoading(true)
    setWhoisResults({})
    setWhoisRaw('')
    setWhoisError('')
    try {
      const raw = await whoisLookup(whoisQuery.trim())
      setWhoisRaw(raw)
      setWhoisResults(parseWhoisOutput(raw))
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setWhoisError(e.message || 'WHOIS lookup failed')
      HapticFeedback.notificationError()
    }
    setWhoisLoading(false)
  }

  async function runSSL() {
    if (!sslHost.trim()) return
    setSslLoading(true)
    setSslResult(null)
    setTlsInfo(null)
    setSslError('')
    try {
      const cert = await sslCheck(sslHost.trim())
      setSslResult(cert)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setSslError(e.message || 'SSL check failed')
      HapticFeedback.notificationError()
    }
    setSslLoading(false)
  }

  async function runTLSAnalysis() {
    if (!sslHost.trim()) return
    setTlsLoading(true)
    setTlsInfo(null)
    setTlsError('')
    try {
      const info = await tlsAnalyze(sslHost.trim())
      setTlsInfo(info)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setTlsError(e.message || 'TLS analysis failed')
      HapticFeedback.notificationError()
    }
    setTlsLoading(false)
  }

  const dnsEntries = Object.entries(dnsResults)

  return (
    <ScrollView
      navigationTitle="Lookup"
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>
        {/* ── DNS Lookup ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="globe" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> DNS Lookup</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">via DoH</Text>
          </HStack>

          <TextField title="Hostname" value={dnsHost} onChanged={setDnsHost} prompt="e.g. google.com" />
          <Picker title="Type" value={dnsType} onChanged={setDnsType}>
            {DNS_TYPES.map((t: string, i: number) => (
              <Text key={i} tag={i}>{t}</Text>
            ))}
          </Picker>

          <Toggle title="Custom DoH Server" value={showCustomDoh} onChanged={setShowCustomDoh} />
          {showCustomDoh ? (
            <>
              <TextField
                title="DoH URL"
                value={customDoh}
                onChanged={setCustomDoh}
                prompt="e.g. https://dns.nextdns.io/xxxx/dns-query"
              />
              <Text font="caption2" foregroundStyle="tertiaryLabel">
                {'Enter full DoH endpoint URL. Falls back to Cloudflare/Google if empty.'}
              </Text>
            </>
          ) : null}

          <Button
            title={dnsLoading ? 'Looking up…' : 'Lookup'}
            systemImage={dnsLoading ? 'hourglass' : 'magnifyingglass'}
            action={runDNS}
            disabled={dnsLoading}
          />
        </VStack>

        {dnsLoading && (
          <VStack alignment="center" padding><ProgressView /></VStack>
        )}

        {dnsEntries.length > 0 && !dnsLoading && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">DNS Records</Text>
              <Spacer />
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                action={() => {
                  const text = dnsEntries.map(([type, records]: [string, DNSRecord[]]) =>
                    `[${type}]\n${records.map((r: DNSRecord) => r.value + (r.ttl ? ` (TTL ${r.ttl}s)` : '')).join('\n')}`
                  ).join('\n\n')
                  Pasteboard.setString(text)
                  HapticFeedback.selection()
                }}
              />
            </HStack>
            {dnsEntries.map(([type, records]: [string, DNSRecord[]]) => (
              <VStack key={type} spacing={4}>
                <HStack>
                  <Text font="subheadline" foregroundStyle="#007AFF">{type}</Text>
                  <Spacer />
                  <Text font="caption" foregroundStyle="secondaryLabel">{records.length} record(s)</Text>
                </HStack>
                {records.map((r: DNSRecord, i: number) => (
                  <HStack key={i} padding={{ leading: 12 }}>
                    <Text font="body" foregroundStyle="label">{r.value}</Text>
                    <Spacer />
                    {r.ttl ? <Text font="caption" foregroundStyle="secondaryLabel">TTL {r.ttl}s</Text> : null}
                  </HStack>
                ))}
                <Divider />
              </VStack>
            ))}
          </VStack>
        )}

        {dnsEntries.length === 0 && !dnsLoading && Boolean(dnsHost) && (
          <VStack alignment="center" padding>
            {dnsError ? (
              <Text font="subheadline" foregroundStyle="#FF3B30">{dnsError}</Text>
            ) : (
              <Text font="subheadline" foregroundStyle="secondaryLabel">No records found. Run a lookup first.</Text>
            )}
          </VStack>
        )}

        {/* ── WHOIS Lookup ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="doc.text.magnifyingglass" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> WHOIS / RDAP</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">RDAP + API</Text>
          </HStack>

          <TextField title="Query" value={whoisQuery} onChanged={setWhoisQuery} prompt="Domain, IP, or ASN" />
          <Button
            title={whoisLoading ? 'Querying…' : 'WHOIS / RDAP Lookup'}
            systemImage={whoisLoading ? 'hourglass' : 'magnifyingglass'}
            action={runWhois}
            disabled={whoisLoading}
          />
        </VStack>

        {whoisLoading && (
          <VStack alignment="center" padding><ProgressView /></VStack>
        )}

        {whoisError && !whoisLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {whoisError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {Boolean(whoisRaw) && !whoisLoading && !whoisError && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">WHOIS Results</Text>
              <Spacer />
              <Toggle title="Raw" value={showRawWhois} onChanged={setShowRawWhois} />
            </HStack>
            <HStack>
              <Spacer />
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                action={() => {
                  Pasteboard.setString(showRawWhois ? whoisRaw : Object.entries(whoisResults).map(([k, v]: [string, string]) => `${k}: ${v}`).join('\n'))
                  HapticFeedback.selection()
                }}
              />
            </HStack>

            {showRawWhois ? (
              <Text font="caption" foregroundStyle="label">{whoisRaw}</Text>
            ) : (
              <VStack spacing={4}>
                {Object.entries(whoisResults).slice(0, 30).map(([key, val]: [string, string]) => (
                  <HStack key={key}>
                    <Text font="caption" foregroundStyle="#007AFF" frame={{ minWidth: 90, maxWidth: 140 }} lineLimit={1}>{key}</Text>
                    <Text font="caption">{val}</Text>
                  </HStack>
                ))}
                {Object.keys(whoisResults).length > 30 && (
                  <Text font="caption" foregroundStyle="secondaryLabel">
                    +{Object.keys(whoisResults).length - 30} more fields (toggle Raw to see all)
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        )}

        {/* ── TLS Certificate ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="lock.shield" foregroundStyle="#34C759" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> TLS Certificate</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">CT Log + SSL Labs</Text>
          </HStack>

          <TextField title="Hostname" value={sslHost} onChanged={setSslHost} prompt="e.g. google.com" />
          <HStack spacing={8}>
            <Button
              title={sslLoading ? 'Checking…' : 'Check Certificate'}
              systemImage={sslLoading ? 'hourglass' : 'lock.magnifyingglass'}
              action={runSSL}
              disabled={sslLoading}
            />
            <Button
              title={tlsLoading ? 'Analyzing…' : 'TLS Analysis'}
              systemImage={tlsLoading ? 'hourglass' : 'shield.checkered'}
              action={runTLSAnalysis}
              disabled={tlsLoading}
            />
          </HStack>
        </VStack>

        {(sslLoading || tlsLoading) && (
          <VStack alignment="center" padding><ProgressView /></VStack>
        )}

        {sslResult && !sslLoading ? (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Certificate Info</Text>
              <Spacer />
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                action={() => {
                  const lines: string[] = [
                    `Subject: ${sslResult.subject}`,
                    `Issuer: ${sslResult.issuer}`,
                    `Valid: ${sslResult.notBefore} -> ${sslResult.notAfter}`,
                    `Status: ${sslResult.isExpired ? 'EXPIRED' : `Valid (${sslResult.expiresInDays} days left)`}`,
                    `Serial: ${sslResult.serialNumber}`,
                  ]
                  if (sslResult.sans?.length) lines.push(`SANs: ${sslResult.sans.join(', ')}`)
                  lines.push(`CT Log entries: ${sslResult.certCount}`)
                  Pasteboard.setString(lines.join('\n'))
                  HapticFeedback.selection()
                }}
              />
            </HStack>
            <Divider />

            {/* Error state */}
            {sslResult.error ? (
              <HStack>
                <Text foregroundStyle="#FF3B30" font="subheadline">{sslResult.error}</Text>
              </HStack>
            ) : null}

            {/* Expiry status banner */}
            {!sslResult.error && (
              <HStack
                padding={{ horizontal: 12, vertical: 8 }}
                background={sslResult.isExpired ? '#FF3B3020' : sslResult.expiresInDays < 30 ? '#FF950020' : '#34C75920'}
                clipShape={{ type: 'rect', cornerRadius: 8 }}
              >
                <Text font="subheadline">
                  {sslResult.isExpired ? 'EXPIRED' : sslResult.expiresInDays < 30 ? 'Expiring Soon' : 'Valid'}
                </Text>
                <Spacer />
                <Text font="subheadline" foregroundStyle={sslResult.isExpired ? '#FF3B30' : sslResult.expiresInDays < 30 ? '#FF9500' : '#34C759'}>
                  {sslResult.isExpired ? `Expired ${-sslResult.expiresInDays} days ago` : `${sslResult.expiresInDays} days remaining`}
                </Text>
              </HStack>
            )}

            {!sslResult.error && (
              <>
                <VStack spacing={2}>
                  <Text font="caption" foregroundStyle="secondaryLabel">COMMON NAME</Text>
                  <Text font="subheadline">{sslResult.commonName}</Text>
                </VStack>
                <VStack spacing={2}>
                  <Text font="caption" foregroundStyle="secondaryLabel">ISSUER</Text>
                  <Text font="subheadline">{sslResult.issuer}</Text>
                </VStack>
                <HStack>
                  <Text font="caption" foregroundStyle="secondaryLabel">Valid From</Text>
                  <Spacer />
                  <Text font="subheadline">{sslResult.notBefore?.substring(0, 10)}</Text>
                </HStack>
                <HStack>
                  <Text font="caption" foregroundStyle="secondaryLabel">Expires</Text>
                  <Spacer />
                  <Text font="subheadline" foregroundStyle={sslResult.isExpired ? '#FF3B30' : undefined}>{sslResult.notAfter?.substring(0, 10)}</Text>
                </HStack>
                <HStack>
                  <Text font="caption" foregroundStyle="secondaryLabel">Serial</Text>
                  <Spacer />
                  <Text font="caption" foregroundStyle="secondaryLabel">{sslResult.serialNumber?.substring(0, 32)}</Text>
                </HStack>

                {/* SANs */}
                {sslResult.sans && sslResult.sans.length > 0 && (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">SUBJECT ALT NAMES ({sslResult.sans.length})</Text>
                    {sslResult.sans.slice(0, 15).map((san: string, i: number) => (
                      <HStack key={i} padding={{ leading: 8 }}>
                        <Text font="caption" foregroundStyle={san.includes('*') ? '#FF9500' : 'label'}>{san}</Text>
                      </HStack>
                    ))}
                    {sslResult.sans.length > 15 && (
                      <Text font="caption" foregroundStyle="tertiaryLabel">+{sslResult.sans.length - 15} more</Text>
                    )}
                  </VStack>
                )}

                <HStack>
                  <Text font="caption" foregroundStyle="secondaryLabel">CT Log Entries</Text>
                  <Spacer />
                  <Text font="subheadline">{sslResult.certCount}</Text>
                </HStack>

                {sslResult.latestId ? (
                  <Button
                    title="View on crt.sh"
                    systemImage="arrow.up.right.square"
                    // @ts-ignore — openURL is a Scripting runtime global
                    action={() => openURL(`https://crt.sh/?id=${sslResult.latestId}`)}
                  />
                ) : null}
              </>
            )}
          </VStack>
        ) : null}

        {sslResult?.error && !sslLoading && !tlsLoading ? (
          <VStack alignment="center" padding>
            <Text font="subheadline" foregroundStyle="secondaryLabel">Certificate lookup failed. Check the hostname and try again.</Text>
          </VStack>
        ) : null}

        {!sslResult && !sslLoading && !tlsLoading && Boolean(sslHost) && (
          <VStack alignment="center" padding spacing={4}>
            {sslError ? (
              <Text font="subheadline" foregroundStyle="#FF3B30">{sslError}</Text>
            ) : (<>
                <Text font="subheadline" foregroundStyle="secondaryLabel">Checks crt.sh Certificate Transparency logs (not live TLS).</Text>
                <Text font="caption" foregroundStyle="tertiaryLabel">For live cert details, use "TLS Analysis" button above.</Text>
            </>) }
          </VStack>
        )}

        {/* ── TLS Connection Analysis Results ── */}
        {tlsError && !tlsLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {tlsError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {tlsInfo && !tlsLoading ? (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">TLS Connection Analysis</Text>
              <Spacer />
              <Toggle title="Raw" value={showRawTls} onChanged={setShowRawTls} />
            </HStack>
            <HStack>
              <Spacer />
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                action={() => {
                  const lines: string[] = [`TLS Analysis: ${tlsInfo.serverName}`]
                  if (tlsInfo.grade && tlsInfo.grade !== 'N/A') lines.push(`Grade: ${tlsInfo.grade}`)
                  if (tlsInfo.protocols.length) lines.push(`Protocols: ${tlsInfo.protocols.join(', ')}`)
                  if (tlsInfo.cipherSuites.length) lines.push(`Cipher Suites:\n${tlsInfo.cipherSuites.map((c: { name: string; strength: string }) => `  ${c.name} (${c.strength})`).join('\n')}`)
                  if (tlsInfo.certSubject) lines.push(`Subject: ${tlsInfo.certSubject}`)
                  if (tlsInfo.certIssuer) lines.push(`Issuer: ${tlsInfo.certIssuer}`)
                  if (tlsInfo.error) lines.push(`Note: ${tlsInfo.error}`)
                  Pasteboard.setString(lines.join('\n'))
                  HapticFeedback.selection()
                }}
              />
            </HStack>
            <Divider />

            {tlsInfo.error ? (
              <VStack spacing={4}>
                <Text font="subheadline" foregroundStyle="#FF9500">{tlsInfo.error}</Text>
                <Text font="caption" foregroundStyle="secondaryLabel">SSL Labs scans can take 1-2 minutes. First query starts a new analysis.</Text>
              </VStack>
            ) : showRawTls ? (
              <VStack spacing={6}>
                {tlsInfo.rawJSON ? (
                  <>
                    <Text font="caption" foregroundStyle="secondaryLabel">Raw JSON ({tlsInfo.rawJSON.length > 4000 ? `showing 4000 of ${tlsInfo.rawJSON.length}` : `${tlsInfo.rawJSON.length}`} chars)</Text>
                    <Text font="caption2" foregroundStyle="label" lineLimit={200}>{tlsInfo.rawJSON.substring(0, 4000)}{tlsInfo.rawJSON.length > 4000 ? '\n\n... (truncated, copy for full JSON)' : ''}</Text>
                    <Button
                      title="Copy Full JSON"
                      systemImage="doc.on.doc"
                      action={() => {
                        Pasteboard.setString(tlsInfo.rawJSON || '')
                        HapticFeedback.notificationSuccess()
                      }}
                    />
                  </>
                ) : (
                  <Text font="caption" foregroundStyle="secondaryLabel">No raw data available</Text>
                )}
              </VStack>
            ) : (
              <>
                {/* Grade */}
                {tlsInfo.grade && tlsInfo.grade !== 'N/A' ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">GRADE</Text>
                    <Spacer />
                    <HStack
                      padding={{ horizontal: 12, vertical: 4 }}
                      background={tlsInfo.grade.startsWith('A') ? '#34C75920' : tlsInfo.grade.startsWith('B') ? '#FF950020' : '#FF3B3020'}
                      clipShape={{ type: 'rect', cornerRadius: 6 }}
                    >
                      <Text font="title3" foregroundStyle={tlsInfo.grade.startsWith('A') ? '#34C759' : tlsInfo.grade.startsWith('B') ? '#FF9500' : '#FF3B30'}>{tlsInfo.grade}</Text>
                    </HStack>
                  </HStack>
                ) : null}

                {/* Server Info */}
                {(tlsInfo.ip || tlsInfo.port) ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">SERVER</Text>
                    <Spacer />
                    <Text font="subheadline">{tlsInfo.ip || ''}{tlsInfo.port ? `:${tlsInfo.port}` : ''}</Text>
                  </HStack>
                ) : null}

                {/* Certificate */}
                {tlsInfo.certSubject ? (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">CERTIFICATE SUBJECT</Text>
                    <Text font="subheadline">{tlsInfo.certSubject}</Text>
                  </VStack>
                ) : null}
                {tlsInfo.certIssuer ? (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">CERTIFICATE ISSUER</Text>
                    <Text font="subheadline">{tlsInfo.certIssuer}</Text>
                  </VStack>
                ) : null}
                {tlsInfo.certKey ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">PUBLIC KEY</Text>
                    <Spacer />
                    <Text font="subheadline">{tlsInfo.certKey}</Text>
                  </HStack>
                ) : null}
                {tlsInfo.certSigAlg ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">SIGNATURE</Text>
                    <Spacer />
                    <Text font="subheadline">{tlsInfo.certSigAlg}</Text>
                  </HStack>
                ) : null}

                {/* Security Features */}
                <VStack spacing={4}>
                  <Text font="caption" foregroundStyle="secondaryLabel">SECURITY FEATURES</Text>
                  <HStack spacing={8}>
                    <HStack spacing={4} padding={{ horizontal: 8, vertical: 4 }} background={tlsInfo.forwardSecrecy ? '#34C75915' : '#FF3B3015'} clipShape={{ type: 'rect', cornerRadius: 4 }}>
                      <Text font="caption2" foregroundStyle={tlsInfo.forwardSecrecy ? '#34C759' : '#FF3B30'}>{tlsInfo.forwardSecrecy ? '✓' : '✕'} FS</Text>
                    </HStack>
                    <HStack spacing={4} padding={{ horizontal: 8, vertical: 4 }} background={tlsInfo.ocspStapling ? '#34C75915' : '#FF3B3015'} clipShape={{ type: 'rect', cornerRadius: 4 }}>
                      <Text font="caption2" foregroundStyle={tlsInfo.ocspStapling ? '#34C759' : '#FF3B30'}>{tlsInfo.ocspStapling ? '✓' : '✕'} OCSP</Text>
                    </HStack>
                    <HStack spacing={4} padding={{ horizontal: 8, vertical: 4 }} background={tlsInfo.sessionResumption ? '#34C75915' : '#FF3B3015'} clipShape={{ type: 'rect', cornerRadius: 4 }}>
                      <Text font="caption2" foregroundStyle={tlsInfo.sessionResumption ? '#34C759' : '#FF3B30'}>{tlsInfo.sessionResumption ? '✓' : '✕'} Resume</Text>
                    </HStack>
                  </HStack>
                </VStack>

                {tlsInfo.hsts ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">HSTS</Text>
                    <Spacer />
                    <Text font="subheadline" foregroundStyle={tlsInfo.hsts === 'PRESENT' ? '#34C759' : '#FF9500'}>{tlsInfo.hsts}</Text>
                  </HStack>
                ) : null}

                {tlsInfo.renegotiationSupport ? (
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">RENEGOTIATION</Text>
                    <Spacer />
                    <Text font="subheadline" foregroundStyle={tlsInfo.renegotiationSupport === 'Secure' ? '#34C759' : '#FF3B30'}>{tlsInfo.renegotiationSupport}</Text>
                  </HStack>
                ) : null}

                {/* Protocols */}
                {tlsInfo.protocols.length > 0 && (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">PROTOCOLS</Text>
                    <HStack spacing={6}>
                      {tlsInfo.protocols.map((p: string, i: number) => (
                        <HStack key={i} padding={{ horizontal: 8, vertical: 4 }} background="#007AFF15" clipShape={{ type: 'rect', cornerRadius: 4 }}>
                          <Text font="caption" foregroundStyle="#007AFF">{p}</Text>
                        </HStack>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {/* Named Groups */}
                {tlsInfo.namedGroups && tlsInfo.namedGroups.length > 0 && (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">NAMED GROUPS</Text>
                    <HStack spacing={6}>
                      {tlsInfo.namedGroups.map((g: string, i: number) => (
                        <HStack key={i} padding={{ horizontal: 8, vertical: 4 }} background="#FF950015" clipShape={{ type: 'rect', cornerRadius: 4 }}>
                          <Text font="caption2" foregroundStyle="#FF9500">{g}</Text>
                        </HStack>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {/* Cipher Suites */}
                {tlsInfo.cipherSuites.length > 0 && (
                  <VStack spacing={2}>
                    <Text font="caption" foregroundStyle="secondaryLabel">CIPHER SUITES ({tlsInfo.cipherSuites.length})</Text>
                    {tlsInfo.cipherSuites.slice(0, 10).map((c: { name: string; strength: string }, i: number) => (
                      <HStack key={i} padding={{ leading: 8 }}>
                        <Text font="caption" foregroundStyle="label">{c.name}</Text>
                        <Spacer />
                        <Text font="caption" foregroundStyle={c.strength === '256-bit' ? '#34C759' : c.strength === '128-bit' ? '#FF9500' : 'secondaryLabel'}>{c.strength}</Text>
                      </HStack>
                    ))}
                    {tlsInfo.cipherSuites.length > 10 && (
                      <Text font="caption" foregroundStyle="tertiaryLabel">+{tlsInfo.cipherSuites.length - 10} more</Text>
                    )}
                  </VStack>
                )}
              </>
            )}
          </VStack>
        ) : null}

        <Spacer />
      </VStack>
    </ScrollView>
  )
}
