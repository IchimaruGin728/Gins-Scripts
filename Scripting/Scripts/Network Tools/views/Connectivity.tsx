// Connectivity - HTTP Latency & Port Probe
// All tools use HTTP fetch only (no ICMP ping / TCP connect scan)
// @ts-ignore — onResume works at runtime
import { useState, useEffect, VStack, HStack, Text, ScrollView, Button, TextField, Spacer, ProgressView, Image, Chart, LineChart, BarChart, Picker, Gauge, Navigation, Script, onResume, Divider } from 'scripting'
import {
  ping, portScanRange, traceroute, geolocateIP,
  COMMON_PORTS, TOP_PORTS,
  PingResult, PortScanResult, TracerouteHop, GeoLocation
} from '../utils/shell'
import { getGrafanaDashboards, getGrafanaSnapshot, CURATED_GRAFANA_DASHBOARDS, getNXTraceSources, getNXTraceTargets, getNXTraceMTR, NXTraceHop, GrafanaDashboardItem, GrafanaSnapshot, CuratedGrafanaDashboard } from '../utils/nxtrace'

export default function ConnectivityView() {
  const dismiss = Navigation.useDismiss()
  // Reset state on resume from minimized
  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) {
        setPingLoading(false)
        setScanLoading(false)
        setTracerouteLoading(false)
        setGeoLoading(false)
        setNxLoading(false)
        setPingError('')
        setScanError('')
        setTraceError('')
        setGeoError('')
        setNxError('')
        setGrafanaError('')
      }
    })
    return dispose
  }, [])

  // Ping state
  const [pingHost, setPingHost] = useState('1.1.1.1')
  const [pingCount, setPingCount] = useState(4)
  const [pingLoading, setPingLoading] = useState(false)
  const [pingResult, setPingResult] = useState<PingResult | null>(null)
  const [pingError, setPingError] = useState('')

  // Port scan state
  const [scanHost, setScanHost] = useState('')
  const [portSet, setPortSet] = useState(0) // 0=common, 1=extended, 2=custom
  const [customPorts, setCustomPorts] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanResults, setScanResults] = useState<PortScanResult[]>([])
  const [scanError, setScanError] = useState('')

  // Traceroute state
  const [traceHost, setTraceHost] = useState('google.com')
  const [traceLoading, setTracerouteLoading] = useState(false)
  const [traceResults, setTraceResults] = useState<TracerouteHop[]>([])
  const [traceError, setTraceError] = useState('')

  // IP Geolocation state
  const [geoIP, setGeoIP] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoResult, setGeoResult] = useState<GeoLocation | null>(null)
  const [geoError, setGeoError] = useState('')

  // NXTrace public Grafana sync state
  const [nxSource, setNxSource] = useState('PEK-CM_mtr')
  const [nxTarget, setNxTarget] = useState('AWS.FRA')
  const [nxSources, setNxSources] = useState<string[]>([])
  const [nxTargets, setNxTargets] = useState<string[]>([])
  const [nxHops, setNxHops] = useState<NXTraceHop[]>([])
  const [grafanaItems, setGrafanaItems] = useState<GrafanaDashboardItem[]>([])
  const [selectedGrafanaKey, setSelectedGrafanaKey] = useState('icmp_aio')
  const [grafanaSnapshot, setGrafanaSnapshot] = useState<GrafanaSnapshot | null>(null)
  const [grafanaLoading, setGrafanaLoading] = useState(false)
  const [grafanaError, setGrafanaError] = useState('')
  const [nxLoading, setNxLoading] = useState(false)
  const [nxError, setNxError] = useState('')

  async function loadNXTraceSources() {
    setNxLoading(true)
    setNxError('')
    try {
      const [sources, items] = await Promise.all([
        getNXTraceSources(),
        getGrafanaDashboards(),
      ])
      setNxSources(sources)
      setGrafanaItems(items)
      if (sources.length > 0 && !sources.includes(nxSource)) setNxSource(sources[0])
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setNxError(e.message || 'Failed to load NXTrace sources')
      HapticFeedback.notificationError()
    }
    setNxLoading(false)
  }

  async function loadGrafanaSnapshot(key: string) {
    setGrafanaLoading(true)
    setGrafanaError('')
    try {
      const def = CURATED_GRAFANA_DASHBOARDS.find((d: CuratedGrafanaDashboard) => d.key === key)
      if (!def) throw new Error('Dashboard config not found')
      const snap = await getGrafanaSnapshot(def)
      setGrafanaSnapshot(snap)
      setSelectedGrafanaKey(key)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setGrafanaSnapshot(null)
      setGrafanaError(e.message || 'Grafana snapshot failed')
      HapticFeedback.notificationError()
    }
    setGrafanaLoading(false)
  }

  async function loadNXTraceTargets() {
    setNxLoading(true)
    setNxError('')
    try {
      const targets = await getNXTraceTargets(nxSource.trim())
      setNxTargets(targets)
      if (targets.length > 0 && !targets.includes(nxTarget)) setNxTarget(targets[0])
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setNxError(e.message || 'Failed to load NXTrace targets')
      HapticFeedback.notificationError()
    }
    setNxLoading(false)
  }

  async function syncNXTraceMTR() {
    if (!nxSource.trim() || !nxTarget.trim()) return
    setNxLoading(true)
    setNxError('')
    setNxHops([])
    try {
      const hops = await getNXTraceMTR(nxSource.trim(), nxTarget.trim())
      setNxHops(hops)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setNxError(e.message || 'NXTrace sync failed')
      HapticFeedback.notificationError()
    }
    setNxLoading(false)
  }

  useEffect(() => {
    loadNXTraceSources()
    loadGrafanaSnapshot('icmp_aio')
  }, [])

  useEffect(() => {
    if (!nxSource.trim()) return
    loadNXTraceTargets()
  }, [nxSource])

  async function runPing() {
    if (!pingHost.trim()) return
    setPingLoading(true)
    setPingResult(null)
    setPingError('')
    try {
      const result = await ping(pingHost.trim(), pingCount)
      setPingResult(result)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setPingResult(null)
      setPingError(e.message || 'Ping failed')
      HapticFeedback.notificationError()
    }
    setPingLoading(false)
  }

  async function runPortScan() {
    if (!scanHost.trim()) return
    setScanLoading(true)
    setScanResults([])
    setScanError('')
    try {
      let ports: number[]
      if (portSet === 0) ports = TOP_PORTS
      else if (portSet === 1) ports = COMMON_PORTS
      else ports = customPorts.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n) && n > 0 && n < 65536)
      
      if (ports.length === 0) { setScanLoading(false); return }
      const results = await portScanRange(scanHost.trim(), ports)
      setScanResults(results)
      HapticFeedback.notificationSuccess()
    } catch (e: any) {
      setScanResults([])
      setScanError(e.message || 'Port scan failed')
      HapticFeedback.notificationError()
    }
    setScanLoading(false)
  }

  const openPorts = scanResults.filter(r => r.state === 'open').length
  const latencyColor = pingResult
    ? pingResult.avg_ms < 30 ? '#34C759' : pingResult.avg_ms < 100 ? '#FF9500' : '#FF3B30'
    : '#8E8E93'

  return (
    <ScrollView
      navigationTitle="Connectivity"
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>
        {/* ── Ping Section ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="waveform.path.ecg" foregroundStyle="#007AFF" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> HTTP Latency Test</Text>
            <Spacer />
            <Text font="caption2" foregroundStyle="tertiaryLabel">走系统代理</Text>
          </HStack>

          <TextField title="Host" value={pingHost} onChanged={setPingHost} prompt="e.g. 1.1.1.1 or google.com" />

          <Picker title="Count" value={pingCount} onChanged={setPingCount}>
            <Text tag={3}>3 requests</Text>
            <Text tag={4}>4 requests</Text>
            <Text tag={5}>5 requests</Text>
            <Text tag={10}>10 requests</Text>
          </Picker>

          <Button
            title={pingLoading ? 'Testing…' : 'Run HTTP Latency Test'}
            systemImage={pingLoading ? 'hourglass' : 'play.fill'}
            action={runPing}
            disabled={pingLoading}
          />
        </VStack>

        {/* Ping Results */}
        {pingLoading && (
          <VStack alignment="center" padding>
            <ProgressView />
            <Text font="caption" foregroundStyle="secondaryLabel">Measuring HTTP HEAD latency…</Text>
          </VStack>
        )}

        {pingError && !pingLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {pingError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {pingResult && !pingLoading && (
          <>
            {/* Stats */}
            <VStack
              spacing={10}
              padding={{ horizontal: 16, vertical: 14 }}
              background="secondarySystemGroupedBackground"
              clipShape={{ type: 'rect', cornerRadius: 18 }}
            >
              <HStack>
                <Text font="headline">Results — {pingResult.host}</Text>
                <Spacer />
                <Button
                  title="Copy"
                  systemImage="doc.on.doc"
                  action={() => {
                    const text = `HTTP Latency — ${pingResult.host} (${pingResult.ip})\nAvg: ${pingResult.avg_ms.toFixed(1)}ms | Min: ${pingResult.min_ms.toFixed(1)}ms | Max: ${pingResult.max_ms.toFixed(1)}ms | Fail: ${pingResult.packet_loss.toFixed(0)}%`
                    Pasteboard.setString(text)
                    HapticFeedback.selection()
                  }}
                />
              </HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">
                Resolved: {pingResult.ip}
              </Text>

              <HStack spacing={20}>
                <VStack alignment="center" spacing={2}>
                  <Text font="title" foregroundStyle={latencyColor}>{pingResult.avg_ms.toFixed(1)}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Avg ms</Text>
                </VStack>
                <VStack alignment="center" spacing={2}>
                  <Text font="title">{pingResult.min_ms.toFixed(1)}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Min ms</Text>
                </VStack>
                <VStack alignment="center" spacing={2}>
                  <Text font="title">{pingResult.max_ms.toFixed(1)}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Max ms</Text>
                </VStack>
                <VStack alignment="center" spacing={2}>
                  <Text
                    font="title"
                    foregroundStyle={pingResult.packet_loss > 0 ? '#FF3B30' : '#34C759'}
                  >
                    {pingResult.packet_loss.toFixed(0)}%
                  </Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Loss</Text>
                </VStack>
              </HStack>

              <Gauge
                value={Math.min(pingResult.avg_ms, 200) / 200}
                label={<Text font="caption">Latency</Text>}
                min={0}
                max={1}
                currentValueLabel={<Text font="caption" foregroundStyle={latencyColor}>{pingResult.avg_ms.toFixed(1)} ms</Text>}
                minValueLabel={<Text font="caption2">0</Text>}
                maxValueLabel={<Text font="caption2">200</Text>}
              />
            </VStack>

            {/* Latency Chart */}
            {pingResult.individual_ms.filter((m: number) => m >= 0).length > 1 && (
              <VStack
                spacing={8}
                padding={{ horizontal: 16, vertical: 14 }}
                background="secondarySystemGroupedBackground"
                clipShape={{ type: 'rect', cornerRadius: 18 }}
              >
                <Text font="headline">Latency</Text>
                <Chart>
                  <LineChart
                    marks={pingResult.individual_ms.filter((m: number) => m >= 0).map((ms: number, i: number) => ({
                      label: `#${i + 1}`,
                      value: ms,
                      foregroundStyle: ms < 30 ? '#34C759' : ms < 100 ? '#FF9500' : '#FF3B30',
                    }))}
                  />
                </Chart>
              </VStack>
            )}
          </>
        )}

        {/* ── Port Scan Section ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="rectangle.connected.to.line.below" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> HTTP Port Probe</Text>
            <Spacer />
          </HStack>

          <TextField title="Host" value={scanHost} onChanged={setScanHost} prompt="e.g. example.com" />

          <Picker title="Ports" value={portSet} onChanged={setPortSet}>
            <Text tag={0}>Common (Top 9)</Text>
            <Text tag={1}>Extended (17 ports)</Text>
            <Text tag={2}>Custom</Text>
          </Picker>

          {portSet === 2 && (
            <TextField title="Ports" value={customPorts} onChanged={setCustomPorts} prompt="e.g. 80,443,8080,3306" />
          )}

          <Button
            title={scanLoading ? 'Probing…' : 'Probe Ports (HTTP)'}
            systemImage={scanLoading ? 'hourglass' : 'play.fill'}
            action={runPortScan}
            disabled={scanLoading}
          />
        </VStack>

        {/* Scan Results */}
        {scanLoading && (
          <VStack alignment="center" padding>
            <ProgressView />
            <Text font="caption" foregroundStyle="secondaryLabel">Probing via HTTP HEAD…</Text>
          </VStack>
        )}

        {scanError && !scanLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {scanError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {scanResults.length > 0 && !scanLoading && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Probe Results</Text>
              <Spacer />
              <Text font="subheadline" foregroundStyle="secondaryLabel">
                {openPorts}/{scanResults.length} open
              </Text>
            </HStack>

            {scanResults.length > 1 && (
              <Chart>
                <BarChart
                  marks={[
                    { label: 'Open', value: openPorts, foregroundStyle: '#34C759' },
                    { label: 'Closed', value: scanResults.length - openPorts, foregroundStyle: '#8E8E93' },
                  ]}
                />
              </Chart>
            )}

            {scanResults.map((r: PortScanResult, i: number) => (
              <HStack key={i} padding={{ vertical: 4 }}>
                <Image
                  systemName={r.state === 'open' ? 'lock.open.fill' : 'lock.fill'}
                  foregroundStyle={r.state === 'open' ? '#34C759' : '#8E8E93'}
                  frame={{ width: 16, height: 16 }}
                />
                <Text font="body" padding={{ leading: 8 }}>
                  {r.port}
                </Text>
                <Spacer />
                <Text font="subheadline" foregroundStyle="secondaryLabel">{r.service || ''}</Text>
                <Text
                  font="caption"
                  foregroundStyle={r.state === 'open' ? '#34C759' : '#FF3B30'}
                  padding={{ leading: 8 }}
                >
                  {r.state.toUpperCase()}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}

        {/* ── Traceroute Section ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="point.3.connected.trianglepath.dotted" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> Traceroute</Text>
            <Spacer />
          </HStack>
          <TextField title="Host" value={traceHost} onChanged={setTraceHost} prompt="e.g. google.com" />
          <Button
            title={traceLoading ? 'Tracing…' : 'Trace Route'}
            systemImage={traceLoading ? 'hourglass' : 'point.3.connected.trianglepath.dotted'}
            action={async () => {
              if (!traceHost.trim()) return
              setTracerouteLoading(true)
              setTraceResults([])
              setTraceError('')
              try {
                const hops = await traceroute(traceHost.trim())
                setTraceResults(hops)
                if (hops.length === 0) {
                  HapticFeedback.notificationError()
                } else {
                  HapticFeedback.notificationSuccess()
                }
              } catch (e: any) {
                setTraceResults([])
                setTraceError(e.message || 'Traceroute failed')
                HapticFeedback.notificationError()
              }
              setTracerouteLoading(false)
            }}
            disabled={traceLoading}
          />
        </VStack>

        {traceLoading && (
          <VStack alignment="center" padding>
            <ProgressView />
            <Text font="caption" foregroundStyle="secondaryLabel">Tracing route…</Text>
          </VStack>
        )}

        {traceError && !traceLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {traceError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {traceResults.length > 0 && !traceLoading && (
          <VStack
            spacing={10}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Route — {traceResults.length} hops</Text>
              <Spacer />
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                action={() => {
                  const text = traceResults.map((h: TracerouteHop) => {
                    const geo = h.geo ? ` ${h.geo.city}, ${h.geo.country} (${h.geo.org})` : ''
                    return `${h.hop}  ${h.ip || '*'}  ${h.rtt_ms.map((m: number) => m.toFixed(1)).join(', ')} ms${geo}`
                  }).join('\n')
                  Pasteboard.setString(text)
                  HapticFeedback.selection()
                }}
              />
            </HStack>
            
            {/* Visual hop timeline */}
            {traceResults.map((hop: TracerouteHop, i: number) => {
              const firstRtt = hop.rtt_ms[0] || 0
              const color = hop.timeout ? '#8E8E93' : firstRtt < 30 ? '#34C759' : firstRtt < 100 ? '#FF9500' : '#FF3B30'
              return (
                <HStack key={i} spacing={10} padding={{ vertical: 5 }}>
                  <VStack spacing={0} frame={{ minWidth: 28 }}>
                    <Text font="caption2" foregroundStyle="secondaryLabel">{hop.hop}</Text>
                    <Image systemName={hop.timeout ? 'circle.dashed' : 'circle.fill'} foregroundStyle={color} frame={{ width: 10, height: 10 }} />
                    {i < traceResults.length - 1 ? <Text font="caption2" foregroundStyle="tertiaryLabel">│</Text> : null}
                  </VStack>
                  <VStack spacing={3}>
                    <HStack>
                      <Text font="subheadline" fontWeight="semibold" foregroundStyle={hop.timeout ? 'tertiaryLabel' : 'label'} lineLimit={1}>{hop.timeout ? '* * * timeout' : hop.ip}</Text>
                      <Spacer />
                      {hop.rtt_ms.length > 0 ? (
                        <Text font="caption" fontWeight="semibold" foregroundStyle={color}>{hop.rtt_ms.map((m: number) => m.toFixed(1)).join(' / ')} ms</Text>
                      ) : null}
                    </HStack>
                    {!hop.timeout && hop.geo ? (
                      <HStack spacing={4}>
                        <Image systemName="mappin.circle.fill" foregroundStyle="#FF2D55" frame={{ width: 11, height: 11 }} />
                        <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>{hop.geo.city}{hop.geo.country ? `, ${hop.geo.country}` : ''}</Text>
                        {hop.geo.asn ? <Text font="caption" foregroundStyle="#5856D6"> · {hop.geo.asn}</Text> : null}
                      </HStack>
                    ) : null}
                    {!hop.timeout && hop.geo?.org ? (
                      <Text font="caption2" foregroundStyle="tertiaryLabel" lineLimit={1}>{hop.geo.org}</Text>
                    ) : null}
                  </VStack>
                </HStack>
              )
            })}
          </VStack>
        )}

        {/* ── IP Geolocation Section ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="mappin.and.ellipse" foregroundStyle="#FF2D55" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> IP Geolocation</Text>
            <Spacer />
          </HStack>
          <TextField title="IP Address" value={geoIP} onChanged={setGeoIP} prompt="e.g. 8.8.8.8" />
          <Button
            title={geoLoading ? 'Looking up…' : 'Geolocate'}
            systemImage={geoLoading ? 'hourglass' : 'mappin.and.ellipse'}
            action={async () => {
              if (!geoIP.trim()) return
              setGeoLoading(true)
              setGeoResult(null)
              setGeoError('')
              try {
                const result = await geolocateIP(geoIP.trim())
                setGeoResult(result)
                if (result) HapticFeedback.notificationSuccess()
              } catch (e: any) {
                setGeoResult(null)
                setGeoError(e.message || 'Geolocation failed')
                HapticFeedback.notificationError()
              }
              setGeoLoading(false)
            }}
            disabled={geoLoading}
          />
        </VStack>

        {geoError && !geoLoading ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="subheadline" foregroundStyle="#FF3B30"> {geoError}</Text>
            </HStack>
          </VStack>
        ) : null}

        {geoResult && !geoLoading && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <Text font="headline">Location — {geoResult.ip}</Text>
            <Divider />
            <HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">City</Text>
              <Spacer />
              <Text font="subheadline">{geoResult.city}</Text>
            </HStack>
            <HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">Country</Text>
              <Spacer />
              <Text font="subheadline">{geoResult.country}</Text>
            </HStack>
            <HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">Coordinates</Text>
              <Spacer />
              <Text font="subheadline">{geoResult.lat.toFixed(4)}, {geoResult.lon.toFixed(4)}</Text>
            </HStack>
            <HStack>
              <Text font="subheadline" foregroundStyle="secondaryLabel">Org</Text>
              <Spacer />
              <Text font="subheadline">{geoResult.org}</Text>
            </HStack>
          </VStack>
        )}

        {/* ── NXTrace Public MTR Sync ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="chart.xyaxis.line" foregroundStyle="#5856D6" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> NXTrace MTR Sync</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="secondaryLabel">Grafana</Text>
          </HStack>
          <Text font="caption" foregroundStyle="secondaryLabel">
            Sync public NXTrace Prometheus data and render it natively in this app. Sources/targets auto-load on supported Scripting builds.
          </Text>
          <TextField title="Source" value={nxSource} onChanged={setNxSource} prompt="PEK-CM_mtr" />
          <TextField title="Target" value={nxTarget} onChanged={setNxTarget} prompt="AWS.FRA" />
          <HStack spacing={8}>
            <Button title={nxLoading ? 'Loading…' : 'Refresh Sources'} systemImage="list.bullet" action={loadNXTraceSources} disabled={nxLoading} />
            <Button title={nxLoading ? 'Loading…' : 'Refresh Targets'} systemImage="scope" action={loadNXTraceTargets} disabled={nxLoading} />
            <Button title={nxLoading ? 'Syncing…' : 'Sync MTR'} systemImage="arrow.triangle.2.circlepath" action={syncNXTraceMTR} disabled={nxLoading} />
          </HStack>
          {nxSources.length > 0 ? <Text font="caption2" foregroundStyle="secondaryLabel" lineLimit={2}>Sources: {nxSources.slice(0, 6).join(', ')}{nxSources.length > 6 ? '…' : ''}</Text> : null}
          {nxTargets.length > 0 ? <Text font="caption2" foregroundStyle="secondaryLabel" lineLimit={2}>Targets: {nxTargets.slice(0, 8).join(', ')}{nxTargets.length > 8 ? '…' : ''}</Text> : null}
          {CURATED_GRAFANA_DASHBOARDS.length > 0 ? (
            <VStack spacing={8}>
              <Divider />
              <HStack>
                <Text font="subheadline" fontWeight="semibold">Grafana Cards</Text>
                <Spacer />
                <Text font="caption" foregroundStyle="secondaryLabel">{CURATED_GRAFANA_DASHBOARDS.length}</Text>
              </HStack>
              {CURATED_GRAFANA_DASHBOARDS.map((item: CuratedGrafanaDashboard) => {
                const active = selectedGrafanaKey === item.key
                return (
                  <Button key={item.key} action={() => loadGrafanaSnapshot(item.key)}>
                    <VStack spacing={6} padding={{ horizontal: 12, vertical: 10 }} background={active ? '#007AFF14' : 'systemGroupedBackground'} clipShape={{ type: 'rect', cornerRadius: 14 }}>
                      <HStack>
                        <VStack spacing={2} alignment="leading">
                          <Text font="subheadline" fontWeight="semibold">{item.title}</Text>
                          <Text font="caption" foregroundStyle="secondaryLabel">{item.subtitle}</Text>
                        </VStack>
                        <Spacer />
                        <Text font="caption2" foregroundStyle={item.tagColor}>{item.group}</Text>
                      </HStack>
                    </VStack>
                  </Button>
                )
              })}
            </VStack>
          ) : null}
          {grafanaError ? <Text font="caption" foregroundStyle="#FF3B30">{grafanaError}</Text> : null}
          {grafanaSnapshot ? (
            <VStack spacing={12}>
              <Divider />
              {(() => {
                const selectedDef = CURATED_GRAFANA_DASHBOARDS.find((d: CuratedGrafanaDashboard) => d.key === grafanaSnapshot.key)
                return (
                  <>
                    <HStack>
                      <VStack spacing={2} alignment="leading">
                        <Text font="subheadline" fontWeight="semibold">{grafanaSnapshot.title}</Text>
                        <Text font="caption" foregroundStyle="secondaryLabel">{selectedDef?.subtitle || 'Native Grafana summary synced from public Prometheus metrics.'}</Text>
                      </VStack>
                      <Spacer />
                      <Text font="caption" fontWeight="semibold" padding={{ horizontal: 10, vertical: 5 }} background={((selectedDef?.tagColor || '#007AFF') + '22') as any} clipShape="capsule" foregroundStyle={(selectedDef?.tagColor || '#007AFF') as any}>{selectedDef?.group || grafanaSnapshot.kind.toUpperCase()}</Text>
                    </HStack>

                    <HStack spacing={16}>
                      <VStack spacing={2}><Text font="title3" fontWeight="bold" foregroundStyle="#34C759">{grafanaSnapshot.up}</Text><Text font="caption" foregroundStyle="secondaryLabel">Up</Text></VStack>
                      <VStack spacing={2}><Text font="title3" fontWeight="bold" foregroundStyle={grafanaSnapshot.down > 0 ? '#FF3B30' : '#8E8E93'}>{grafanaSnapshot.down}</Text><Text font="caption" foregroundStyle="secondaryLabel">Down</Text></VStack>
                      {grafanaSnapshot.avgMs != null ? <VStack spacing={2}><Text font="title3" fontWeight="bold" foregroundStyle="#007AFF">{grafanaSnapshot.avgMs.toFixed(1)}</Text><Text font="caption" foregroundStyle="secondaryLabel">Avg ms</Text></VStack> : null}
                      {grafanaSnapshot.lossAvg != null ? <VStack spacing={2}><Text font="title3" fontWeight="bold" foregroundStyle={grafanaSnapshot.lossAvg > 0 ? '#FF9500' : '#34C759'}>{grafanaSnapshot.lossAvg.toFixed(1)}%</Text><Text font="caption" foregroundStyle="secondaryLabel">Avg loss</Text></VStack> : null}
                    </HStack>

                    <Text font="caption2" foregroundStyle="tertiaryLabel">Status summary is computed from the public panel query family used by this dashboard.</Text>
                  </>
                )
              })()}
              {grafanaSnapshot.points.length > 0 ? (
                <VStack spacing={6}>
                  <HStack>
                    <Text font="caption" foregroundStyle="secondaryLabel">Top series snapshot</Text>
                    <Spacer />
                    <Text font="caption2" foregroundStyle="tertiaryLabel">{grafanaSnapshot.points.length} entries</Text>
                  </HStack>
                  <Chart>
                    <BarChart
                      marks={grafanaSnapshot.points.map((p: { label: string; value: number; extra?: string }) => ({
                        label: p.label.length > 12 ? p.label.slice(0, 12) : p.label,
                        value: p.value,
                        foregroundStyle: grafanaSnapshot.kind === 'icmp' ? '#007AFF' : grafanaSnapshot.kind === 'tcp' ? '#FF9500' : '#5856D6',
                      }))}
                    />
                  </Chart>
                </VStack>
              ) : null}
              <VStack spacing={4}>
                <Text font="caption" foregroundStyle="secondaryLabel">Series details</Text>
                {grafanaSnapshot.points.map((p: { label: string; value: number; extra?: string }, i: number) => (
                  <HStack key={i}>
                    <Text font="caption" lineLimit={1}>{p.label}</Text>
                    <Spacer />
                    <Text font="caption2" foregroundStyle="secondaryLabel">{p.value.toFixed(1)}{grafanaSnapshot.kind === 'mtr' ? '' : ' ms'}{p.extra ? ` · ${p.extra}` : ''}</Text>
                  </HStack>
                ))}
              </VStack>
              <Divider />
              <VStack spacing={2}>
                <Text font="caption2" foregroundStyle="tertiaryLabel">Upstream source: NXTrace public Grafana dashboards backed by Prometheus metrics from ping.nxtrace.org.</Text>
                <Text font="caption2" foregroundStyle="tertiaryLabel">Panel family: {grafanaSnapshot.kind === 'icmp' ? 'ICMP latency / loss / success' : grafanaSnapshot.kind === 'tcp' ? 'TCP connect / probe duration / success' : 'MTR hops / mean / loss / best / worst / jitter'}.</Text>
              </VStack>
            </VStack>
          ) : null}
          {nxError ? <Text font="caption" foregroundStyle="#FF3B30">{nxError}</Text> : null}
          {nxHops.length > 0 ? (
            <VStack spacing={10}>
              <Divider />
              <HStack>
                <Text font="subheadline" fontWeight="semibold">{nxSource} → {nxTarget}</Text>
                <Spacer />
                <Button title="Copy" systemImage="doc.on.doc" action={() => {
                  const text = nxHops.map(h => `${h.ttl}  ${h.path}  mean ${h.meanMs?.toFixed(1) || '—'} ms  loss ${h.loss ?? 0}%  best ${h.bestMs?.toFixed(1) || '—'}  worst ${h.worstMs?.toFixed(1) || '—'}`).join('\n')
                  Pasteboard.setString(text)
                  HapticFeedback.selection()
                }} />
              </HStack>
              <HStack spacing={16}>
                <VStack spacing={2}>
                  <Text font="title3" fontWeight="bold" foregroundStyle="#5856D6">{nxHops.length}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Hops</Text>
                </VStack>
                <VStack spacing={2}>
                  <Text font="title3" fontWeight="bold" foregroundStyle="#34C759">{Math.min(...nxHops.map(h => h.meanMs || 9999)).toFixed(1)}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Best ms</Text>
                </VStack>
                <VStack spacing={2}>
                  <Text font="title3" fontWeight="bold" foregroundStyle="#FF9500">{Math.max(...nxHops.map(h => h.meanMs || 0)).toFixed(1)}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Worst ms</Text>
                </VStack>
              </HStack>
              {nxHops.map((hop: NXTraceHop, i: number) => {
                const ms = hop.meanMs || 0
                const loss = hop.loss || 0
                const timeout = !hop.path || hop.path === '*' || loss >= 100
                const color = timeout ? '#8E8E93' : ms < 30 ? '#34C759' : ms < 100 ? '#FF9500' : '#FF3B30'
                return (
                  <HStack key={i} spacing={10} padding={{ vertical: 5 }}>
                    <VStack spacing={0} frame={{ minWidth: 28 }}>
                      <Text font="caption2" foregroundStyle="secondaryLabel">{hop.ttl}</Text>
                      <Image systemName={timeout ? 'circle.dashed' : 'circle.fill'} foregroundStyle={color} frame={{ width: 10, height: 10 }} />
                      {i < nxHops.length - 1 ? <Text font="caption2" foregroundStyle="tertiaryLabel">│</Text> : null}
                    </VStack>
                    <VStack spacing={3}>
                      <HStack>
                        <Text font="subheadline" fontWeight="semibold" foregroundStyle={timeout ? 'tertiaryLabel' : 'label'} lineLimit={1}>{timeout ? '* * * timeout' : hop.path}</Text>
                        <Spacer />
                        <Text font="caption" fontWeight="semibold" foregroundStyle={color}>{hop.meanMs?.toFixed(1) || '—'} ms</Text>
                      </HStack>
                      <HStack spacing={8}>
                        <Text font="caption2" foregroundStyle="secondaryLabel">best {hop.bestMs?.toFixed(1) || '—'}ms</Text>
                        <Text font="caption2" foregroundStyle="secondaryLabel">worst {hop.worstMs?.toFixed(1) || '—'}ms</Text>
                        <Text font="caption2" foregroundStyle={loss > 0 ? '#FF3B30' : 'tertiaryLabel'}>loss {loss}%</Text>
                        {hop.jitterMs != null ? <Text font="caption2" foregroundStyle="tertiaryLabel">jitter {hop.jitterMs.toFixed(1)}ms</Text> : null}
                      </HStack>
                    </VStack>
                  </HStack>
                )
              })}
            </VStack>
          ) : null}
          {nxHops.length === 0 && !nxLoading ? (
            <Text font="caption2" foregroundStyle="tertiaryLabel">Load sources/targets, then sync MTR data to display native hop details.</Text>
          ) : null}
        </VStack>

        <Spacer />
      </VStack>
    </ScrollView>
  )
}
