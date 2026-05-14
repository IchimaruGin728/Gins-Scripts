// DNS Benchmark — DoH concurrent latency test with Live Activity
// @ts-ignore — onResume works at runtime
import { useState, useEffect, useMemo, VStack, HStack, Text, ScrollView, Button, TextField, List, Section, Label, Spacer, ProgressView, Picker, Toggle, Image, Navigation, Script, Divider, Gauge, Chart, BarChart, DisclosureGroup, BackgroundKeeper, LiveActivity, onResume } from 'scripting'
import {
  DNS_SERVERS, DNSServer, DNSBenchResult,
  benchmarkAll, benchmarkQuick,
  formatLatency, latencyColor, featureColor, featureLabel,
} from '../utils/dns_bench'
import { DNSBenchLiveActivity, DNSBenchState } from '../live_activity'

export default function DNSBenchView() {
  const dismiss = Navigation.useDismiss()

  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) setRunning(false)
    })
    return dispose
  }, [])

  // Live Activity instance (lazy, created only when needed)
  const activity = useMemo(() => {
    try {
      const instance = DNSBenchLiveActivity()
      instance.addUpdateListener((s: string) => {
        if (s === 'dismissed') {
          try { BackgroundKeeper.stopKeepAlive() } catch (_) {}
        }
      })
      return instance
    } catch (_) {
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const enabled = await LiveActivity.areActivitiesEnabled()
        setLiveActivitySupported(Boolean(enabled))
        if (enabled) setLiveActivityEnabled(true)
      } catch {
        setLiveActivitySupported(false)
        setLiveActivityEnabled(false)
      }
    })()
  }, [])

  function isActivityAvailable(): boolean {
    return activity !== null && liveActivityEnabled && liveActivitySupported
  }

  // State
  const [domain, setDomain] = useState('www.google.com')
  const [queryType, setQueryType] = useState(0) // 0=A,1=AAAA,2=MX,3=NS,4=TXT,5=CNAME
  const [rounds, setRounds] = useState(3)
  const [concurrency, setConcurrency] = useState(5)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<DNSBenchResult[]>([])
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set(DNS_SERVERS.map((s: DNSServer) => s.name)))
  const [showServerPicker, setShowServerPicker] = useState(false)
  const [quickMode, setQuickMode] = useState(true)
  const [liveActivityEnabled, setLiveActivityEnabled] = useState(false)
  const [liveActivitySupported, setLiveActivitySupported] = useState(false)
  const [benchError, setBenchError] = useState('')

  // Custom DoH servers
  const [customServers, setCustomServers] = useState<DNSServer[]>([])
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customIp, setCustomIp] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)

  // All servers = built-in + custom
  const allServers: DNSServer[] = [...DNS_SERVERS, ...customServers]

  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME']

  // Helper: build top3 from partial results
  function getTop3(partial: DNSBenchResult[]): Array<{ name: string; ms: number }> {
    return partial
      .filter((r: DNSBenchResult) => r.success)
      .sort((a: DNSBenchResult, b: DNSBenchResult) => a.avgMs - b.avgMs)
      .slice(0, 3)
      .map((r: DNSBenchResult) => ({ name: r.server.name, ms: r.avgMs }))
  }

  async function runBench() {
    if (!domain.trim()) return
    setRunning(true)
    setResults([])
    setProgress({ done: 0, total: 0 })
    setBenchError('')
    
    const servers = allServers.filter((s: DNSServer) => selectedServers.has(s.name))
    if (servers.length === 0) { setRunning(false); return }
    
    const type = types[queryType]
    const partialResults: DNSBenchResult[] = []
    let activityStarted = false
    
    // Start Live Activity (MUST await before update/end)
    if (isActivityAvailable() && activity) {
      try {
        BackgroundKeeper.keepAlive()
        activityStarted = await activity.start({
          progress: 0,
          total: servers.length,
          status: 'testing',
          currentServer: servers[0]?.name || '',
          fastest: '',
          fastestMs: 0,
          top3: [],
        } as DNSBenchState)
      } catch (e) {
        console.warn('Live Activity start failed:', e)
        activityStarted = false
      }
    }
    
    try {
      let res: DNSBenchResult[]
      const onProgress = (d: number, t: number, current: DNSBenchResult | null) => {
        setProgress({ done: d, total: t })
        // Collect partial results for Live Activity top 3
        if (current) partialResults.push(current)
        // Update Live Activity with current progress
        if (activityStarted && activity) {
          const top = getTop3(partialResults)
          const fastestSoFar = top[0]
          try {
            activity.update({
              progress: d,
              total: t,
              status: 'testing',
              currentServer: current?.server?.name || '',
              fastest: fastestSoFar?.name || '',
              fastestMs: fastestSoFar?.ms || 0,
              top3: top,
            } as DNSBenchState)
          } catch (_) {}
        }
      }
      if (quickMode) {
        res = await benchmarkQuick(servers, domain.trim(), type, onProgress)
      } else {
        res = await benchmarkAll(servers, domain.trim(), type, rounds, concurrency, onProgress)
      }
      setResults(res)
      
      // End Live Activity with final results
      if (activityStarted && activity) {
        const finalTop = getTop3(res)
        const finalFastest = finalTop[0]
        try {
          await activity.end({
            progress: res.length,
            total: res.length,
            status: 'done',
            currentServer: '',
            fastest: finalFastest?.name || 'None',
            fastestMs: finalFastest?.ms || 0,
            top3: finalTop,
          } as DNSBenchState, { dismissTimeInterval: 30 })
          await BackgroundKeeper.stopKeepAlive()
        } catch (_) {}
      }
      HapticFeedback.notificationSuccess()
    } catch (e) {
      setBenchError(String(e))
      if (activityStarted && activity) {
        try {
          await activity.end({
            progress: 0,
            total: servers.length,
            status: 'error',
            currentServer: '',
            fastest: '',
            fastestMs: 0,
            top3: [],
          } as DNSBenchState, { dismissTimeInterval: 5 })
          await BackgroundKeeper.stopKeepAlive()
        } catch (_) { /* ignore LA errors */ }
      }
      HapticFeedback.notificationError()
    }
    setRunning(false)
  }

  const fastest = results.find(r => r.success)
  const failCount = results.filter(r => !r.success).length
  const selectedCount = allServers.filter((s: DNSServer) => selectedServers.has(s.name)).length

  return (
    <ScrollView
      navigationTitle="DNS Benchmark"
      toolbar={{
        primaryAction: <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />,
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>
        {/* ── Config ── */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Image systemName="speedometer" foregroundStyle="#FF9500" frame={{ width: 20, height: 20 }} />
            <Text font="headline"> DNS Benchmark</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="secondaryLabel">DoH only</Text>
          </HStack>
          
          <TextField title="Domain" value={domain} onChanged={setDomain} prompt="e.g. www.google.com" />
          
          <Picker title="Query Type" value={queryType} onChanged={setQueryType}>
            <Text tag={0}>A (IPv4)</Text>
            <Text tag={1}>AAAA (IPv6)</Text>
            <Text tag={2}>MX (Mail)</Text>
            <Text tag={3}>NS (Name Server)</Text>
            <Text tag={4}>TXT (Text)</Text>
            <Text tag={5}>CNAME (Alias)</Text>
          </Picker>
          
          <Toggle title="Quick Mode (1 round, fast preview)" value={quickMode} onChanged={setQuickMode} />
          
          <Toggle title={liveActivitySupported ? 'Live Activity progress' : 'Live Activity unavailable on this build/device'} value={liveActivityEnabled} onChanged={setLiveActivityEnabled} disabled={!liveActivitySupported} />
          
          {!quickMode && (
            <>
              <Picker title="Rounds" value={rounds} onChanged={setRounds}>
                <Text tag={1}>1 round</Text>
                <Text tag={3}>3 rounds</Text>
                <Text tag={5}>5 rounds</Text>
                <Text tag={10}>10 rounds</Text>
              </Picker>
              <Picker title="Concurrency" value={concurrency} onChanged={setConcurrency}>
                <Text tag={3}>3 parallel</Text>
                <Text tag={5}>5 parallel</Text>
                <Text tag={8}>8 parallel</Text>
                <Text tag={10}>10 parallel</Text>
              </Picker>
            </>
          )}

          <Button
            title={running ? `Testing ${progress.done}/${progress.total}…` : `Benchmark ${selectedCount} DoH Servers`}
            systemImage={running ? 'hourglass' : 'play.fill'}
            action={runBench}
            disabled={running}
          />
          
          <Button
            title={`Select Servers (${selectedCount}/${allServers.length})`}
            systemImage="checklist"
            action={() => setShowServerPicker(!showServerPicker)}
          />
        </VStack>

        {/* ── Server Picker ── */}
        {showServerPicker && (
          <VStack
            spacing={4}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">DoH Servers ({allServers.length})</Text>
              <Spacer />
              <Button title={selectedCount === allServers.length ? 'Deselect All' : 'Select All'} action={() => {
                if (selectedCount === allServers.length) setSelectedServers(new Set())
                else setSelectedServers(new Set(allServers.map((s: DNSServer) => s.name)))
              }} />
            </HStack>

            {/* Built-in servers */}
            {allServers.map((s: DNSServer, i: number) => (
              <HStack key={i} alignment="center" spacing={8}>
                <Button title=" " systemImage={selectedServers.has(s.name) ? 'checkmark.circle.fill' : 'circle'} frame={{ width: 24, height: 24 }} action={() => {
                  const next = new Set(selectedServers)
                  if (next.has(s.name)) next.delete(s.name); else next.add(s.name)
                  setSelectedServers(next)
                }} />
                <VStack spacing={1}>
                  <HStack spacing={6}>
                    <Text font="caption" frame={{ width: 24 }}>{s.country}</Text>
                    <Text font="subheadline">{s.name}</Text>
                    {i >= DNS_SERVERS.length && <Text font="caption2" foregroundStyle="#FF9500">Custom</Text>}
                  </HStack>
                  <HStack spacing={4}>
                    {s.features.map((f: string, j: number) => (
                      <Text key={j} font="caption2" foregroundStyle={featureColor(f) as any}>{featureLabel(f)}</Text>
                    ))}
                  </HStack>
                </VStack>
                <Spacer />
                <VStack alignment="trailing" spacing={1}>
                  <Text font="caption" foregroundStyle="tertiaryLabel">{s.ips.split(' / ')[0] || s.dohUrl.split('/')[2]}</Text>
                  {i >= DNS_SERVERS.length && (
                    <Button title=" " systemImage="trash" frame={{ width: 16, height: 16 }} foregroundStyle="#FF3B30" action={() => {
                      setCustomServers(customServers.filter((cs: DNSServer) => cs.name !== s.name))
                      const next = new Set(selectedServers)
                      next.delete(s.name)
                      setSelectedServers(next)
                    }} />
                  )}
                </VStack>
              </HStack>
            ))}

            <Divider />

            {/* Add Custom DoH Server */}
            <Button
              title={showCustomForm ? 'Cancel' : '+ Add Custom DoH Server'}
              systemImage={showCustomForm ? 'xmark.circle' : 'plus.circle.fill'}
              foregroundStyle={showCustomForm ? '#FF3B30' : '#007AFF'}
              action={() => setShowCustomForm(!showCustomForm)}
            />

            {showCustomForm && (
              <VStack spacing={8} padding={{ horizontal: 8, vertical: 8 }}>
                <TextField title="Name" value={customName} onChanged={setCustomName} prompt="e.g. My DNS" />
                <TextField title="DoH URL" value={customUrl} onChanged={setCustomUrl} prompt="https://dns.example.com/dns-query" />
                <TextField title="IP (optional)" value={customIp} onChanged={setCustomIp} prompt="e.g. 1.2.3.4" />
                <Button
                  title="Add Server"
                  systemImage="plus.circle.fill"
                  foregroundStyle="#34C759"
                  disabled={!customName.trim() || !customUrl.trim()}
                  action={() => {
                    const newServer: DNSServer = {
                      name: customName.trim(),
                      provider: 'Custom',
                      dohUrl: customUrl.trim(),
                      ips: customIp.trim() || customUrl.trim().split('/')[2] || '',
                      country: '🔧',
                      features: ['custom'],
                    }
                    setCustomServers([...customServers, newServer])
                    setSelectedServers(new Set([...selectedServers, newServer.name]))
                    setCustomName('')
                    setCustomUrl('')
                    setCustomIp('')
                    setShowCustomForm(false)
                    HapticFeedback.notificationSuccess()
                  }}
                />
              </VStack>
            )}
          </VStack>
        )}

        {/* ── Error ── */}
        {benchError && !running ? (
          <VStack
            spacing={6}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="exclamationmark.triangle.fill" foregroundStyle="#FF3B30" frame={{ width: 18, height: 18 }} />
              <Text font="headline" foregroundStyle="#FF3B30"> Error</Text>
            </HStack>
            <Text font="caption" foregroundStyle="secondaryLabel">{benchError}</Text>
            <Button title="Dismiss" foregroundStyle="secondaryLabel" action={() => setBenchError('')} />
          </VStack>
        ) : null}

        {/* ── Progress ── */}
        {running && (
          <VStack
            spacing={10}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Image systemName="antenna.radiowaves.left.and.right" foregroundStyle="#FF9F0A" frame={{ width: 18, height: 18 }} />
              <Text font="headline"> Testing…</Text>
              <Spacer />
              <Text font="subheadline" foregroundStyle="#FF9F0A" fontWeight="bold">{progress.done}/{progress.total}</Text>
            </HStack>
            
            {/* Animated progress bar */}
            <VStack spacing={4}>
              <HStack>
                <Text font="caption" foregroundStyle="secondaryLabel">
                  {quickMode ? 'Quick scan' : `${rounds} rounds × ${concurrency} parallel`} · DoH
                </Text>
                <Spacer />
                <Text font="caption" foregroundStyle="#FF9F0A" fontWeight="bold">
                  {progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%
                </Text>
              </HStack>
              <ProgressView value={progress.total > 0 ? progress.done / progress.total : 0} />
            </VStack>
            
            {/* Current server */}
            <HStack>
              <Image systemName="globe" foregroundStyle="#0A84FF" frame={{ width: 14, height: 14 }} />
              <Text font="subheadline" foregroundStyle="secondaryLabel"> Current: </Text>
              <Text font="subheadline" foregroundStyle="#0A84FF">
                {progress.done > 0 && progress.done <= progress.total 
                  ? allServers.filter((s: DNSServer) => selectedServers.has(s.name))[Math.min(progress.done, progress.total - 1)]?.name || '…'
                  : 'Starting…'}
              </Text>
            </HStack>
            
            {liveActivitySupported && liveActivityEnabled && activity && (
              <HStack>
                <Image systemName="iphone" foregroundStyle="#34C759" frame={{ width: 14, height: 14 }} />
                <Text font="caption" foregroundStyle="tertiaryLabel"> Live Activity syncing…</Text>
              </HStack>
            )}
          </VStack>
        )}

        {/* ── Results Summary ── */}
        {results.length > 0 && !running && (
          <VStack
            spacing={10}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Results</Text>
              <Spacer />
              <Text font="caption" foregroundStyle="secondaryLabel">{results.length - failCount} ok / {failCount} failed</Text>
            </HStack>
            
            {fastest && (
              <HStack alignment="center" spacing={12}>
                <VStack alignment="center" spacing={2}>
                  <Text font="largeTitle" foregroundStyle={latencyColor(fastest.avgMs) as any}>{fastest.avgMs}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">Fastest (ms)</Text>
                </VStack>
                <VStack alignment="center" spacing={2}>
                  <Text font="title2">{fastest.server.name}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel">{fastest.server.ips}</Text>
                </VStack>
              </HStack>
            )}

            {/* Bar chart of top 10 */}
            {results.filter(r => r.success).length > 1 && (
              <Chart>
                <BarChart
                  marks={results.filter(r => r.success).slice(0, 12).map((r) => ({
                    label: r.server.name.replace('Cloudflare ', 'CF ').replace('CleanBrowsing ', 'CB ').replace('AdGuard ', 'AG ').replace('Security', 'Sec').replace('Family', 'Fam').replace('Default', 'Def').substring(0, 12),
                    value: r.avgMs,
                    foregroundStyle: latencyColor(r.avgMs) as any,
                  }))}
                />
              </Chart>
            )}
          </VStack>
        )}

        {/* ── Detailed Results List ── */}
        {results.length > 0 && !running && (
          <VStack spacing={0} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
            <VStack padding={{ horizontal: 16, vertical: 12 }}>
              <HStack>
                <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 40 }}>#</Text>
                <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 120 }}>Server</Text>
                <Spacer />
                <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="subheadline" foregroundStyle="secondaryLabel">Avg</Text></HStack>
                <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="subheadline" foregroundStyle="secondaryLabel">Min</Text></HStack>
                <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="subheadline" foregroundStyle="secondaryLabel">Max</Text></HStack>
              </HStack>
            </VStack>
            <Divider />
            
            {results.map((r, i) => (
              <VStack key={i}>
                <HStack alignment="center" padding={{ horizontal: 16, vertical: 10 }} spacing={8}>
                  <Text font="subheadline" foregroundStyle="secondaryLabel" frame={{ minWidth: 40 }}>{i + 1}</Text>
                  <VStack spacing={1} frame={{ minWidth: 120 }}>
                    <HStack spacing={6}>
                      <Text font="caption" frame={{ width: 24 }}>{r.server.country}</Text>
                      <Text font="subheadline" lineLimit={1}>{r.server.name}</Text>
                    </HStack>
                    <HStack spacing={4}>
                      {r.success && r.server.features.slice(0, 2).map((f: string, j: number) => (
                        <Text key={j} font="caption2" foregroundStyle={featureColor(f) as any}>{featureLabel(f)}</Text>
                      ))}
                      {!r.success && <Text font="caption2" foregroundStyle="#FF3B30">✕ {r.error || 'Failed'}</Text>}
                    </HStack>
                  </VStack>
                  <Spacer />
                  <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="subheadline" foregroundStyle={latencyColor(r.avgMs) as any}>{formatLatency(r.avgMs)}</Text></HStack>
                  <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="caption" foregroundStyle="secondaryLabel">{formatLatency(r.minMs)}</Text></HStack>
                  <HStack frame={{ minWidth: 60 }}><Spacer /><Text font="caption" foregroundStyle="secondaryLabel">{formatLatency(r.maxMs)}</Text></HStack>
                </HStack>
                {i < results.length - 1 && <Divider />}
              </VStack>
            ))}
          </VStack>
        )}

        {/* ── Empty state ── */}
        {results.length === 0 && !running && (
          <VStack alignment="center" padding>
            <Text font="subheadline" foregroundStyle="secondaryLabel">
              Tests DNS servers via DoH (DNS over HTTPS) only.
            </Text>
            <Text font="caption" foregroundStyle="tertiaryLabel" padding={{ top: 4 }}>
              UDP/TCP/DoT/DoQ require raw sockets — not available in Scripting.
            </Text>
          </VStack>
        )}

        <Spacer />
      </VStack>
    </ScrollView>
  )
}
