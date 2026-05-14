// BGP - ASN/IP Lookup, BGP Interconnection & PeeringDB
// @ts-ignore — onResume works at runtime
import { useState, useEffect, VStack, HStack, Text, ScrollView, Button, TextField, Divider, Spacer, ProgressView, Picker, Image, Navigation, Script, DisclosureGroup, List, Color, CapsuleShape, RoundedRectangle, Grid, LazyVStack, Section, Toggle, onResume } from 'scripting'
import {
  asnLookup, ipLookup, asnNeighbours, announcedPrefixes, whoisRecords, prefixLookup,
  type ASNInfo, type IPLookupResult, type ASNNeighboursData, type ASNNeighbour,
  type AnnouncedPrefix, type WhoisField, type PrefixEntry,
  peeringDBSearchNet, peeringDBSearchIX, peeringDBSearchFac,
  peeringDBSearchCarrier, peeringDBSearchOrg, peeringDBSearchAll,
  peeringDBGetNetIXLan,
  type PeeringDBNet, type PeeringDBIX, type PeeringDBFac, type PeeringDBCarrier, type PeeringDBOrg
} from '../utils/bgp'

// ─── Helpers ───
const NEIGHBOUR_TYPE_COLORS: Record<string, string> = {
  left: '#007AFF',
  right: '#FF9500',
  uncertain: '#8E8E93',
}
const NEIGHBOUR_TYPE_LABELS: Record<string, string> = {
  left: 'Customer',
  right: 'Provider',
  uncertain: 'Uncertain',
}

function powerBarWidth(power: number): number {
  return Math.max(4, Math.min(100, power * 10))
}

function powerColor(power: number): string {
  if (power >= 8) return '#FF3B30'
  if (power >= 5) return '#FF9500'
  if (power >= 3) return '#FFCC00'
  return '#34C759'
}

type PdbSearchResult =
  | { type: 'net'; data: PeeringDBNet }
  | { type: 'ix'; data: PeeringDBIX }
  | { type: 'fac'; data: PeeringDBFac }
  | { type: 'carrier'; data: PeeringDBCarrier }
  | { type: 'org'; data: PeeringDBOrg }

export default function BGPView() {
  const dismiss = Navigation.useDismiss()

  // Reset loading states on resume
  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) {
        setLookupLoading(false)
        setPdbLoading(false)
        setNeighboursLoading(false)
        setWhoisLoading(false)
      }
    })
    return dispose
  }, [])

  // ─── State ───
  // Tab selection
  const [activeTab, setActiveTab] = useState<'lookup' | 'peeringdb'>('lookup')

  // ASN/IP lookup
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [asnInfo, setAsnInfo] = useState<ASNInfo | null>(null)
  const [ipResult, setIpResult] = useState<IPLookupResult | null>(null)
  const [neighboursData, setNeighboursData] = useState<ASNNeighboursData | null>(null)
  const [whoisFields, setWhoisFields] = useState<WhoisField[]>([])
  const [announcedPrefixesList, setAnnouncedPrefixesList] = useState<AnnouncedPrefix[]>([])
  const [prefixEntries, setPrefixEntries] = useState<PrefixEntry[]>([])
  const [lookupError, setLookupError] = useState('')
  const [neighboursLoading, setNeighboursLoading] = useState(false)
  const [whoisLoading, setWhoisLoading] = useState(false)

  // PeeringDB
  const [pdbQuery, setPdbQuery] = useState('')
  const [pdbType, setPdbType] = useState(0)
  const [pdbLoading, setPdbLoading] = useState(false)
  const [pdbResults, setPdbResults] = useState<PdbSearchResult[]>([])
  const [pdbError, setPdbError] = useState('')
  const [expandedNetId, setExpandedNetId] = useState<number | null>(null)
  const [netIXLans, setNetIXLans] = useState<any[]>([])

  // ─── Lookup Logic ───
  async function runLookup() {
    const q = lookupQuery.trim()
    if (!q) return
    setLookupLoading(true)
    setLookupError('')
    setAsnInfo(null)
    setIpResult(null)
    setNeighboursData(null)
    setWhoisFields([])
    setAnnouncedPrefixesList([])
    setPrefixEntries([])

    try {
      const isASN = /^AS?\d+$/i.test(q)

      if (isASN) {
        // ASN lookup
        const [info, neighbours, prefixes, whois] = await Promise.all([
          asnLookup(q),
          asnNeighbours(q),
          announcedPrefixes(q),
          whoisRecords(q),
        ])
        setAsnInfo(info)
        setNeighboursData(neighbours)
        setAnnouncedPrefixesList(prefixes)
        setWhoisFields(whois)
        // Also load prefix entries from bgp.tools
        const pe = await prefixLookup(q)
        setPrefixEntries(pe)
      } else {
        // IP lookup → get ASN, then load ASN data
        const ipRes = await ipLookup(q)
        setIpResult(ipRes)
        if (ipRes.asns.length > 0) {
          const primaryASN = ipRes.asns[0]
          const [info, neighbours, prefixes, whois] = await Promise.all([
            asnLookup(primaryASN),
            asnNeighbours(primaryASN),
            announcedPrefixes(primaryASN),
            whoisRecords(primaryASN),
          ])
          setAsnInfo(info)
          setNeighboursData(neighbours)
          setAnnouncedPrefixesList(prefixes)
          setWhoisFields(whois)
          const pe = await prefixLookup(primaryASN)
          setPrefixEntries(pe)
        }
      }
    } catch (e: any) {
      setLookupError(e?.message || 'Lookup failed')
    }
    setLookupLoading(false)
  }

  // ─── PeeringDB Logic ───
  async function runPeeringDB() {
    if (!pdbQuery.trim()) return
    setPdbLoading(true)
    setPdbResults([])
    setPdbError('')
    try {
      let results: PdbSearchResult[] = []
      const q = pdbQuery.trim()
      if (pdbType === 0) {
        const all = await peeringDBSearchAll(q)
        results = [
          ...all.networks.map((n: PeeringDBNet) => ({ type: 'net' as const, data: n })),
          ...all.ixps.map((ix: PeeringDBIX) => ({ type: 'ix' as const, data: ix })),
          ...all.facilities.map((f: PeeringDBFac) => ({ type: 'fac' as const, data: f })),
          ...all.carriers.map((c: PeeringDBCarrier) => ({ type: 'carrier' as const, data: c })),
          ...all.organizations.map((o: PeeringDBOrg) => ({ type: 'org' as const, data: o })),
        ]
      } else if (pdbType === 1) {
        const nets = await peeringDBSearchNet(q)
        results = nets.map((n: PeeringDBNet) => ({ type: 'net' as const, data: n }))
      } else if (pdbType === 2) {
        const ixs = await peeringDBSearchIX(q)
        results = ixs.map((ix: PeeringDBIX) => ({ type: 'ix' as const, data: ix }))
      } else if (pdbType === 3) {
        const facs = await peeringDBSearchFac(q)
        results = facs.map((f: PeeringDBFac) => ({ type: 'fac' as const, data: f }))
      } else if (pdbType === 4) {
        const carriers = await peeringDBSearchCarrier(q)
        results = carriers.map((c: PeeringDBCarrier) => ({ type: 'carrier' as const, data: c }))
      } else if (pdbType === 5) {
        const orgs = await peeringDBSearchOrg(q)
        results = orgs.map((o: PeeringDBOrg) => ({ type: 'org' as const, data: o }))
      }
      setPdbResults(results)
    } catch (e: any) {
      setPdbError(e?.message || 'PeeringDB search failed')
      HapticFeedback.notificationError()
    }
    setPdbLoading(false)
  }

  async function expandNetIX(netId: number) {
    if (expandedNetId === netId) {
      setExpandedNetId(null)
      return
    }
    setExpandedNetId(netId)
    try {
      const lans = await peeringDBGetNetIXLan(netId)
      setNetIXLans(lans)
    } catch { setNetIXLans([]) }
  }

  // ─── Render ───
  const isASNQuery = /^AS?\d+$/i.test(lookupQuery.trim())
  const maxPower = neighboursData && neighboursData.neighbours.length > 0
    ? Math.max(...neighboursData.neighbours.map((n: ASNNeighbour) => n.power))
    : 1

  return (
    <ScrollView
      navigationTitle="BGP & Peering"
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>

        {/* ─── Tab Picker ─── */}
        <VStack padding={{ horizontal: 16 }}>
          <HStack spacing={0}>
            <Button title="ASN / IP" systemImage={activeTab === 'lookup' ? 'network' : 'network'} action={() => setActiveTab('lookup')} />
            <Button title="PeeringDB" systemImage={activeTab === 'peeringdb' ? 'server.rack' : 'server.rack'} action={() => setActiveTab('peeringdb')} />
          </HStack>
        </VStack>

        {/* ═══ ASN / IP LOOKUP TAB ═══ */}
        {activeTab === 'lookup' ? (
          <>
            {/* Search Input */}
            <VStack
              spacing={12}
              padding={{ horizontal: 16, vertical: 14 }}
              background="secondarySystemGroupedBackground"
              clipShape={{ type: 'rect', cornerRadius: 18 }}
            >
              <HStack>
                <Image systemName="network" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
                <Text font="headline"> ASN / IP Lookup</Text>
                <Spacer />
              </HStack>

              <TextField
                title="Query"
                value={lookupQuery}
                onChanged={setLookupQuery}
                prompt="ASN, IP, or prefix (e.g. AS13335)"
              />
              <Text font="caption2" foregroundStyle="tertiaryLabel">
                {'bgp.tools data + RIPEstat • ASN names from bgp.tools bulk files'}
              </Text>

              <Button
                title={lookupLoading ? 'Querying…' : 'Lookup'}
                systemImage={lookupLoading ? 'hourglass' : 'magnifyingglass'}
                action={runLookup}
                disabled={lookupLoading}
              />
            </VStack>

            {lookupLoading ? (
              <VStack alignment="center" padding><ProgressView /><Text font="caption" foregroundStyle="secondaryLabel">Loading bgp.tools data + RIPEstat…</Text></VStack>
            ) : null}

            {lookupError ? (
              <VStack alignment="center" padding>
                <Text font="subheadline" foregroundStyle="#FF3B30">{lookupError}</Text>
              </VStack>
            ) : null}

            {/* ─── IP Result Card ─── */}
            {ipResult && !lookupLoading ? (
              <VStack
                spacing={8}
                padding={{ horizontal: 16, vertical: 14 }}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <HStack>
                  <Image systemName="desktopcomputer" foregroundStyle="#FF9500" frame={{ width: 18, height: 18 }} />
                  <Text font="headline"> IP Result</Text>
                  <Spacer />
                  <Button title="Copy" systemImage="doc.on.doc" action={() => {
                    Pasteboard.setString(`${ipResult.ip} → AS${ipResult.asns.join(', AS')}`)
                    HapticFeedback.notificationSuccess()
                  }} />
                </HStack>
                <HStack>
                  <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 60 }}>IP</Text>
                  <Text font="subheadline" foregroundStyle="#007AFF">{ipResult.ip}</Text>
                </HStack>
                <HStack>
                  <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 60 }}>Prefix</Text>
                  <Text font="subheadline">{ipResult.prefix || 'N/A'}</Text>
                </HStack>
                <HStack>
                  <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 60 }}>ASNs</Text>
                  <HStack spacing={6}>
                    {ipResult.asns.map((a: string) => (
                      <Text key={a} font="caption" foregroundStyle="white" background="#5856D6" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>AS{a} {ipResult.names[a] || ''}</Text>
                    ))}
                  </HStack>
                </HStack>
              </VStack>
            ) : null}

            {/* ─── ASN Info Card ─── */}
            {asnInfo && !lookupLoading ? (
              <VStack
                spacing={10}
                padding={{ horizontal: 16, vertical: 14 }}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <HStack alignment="center">
                  <VStack spacing={3}>
                    <HStack spacing={8} alignment="center">
                      <Text font="title2">{asnInfo.name || `AS${asnInfo.asn}`}</Text>
                      <Text font="caption" foregroundStyle="white" background="#007AFF" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>AS{asnInfo.asn}</Text>
                    </HStack>
                    {asnInfo.country ? (
                      <Text font="caption" foregroundStyle="secondaryLabel">{asnInfo.country}{asnInfo.cls ? ` · ${asnInfo.cls}` : ''}</Text>
                    ) : asnInfo.cls ? (
                      <Text font="caption" foregroundStyle="secondaryLabel">{asnInfo.cls}</Text>
                    ) : null}
                  </VStack>
                  <Spacer />
                  <VStack alignment="trailing" spacing={2}>
                    {asnInfo.announced ? (
                      <Text font="caption2" foregroundStyle="white" background="#34C759" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>Announced</Text>
                    ) : (
                      <Text font="caption2" foregroundStyle="white" background="#8E8E93" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>Not Announced</Text>
                    )}
                  </VStack>
                </HStack>

                {asnInfo.holder && asnInfo.holder !== asnInfo.name ? (
                  <HStack>
                    <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 70 }}>Holder</Text>
                    <Text font="subheadline">{asnInfo.holder}</Text>
                  </HStack>
                ) : null}

                <HStack>
                  <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 70 }}>Prefixes</Text>
                  <Text font="subheadline">{asnInfo.prefixCount} prefix(es)</Text>
                </HStack>

                <Button title="Copy ASN Info" systemImage="doc.on.doc" action={() => {
                  Pasteboard.setString(`AS${asnInfo.asn} ${asnInfo.name}\nHolder: ${asnInfo.holder}\nCountry: ${asnInfo.country}\nClass: ${asnInfo.cls}\nPrefixes: ${asnInfo.prefixCount}`)
                  HapticFeedback.notificationSuccess()
                }} />
              </VStack>
            ) : null}

            {/* ─── BGP Interconnection (ASN Neighbours) ─── */}
            {neighboursData && !lookupLoading ? (
              <VStack
                spacing={0}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <VStack spacing={10} padding={{ horizontal: 16, vertical: 14 }}>
                  <HStack>
                    <Image systemName="point.3.connected.trianglepath.dotted" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
                    <Text font="headline"> BGP Neighbours</Text>
                    <Spacer />
                    <Text font="caption" foregroundStyle="secondaryLabel">{neighboursData.neighbours.length} peers</Text>
                  </HStack>

                  {/* Summary badges */}
                  <HStack spacing={10}>
                    <VStack alignment="center" spacing={2}>
                      <Text font="title2" foregroundStyle="#007AFF">{neighboursData.counts.left}</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">Customers</Text>
                    </VStack>
                    <VStack alignment="center" spacing={2}>
                      <Text font="title2" foregroundStyle="#FF9500">{neighboursData.counts.right}</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">Providers</Text>
                    </VStack>
                    <VStack alignment="center" spacing={2}>
                      <Text font="title2" foregroundStyle="#8E8E93">{neighboursData.counts.uncertain}</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">Uncertain</Text>
                    </VStack>
                    <VStack alignment="center" spacing={2}>
                      <Text font="title2" foregroundStyle="#5856D6">{neighboursData.counts.unique}</Text>
                      <Text font="caption2" foregroundStyle="secondaryLabel">Unique</Text>
                    </VStack>
                  </HStack>
                </VStack>

                <Divider />

                {/* Neighbour list */}
                {neighboursData.neighbours
                  .sort((a: ASNNeighbour, b: ASNNeighbour) => b.power - a.power)
                  .slice(0, 50)
                  .map((n: ASNNeighbour, idx: number) => (
                    <VStack key={n.asn} spacing={0}>
                      {idx > 0 ? <Divider /> : null}
                      <VStack spacing={6} padding={{ horizontal: 16, vertical: 12 }}>
                        <HStack alignment="center">
                          <VStack spacing={2}>
                            <HStack spacing={6} alignment="center">
                              <Text font="subheadline" fontWeight="semibold">{n.name || `AS${n.asn}`}</Text>
                              <Text font="caption2" foregroundStyle="white" background="#5856D6" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 1 }}>AS{n.asn}</Text>
                            </HStack>
                            <HStack spacing={4}>
                              <Text font="caption2" foregroundStyle="white" background={(NEIGHBOUR_TYPE_COLORS[n.type] || '#8E8E93') as any} clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 1 }}>{NEIGHBOUR_TYPE_LABELS[n.type] || n.type}</Text>
                            </HStack>
                          </VStack>
                          <Spacer />
                          <VStack alignment="trailing" spacing={2}>
                            <HStack spacing={4} alignment="center">
                              <Text font="caption2" foregroundStyle="secondaryLabel">Power</Text>
                              <Text font="caption" fontWeight="semibold" foregroundStyle={powerColor(n.power) as any}>{n.power.toFixed(1)}</Text>
                            </HStack>
                            {/* Power bar */}
                            <VStack frame={{ width: 60, height: 6 }} clipShape={{ type: 'rect', cornerRadius: 3 }} background="tertiarySystemFill">
                              <VStack frame={{ width: powerBarWidth(n.power * 100 / (maxPower || 1)), height: 6 }} clipShape={{ type: 'rect', cornerRadius: 3 }} background={powerColor(n.power) as any} />
                            </VStack>
                          </VStack>
                        </HStack>

                        <HStack spacing={16}>
                          <HStack spacing={4}>
                            <Image systemName="arrow.up.arrow.down" foregroundStyle="#007AFF" frame={{ width: 12, height: 12 }} />
                            <Text font="caption" foregroundStyle="secondaryLabel">v4: {n.v4_peers}</Text>
                          </HStack>
                          <HStack spacing={4}>
                            <Image systemName="arrow.up.arrow.down" foregroundStyle="#34C759" frame={{ width: 12, height: 12 }} />
                            <Text font="caption" foregroundStyle="secondaryLabel">v6: {n.v6_peers}</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </VStack>
                  ))}

                {neighboursData.neighbours.length > 50 ? (
                  <VStack alignment="center" padding>
                    <Text font="caption" foregroundStyle="secondaryLabel">+{neighboursData.neighbours.length - 50} more neighbours</Text>
                  </VStack>
                ) : null}
              </VStack>
            ) : null}

            {/* ─── Announced Prefixes ─── */}
            {announcedPrefixesList.length > 0 && !lookupLoading ? (
              <VStack
                spacing={0}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <DisclosureGroup title={`Announced Prefixes (${announcedPrefixesList.length})`} isExpanded={announcedPrefixesList.length <= 20}>
                  <VStack spacing={4} padding={{ vertical: 8 }}>
                    {announcedPrefixesList.slice(0, 50).map((p: AnnouncedPrefix, i: number) => (
                      <HStack key={i}>
                        <Text font="caption" foregroundStyle="#007AFF">{p.prefix}</Text>
                        <Spacer />
                        <Button title="" systemImage="doc.on.doc" frame={{ width: 24, height: 24 }} action={() => {
                          Pasteboard.setString(p.prefix)
                          HapticFeedback.selection()
                        }} />
                      </HStack>
                    ))}
                    {announcedPrefixesList.length > 50 ? <Text font="caption" foregroundStyle="secondaryLabel">+{announcedPrefixesList.length - 50} more</Text> : null}
                  </VStack>
                </DisclosureGroup>
              </VStack>
            ) : null}

            {/* ─── Whois Records ─── */}
            {whoisFields.length > 0 && !lookupLoading ? (
              <VStack
                spacing={0}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <DisclosureGroup title="Whois Records (RIPEstat)" isExpanded={false}>
                  <VStack spacing={4} padding={{ vertical: 8 }}>
                    {whoisFields.map((f: WhoisField, i: number) => (
                      <HStack key={i}>
                        <Text font="caption" foregroundStyle="#007AFF" frame={{ minWidth: 100 }}>{f.key}</Text>
                        <Spacer />
                        <Text font="caption" foregroundStyle="label" lineLimit={2}>{f.value}</Text>
                        <Button title="" systemImage="doc.on.doc" frame={{ width: 24, height: 24 }} action={() => {
                          Pasteboard.setString(f.value)
                          HapticFeedback.selection()
                        }} />
                      </HStack>
                    ))}
                  </VStack>
                </DisclosureGroup>
              </VStack>
            ) : null}

            {/* ─── Prefix Table ─── */}
            {prefixEntries.length > 0 && !lookupLoading ? (
              <VStack
                spacing={0}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <DisclosureGroup title={`bgp.tools Prefix Table (${prefixEntries.length})`} isExpanded={false}>
                  <VStack spacing={4} padding={{ vertical: 8 }}>
                    {prefixEntries.slice(0, 50).map((pe: PrefixEntry, i: number) => (
                      <VStack key={i} spacing={2} padding={{ horizontal: 8, vertical: 6 }} background="tertiarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 8 }}>
                        <HStack>
                          <Text font="caption" foregroundStyle="#007AFF">{pe.cidr}</Text>
                          <Spacer />
                          <Text font="caption" foregroundStyle="secondaryLabel">{pe.hits} hits</Text>
                        </HStack>
                      </VStack>
                    ))}
                    {prefixEntries.length > 50 ? <Text font="caption" foregroundStyle="secondaryLabel">+{prefixEntries.length - 50} more</Text> : null}
                  </VStack>
                </DisclosureGroup>
              </VStack>
            ) : null}

          </>
        ) : null}

        {/* ═══ PEERINGDB TAB ═══ */}
        {activeTab === 'peeringdb' ? (
          <>
            <VStack
              spacing={12}
              padding={{ horizontal: 16, vertical: 14 }}
              background="secondarySystemGroupedBackground"
              clipShape={{ type: 'rect', cornerRadius: 18 }}
            >
              <HStack>
                <Image systemName="server.rack" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
                <Text font="headline"> PeeringDB</Text>
                <Spacer />
              </HStack>

              <TextField
                title="Search"
                value={pdbQuery}
                onChanged={setPdbQuery}
                prompt="ASN or name"
              />
              <Picker title="Category" value={pdbType} onChanged={setPdbType}>
                <Text tag={0}>🔍 All Categories</Text>
                <Text tag={1}>🌐 Network (ASN)</Text>
                <Text tag={2}>🔀 Internet Exchange</Text>
                <Text tag={3}>🏢 Facility (DC)</Text>
                <Text tag={4}>🚚 Carrier</Text>
                <Text tag={5}>🏛 Organization</Text>
              </Picker>

              <Button
                title={pdbLoading ? 'Searching…' : 'Search PeeringDB'}
                systemImage={pdbLoading ? 'hourglass' : 'magnifyingglass'}
                action={runPeeringDB}
                disabled={pdbLoading}
              />
              <Text font="caption2" foregroundStyle="tertiaryLabel">Rate limit: ~60 req/min (unauth). Results cached 5 min.</Text>
            </VStack>

            {pdbLoading ? (
              <VStack alignment="center" padding><ProgressView /></VStack>
            ) : null}

            {pdbError && !pdbLoading ? (
              <VStack alignment="center" padding>
                <Text font="subheadline" foregroundStyle="#FF3B30">{pdbError}</Text>
              </VStack>
            ) : null}

            {pdbResults.length > 0 && !pdbLoading ? (
              <VStack spacing={10}>
                <Text font="headline" padding={{ leading: 16 }}>{pdbResults.length} result(s) found</Text>

                {pdbResults.map((r: PdbSearchResult, i: number) => (
                  <VStack
                    key={i}
                    spacing={0}
                    background="secondarySystemGroupedBackground"
                    clipShape={{ type: 'rect', cornerRadius: 18 }}
                  >
                    {/* Network Card */}
                    {r.type === 'net' && (() => {
                      const net = r.data as PeeringDBNet
                      return (
                        <>
                          <VStack spacing={6} padding={{ horizontal: 16, vertical: 16 }}>
                            <HStack alignment="center">
                              <VStack spacing={2}>
                                <HStack spacing={8} alignment="center">
                                  <Text font="title3">{net.name}</Text>
                                  <Text font="caption" foregroundStyle="white" background="#007AFF" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>AS{net.asn}</Text>
                                </HStack>
                                {net.website ? <Text font="caption" foregroundStyle="#007AFF">{net.website}</Text> : null}
                              </VStack>
                              <Spacer />
                              <Button title="Copy" systemImage="doc.on.doc" action={() => {
                                Pasteboard.setString(`AS${net.asn} ${net.name}\n${net.website || ''}`)
                                HapticFeedback.notificationSuccess()
                              }} />
                            </HStack>
                            <HStack spacing={8}>
                              {net.info_ipv6 ? <Text font="caption2" foregroundStyle="white" background="#34C759" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>IPv6</Text> : null}
                              {net.info_unicast ? <Text font="caption2" foregroundStyle="white" background="#007AFF" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>Unicast</Text> : null}
                              {net.info_multicast ? <Text font="caption2" foregroundStyle="white" background="#FF9500" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>Multicast</Text> : null}
                            </HStack>
                          </VStack>
                          <Divider />
                          <DisclosureGroup title="Network Details" isExpanded={true}>
                            <VStack spacing={6} padding={{ vertical: 8 }}>
                              {net.info_type ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Type</Text><Spacer /><Text font="subheadline">{net.info_type}</Text></HStack> : null}
                              {net.info_traffic ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Traffic</Text><Spacer /><Text font="subheadline">{net.info_traffic}</Text></HStack> : null}
                              {net.info_ratio ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Ratio</Text><Spacer /><Text font="subheadline">{net.info_ratio}</Text></HStack> : null}
                              {net.info_scope ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Scope</Text><Spacer /><Text font="subheadline">{net.info_scope}</Text></HStack> : null}
                              {net.irr_as_set ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>IRR Set</Text><Spacer /><Text font="subheadline">{net.irr_as_set}</Text></HStack> : null}
                              {net.looking_glass ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>LG</Text><Spacer /><Text font="subheadline" foregroundStyle="#007AFF">{net.looking_glass}</Text></HStack> : null}
                            </VStack>
                          </DisclosureGroup>
                          <Divider />
                          <DisclosureGroup title="IX Participations">
                            <Button
                              title={expandedNetId === net.id ? 'Refresh IX List' : 'Load IX Participations'}
                              systemImage={expandedNetId === net.id ? 'arrow.clockwise' : 'network'}
                              action={() => expandNetIX(net.id)}
                            />
                            {expandedNetId === net.id && netIXLans.length > 0 ? (
                              <VStack spacing={4} padding={{ vertical: 8 }}>
                                <Text font="caption" foregroundStyle="secondaryLabel">{netIXLans.length} IX link(s)</Text>
                                {netIXLans.slice(0, 20).map((lan: any, j: number) => (
                                  <VStack key={j} spacing={2} padding={{ horizontal: 8, vertical: 6 }} background="tertiarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 8 }}>
                                    <Text font="subheadline">{lan.name || `IX #${lan.ixlan_id || lan.id}`}</Text>
                                    <HStack>
                                      {lan.ipaddr4 ? <Text font="caption" foregroundStyle="secondaryLabel">IPv4: {lan.ipaddr4}</Text> : null}
                                      <Spacer />
                                      {lan.ipaddr6 ? <Text font="caption" foregroundStyle="secondaryLabel">IPv6: {lan.ipaddr6}</Text> : null}
                                    </HStack>
                                  </VStack>
                                ))}
                                {netIXLans.length > 20 ? <Text font="caption" foregroundStyle="secondaryLabel">+{netIXLans.length - 20} more…</Text> : null}
                              </VStack>
                            ) : null}
                            {expandedNetId === net.id && netIXLans.length === 0 ? <Text font="caption" foregroundStyle="secondaryLabel" padding={{ vertical: 8 }}>No IX participations found.</Text> : null}
                          </DisclosureGroup>
                        </>
                      )
                    })()}

                    {/* IX Card */}
                    {r.type === 'ix' ? (() => {
                      const ix = r.data as PeeringDBIX
                      return (
                        <>
                          <VStack spacing={6} padding={{ horizontal: 16, vertical: 16 }}>
                            <HStack>
                              <Text font="title3">{ix.name}</Text>
                              <Spacer />
                              <Button title="Copy" systemImage="doc.on.doc" action={() => {
                                Pasteboard.setString(`${ix.name}\n${[ix.city, ix.country].filter(Boolean).join(', ')}`)
                                HapticFeedback.notificationSuccess()
                              }} />
                            </HStack>
                            {ix.website ? <Text font="caption" foregroundStyle="#007AFF">{ix.website}</Text> : null}
                            <HStack spacing={8}>
                              {ix.proto_unicast ? <Text font="caption2" foregroundStyle="white" background="#34C759" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>Unicast</Text> : null}
                              {ix.proto_ipv6 ? <Text font="caption2" foregroundStyle="white" background="#007AFF" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>IPv6</Text> : null}
                              {ix.proto_multicast ? <Text font="caption2" foregroundStyle="white" background="#FF9500" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 6, vertical: 2 }}>Multicast</Text> : null}
                            </HStack>
                          </VStack>
                          <Divider />
                          <DisclosureGroup title="Details" isExpanded={true}>
                            <VStack spacing={6} padding={{ vertical: 8 }}>
                              {ix.city ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Location</Text><Spacer /><Text font="subheadline">{[ix.city, ix.country].filter(Boolean).join(', ')}</Text></HStack> : null}
                              {ix.media ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Media</Text><Spacer /><Text font="subheadline">{ix.media}</Text></HStack> : null}
                              {ix.tech_email ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Tech Email</Text><Spacer /><Text font="subheadline">{ix.tech_email}</Text></HStack> : null}
                            </VStack>
                          </DisclosureGroup>
                        </>
                      )
                    })() : null}

                    {/* Facility Card */}
                    {r.type === 'fac' ? (() => {
                      const fac = r.data as PeeringDBFac
                      return (
                        <>
                          <VStack spacing={6} padding={{ horizontal: 16, vertical: 16 }}>
                            <HStack>
                              <Text font="title3">{fac.name}</Text>
                              <Spacer />
                              <Button title="Copy" systemImage="doc.on.doc" action={() => {
                                Pasteboard.setString(`${fac.name}\n${[fac.address1, fac.city, fac.state, fac.country].filter(Boolean).join(', ')}`)
                                HapticFeedback.notificationSuccess()
                              }} />
                            </HStack>
                            {fac.website ? <Text font="caption" foregroundStyle="#007AFF">{fac.website}</Text> : null}
                          </VStack>
                          <Divider />
                          <DisclosureGroup title="Address & Details" isExpanded={true}>
                            <VStack spacing={6} padding={{ vertical: 8 }}>
                              {fac.address1 ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Address</Text><Spacer /><Text font="subheadline">{fac.address1}</Text></HStack> : null}
                              {fac.city ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>City</Text><Spacer /><Text font="subheadline">{[fac.city, fac.state, fac.country].filter(Boolean).join(', ')}</Text></HStack> : null}
                              {fac.zipcode ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>ZIP</Text><Spacer /><Text font="subheadline">{fac.zipcode}</Text></HStack> : null}
                              {fac.clli ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>CLLI</Text><Spacer /><Text font="subheadline">{fac.clli}</Text></HStack> : null}
                              {fac.latitude && fac.longitude ? <HStack><Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 80 }}>Coords</Text><Spacer /><Text font="subheadline">{fac.latitude}, {fac.longitude}</Text></HStack> : null}
                            </VStack>
                          </DisclosureGroup>
                        </>
                      )
                    })() : null}

                    {/* Carrier Card */}
                    {r.type === 'carrier' ? (() => {
                      const c = r.data as PeeringDBCarrier
                      return (
                        <VStack spacing={6} padding={{ horizontal: 16, vertical: 16 }}>
                          <HStack alignment="center">
                            <Text font="title3">{c.name}</Text>
                            <Spacer />
                            <Text font="caption" foregroundStyle="white" background="#5856D6" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>Carrier</Text>
                          </HStack>
                          {c.website ? <Text font="caption" foregroundStyle="#007AFF">{c.website}</Text> : null}
                          {c.notes ? <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={3}>{c.notes}</Text> : null}
                        </VStack>
                      )
                    })() : null}

                    {/* Org Card */}
                    {r.type === 'org' ? (() => {
                      const o = r.data as PeeringDBOrg
                      return (
                        <VStack spacing={6} padding={{ horizontal: 16, vertical: 16 }}>
                          <HStack alignment="center">
                            <Text font="title3">{o.name}</Text>
                            <Spacer />
                            <Text font="caption" foregroundStyle="white" background="#FF9500" clipShape={{ type: 'capsule', style: 'continuous' }} padding={{ horizontal: 8, vertical: 2 }}>Organization</Text>
                          </HStack>
                          {o.website ? <Text font="caption" foregroundStyle="#007AFF">{o.website}</Text> : null}
                          {o.city || o.country ? <Text font="caption" foregroundStyle="secondaryLabel">{[o.city, o.country].filter(Boolean).join(', ')}</Text> : null}
                          {o.notes ? <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={3}>{o.notes}</Text> : null}
                        </VStack>
                      )
                    })() : null}
                  </VStack>
                ))}
              </VStack>
            ) : null}

            {pdbResults.length === 0 && !pdbLoading && Boolean(pdbQuery) ? (
              <VStack alignment="center" padding>
                <Text font="subheadline" foregroundStyle="secondaryLabel">No results found.</Text>
              </VStack>
            ) : null}

          </>
        ) : null}

        <Spacer />
      </VStack>
    </ScrollView>
  )
}
