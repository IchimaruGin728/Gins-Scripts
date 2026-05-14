// Dashboard - Multi-source IP info with risk assessment + local network interfaces
// @ts-ignore — onResume works at runtime
import { useState, useEffect, VStack, HStack, Text, ScrollView, Button, Label, Gauge, Divider, Spacer, ProgressView, Image, Navigation, Script, onResume } from 'scripting'
import {
  fetchAllIPSources, calculateRisk, IPInfo, CloudflareTrace
} from '../utils/ip'

type SourceData = {
  ipinfo: IPInfo | null
  ipapi: IPInfo | null
  ipapiCom: IPInfo | null
  ipwhois: IPInfo | null
  cfTrace: CloudflareTrace | null
}

function SourceStatus({ name, ok }: { name: string; ok: boolean }) {
  return (
    <HStack spacing={6}>
      <Image
        systemName={ok ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
        foregroundStyle={ok ? '#34C759' : '#FF3B30'}
        frame={{ width: 14, height: 14 }}
      />
      <Text font="caption" foregroundStyle="secondaryLabel">{name}</Text>
    </HStack>
  )
}

function InfoRow({ label, value, icon, onCopy }: { label: string; value: string; icon?: string; onCopy?: () => void }) {
  return (
    <HStack>
      {icon ? (
        <Image systemName={icon} frame={{ width: 16, height: 16 }} foregroundStyle="#007AFF" />
      ) : null}
      <Text font="subheadline" foregroundStyle="secondaryLabel">{label}</Text>
      <Spacer />
      <Text font="subheadline">{value || '—'}</Text>
      {onCopy && value ? (
        <Button
          title="Copy"
          systemImage="doc.on.doc"
          frame={{ width: 28, height: 28 }}
          foregroundStyle="#007AFF"
          action={onCopy}
        />
      ) : null}
    </HStack>
  )
}

export default function DashboardView() {
  const dismiss = Navigation.useDismiss()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SourceData | null>(null)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [interfaces, setInterfaces] = useState<Record<string, Device.NetworkInterface[]>>({})

  function showCopyToast(msg: string) {
    setToastMessage(msg)
    setShowToast(true)
    HapticFeedback.selection()
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const result = await fetchAllIPSources()
      setData(result)
      HapticFeedback.notificationSuccess()
    } catch (e) {
      setError(`Failed to fetch: ${e}`)
      HapticFeedback.notificationError()
    }

    // Load local network interfaces
    try {
      const ifaces = Device.networkInterfaces()
      setInterfaces(ifaces)
    } catch (_) {}

    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Auto-refresh IP data when app resumes from minimized
  useEffect(() => {
    if (typeof onResume !== 'function') return
    const dispose = onResume((event: any) => {
      if (event.resumeFromMinimized) {
        loadData()
      }
    })
    return dispose
  }, [])

  // Pick best available source
  const primary: IPInfo | null = data?.ipapiCom || data?.ipinfo || data?.ipapi || data?.ipwhois || null
  const risk = primary ? calculateRisk(primary) : null

  // Filter meaningful network interfaces (non-internal IPv4)
  const activeInterfaces = Object.entries(interfaces).flatMap(([name, addrs]) =>
    addrs
      .filter(a => !a.isInternal && a.family === 'IPv4')
      .map(a => ({ name, ...a }))
  )
  const loopbackInterfaces = Object.entries(interfaces).flatMap(([name, addrs]) =>
    addrs
      .filter(a => a.isInternal)
      .map(a => ({ name, ...a }))
  )

  async function handleShare() {
    const lines = [`IP: ${primary?.ip || '—'}`]
    const loc = [primary?.city, primary?.region, primary?.country_name || primary?.country].filter(Boolean).join(', ')
    if (loc) lines.push(`Location: ${loc}`)
    if (primary?.isp || primary?.org) lines.push(`ISP: ${primary?.isp || primary?.org}`)
    if (primary?.asn) lines.push(`ASN: ${primary.asn}`)
    await ShareSheet.present([lines.join('\n')])
  }

  if (loading && !data) {
    return (
      <ScrollView navigationTitle="Dashboard">
        <VStack spacing={16} padding>
          <VStack spacing={12} padding={{ horizontal: 16, vertical: 22 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
            <HStack>
              <VStack spacing={4} alignment="leading">
                <Text font="caption" foregroundStyle="secondaryLabel">PUBLIC IP</Text>
                <Text font="title2" fontWeight="bold">Loading…</Text>
              </VStack>
              <Spacer />
              <ProgressView />
            </HStack>
            <Text font="subheadline" foregroundStyle="secondaryLabel">Querying IP sources and local interfaces…</Text>
          </VStack>
          <VStack spacing={10} padding={{ horizontal: 16, vertical: 14 }} background="secondarySystemGroupedBackground" clipShape={{ type: 'rect', cornerRadius: 18 }}>
            <Text font="headline">Preparing Dashboard</Text>
            <Text font="caption" foregroundStyle="secondaryLabel">The page will update automatically when sources respond.</Text>
          </VStack>
        </VStack>
      </ScrollView>
    )
  }

  if (error) {
    return (
      <VStack alignment="center" spacing={12} frame={{ maxWidth: 'infinity', maxHeight: 'infinity' }}>
        <Image systemName="wifi.exclamationmark" foregroundStyle="#FF3B30" frame={{ width: 48, height: 48 }} />
        <Text font="headline" foregroundStyle="#FF3B30">{error}</Text>
        <Button title="Retry" systemImage="arrow.clockwise" action={loadData} />
      </VStack>
    )
  }

  return (
    <ScrollView
      navigationTitle="Dashboard"
      refreshable={loadData}
      toast={{
        isPresented: showToast,
        onChanged: (v: boolean) => setShowToast(v),
        message: toastMessage,
        duration: 1.5,
        position: 'bottom',
      }}
      toolbar={{
        primaryAction: (
          <HStack spacing={8}>
            <Button title="Share" systemImage="square.and.arrow.up" action={handleShare} />
            <Button title="Minimize" systemImage="minus.circle" action={() => Script.minimize()} />
          </HStack>
        ),
        cancellationAction: <Button title="Close" systemImage="xmark.circle" action={dismiss} />,
      }}
    >
      <VStack spacing={16} padding>
        {/* IP Address Hero */}
        <VStack
          spacing={12}
          padding={{ horizontal: 16, vertical: 16 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <VStack spacing={3} alignment="leading">
              <Text font="caption" foregroundStyle="secondaryLabel">PUBLIC IP</Text>
              <Text font="title2" fontWeight="bold" lineLimit={1}>{primary?.ip || '—'}</Text>
            </VStack>
            <Spacer />
            {primary?.ip ? (
              <Button
                title="Copy"
                systemImage="doc.on.doc"
                frame={{ width: 34, height: 34 }}
                foregroundStyle="#007AFF"
                action={async () => {
                  await Pasteboard.setString(primary.ip)
                  showCopyToast('IP copied')
                }}
              />
            ) : null}
          </HStack>
          <HStack spacing={6}>
            <Image systemName="location.fill" foregroundStyle="secondaryLabel" frame={{ width: 13, height: 13 }} />
            <Text font="subheadline" foregroundStyle="secondaryLabel" lineLimit={1}>
              {[primary?.city, primary?.region, primary?.country_name || primary?.country].filter(Boolean).join(', ') || 'Location unavailable'}
            </Text>
            <Spacer />
          </HStack>
        </VStack>

        {/* Local Network Interfaces */}
        {activeInterfaces.length > 0 && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Local Network</Text>
              <Spacer />
              <Image systemName="wifi" foregroundStyle="#007AFF" frame={{ width: 18, height: 18 }} />
            </HStack>
            <Divider />
            {activeInterfaces.map((iface, i) => (
              <VStack key={`${iface.name}-${i}`} spacing={4}>
                <HStack>
                  <Image
                    systemName={iface.name.startsWith('en') ? 'wifi' : 'antenna.radiowaves.left.and.right'}
                    frame={{ width: 16, height: 16 }}
                    foregroundStyle="#007AFF"
                  />
                  <Text font="subheadline" foregroundStyle="secondaryLabel">{iface.name}</Text>
                  <Spacer />
                  <Text font="subheadline">{iface.address}</Text>
                  <Button
                    title="Copy"
                    systemImage="doc.on.doc"
                    frame={{ width: 28, height: 28 }}
                    foregroundStyle="#007AFF"
                    action={async () => {
                      await Pasteboard.setString(iface.address)
                      showCopyToast(`${iface.name} IP copied`)
                    }}
                  />
                </HStack>
                {iface.mac ? (
                  <HStack>
                    <Spacer />
                    <Text font="caption" foregroundStyle="tertiaryLabel">MAC: {iface.mac}</Text>
                    <Button
                      title="Copy MAC"
                      systemImage="doc.on.doc"
                      frame={{ width: 24, height: 24 }}
                      foregroundStyle="tertiaryLabel"
                      action={async () => {
                        await Pasteboard.setString(iface.mac!)
                        showCopyToast('MAC copied')
                      }}
                    />
                  </HStack>
                ) : null}
                {iface.netmask ? (
                  <HStack>
                    <Spacer />
                    <Text font="caption" foregroundStyle="tertiaryLabel">Mask: {iface.netmask}</Text>
                  </HStack>
                ) : null}
              </VStack>
            ))}
            {loopbackInterfaces.length > 0 && (
              <HStack>
                <Image systemName="loop" frame={{ width: 16, height: 16 }} foregroundStyle="tertiaryLabel" />
                <Text font="caption" foregroundStyle="tertiaryLabel">
                  Loopback: {loopbackInterfaces.map(a => a.address).join(', ')}
                </Text>
              </HStack>
            )}
          </VStack>
        )}

        {/* Risk Assessment */}
        {risk && primary && (
          <VStack
            spacing={10}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Risk Assessment</Text>
              <Spacer />
              <Text
                font="caption"
                fontWeight="semibold"
                padding={{ horizontal: 10, vertical: 5 }}
                background={risk.risk > 60 ? '#FF3B301A' : risk.risk > 30 ? '#FF95001A' : '#34C7591A'}
                clipShape="capsule"
                foregroundStyle={risk.risk > 60 ? '#FF3B30' : risk.risk > 30 ? '#FF9500' : '#34C759'}
              >
                {risk.riskLabel} · {risk.risk}
              </Text>
            </HStack>
            <Gauge
              value={risk.risk / 100}
              label={<Text font="caption">Risk Score</Text>}
              min={0}
              max={1}
              currentValueLabel={
                <Text font="subheadline" foregroundStyle={risk.risk > 60 ? '#FF3B30' : risk.risk > 30 ? '#FF9500' : '#34C759'}>
                  {risk.risk}/100
                </Text>
              }
              minValueLabel={<Text font="caption2">0</Text>}
              maxValueLabel={<Text font="caption2">100</Text>}
            />
            <HStack spacing={12}>
              {risk.isVPN && (
                <HStack spacing={4}>
                  <Image systemName="shield.fill" foregroundStyle="#FF9500" frame={{ width: 14, height: 14 }} />
                  <Text font="caption" foregroundStyle="#FF9500">VPN/Proxy</Text>
                </HStack>
              )}
              {risk.isHomeBroadband && (
                <HStack spacing={4}>
                  <Image systemName="house.fill" foregroundStyle="#34C759" frame={{ width: 14, height: 14 }} />
                  <Text font="caption" foregroundStyle="#34C759">Home Broadband</Text>
                </HStack>
              )}
              {primary.hosting && (
                <HStack spacing={4}>
                  <Image systemName="server.rack" foregroundStyle="#AF52DE" frame={{ width: 14, height: 14 }} />
                  <Text font="caption" foregroundStyle="#AF52DE">Hosting</Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        )}

        {/* Network Details */}
        <VStack
          spacing={8}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Text font="headline">Network Details</Text>
            <Spacer />
            <Image systemName="info.circle" foregroundStyle="secondaryLabel" frame={{ width: 16, height: 16 }} />
          </HStack>
          <Divider />
          <InfoRow icon="network" label="ISP" value={primary?.isp || primary?.org || ''} onCopy={async () => { await Pasteboard.setString(primary?.isp || primary?.org || ''); showCopyToast('ISP copied') }} />
          <InfoRow icon="globe" label="ASN" value={primary?.asn || ''} onCopy={primary?.asn ? async () => { await Pasteboard.setString(primary.asn!); showCopyToast('ASN copied') } : undefined} />
          {primary?.asname ? <InfoRow icon="tag" label="AS Name" value={primary.asname} onCopy={async () => { await Pasteboard.setString(primary.asname!); showCopyToast('AS Name copied') }} /> : null}
          <InfoRow icon="location" label="Location" value={[primary?.city, primary?.region, primary?.country_name || primary?.country].filter(Boolean).join(', ')} onCopy={async () => { const loc = [primary?.city, primary?.region, primary?.country_name || primary?.country].filter(Boolean).join(', '); await Pasteboard.setString(loc); showCopyToast('Location copied') }} />
          <InfoRow icon="clock" label="Timezone" value={primary?.timezone || ''} onCopy={primary?.timezone ? async () => { await Pasteboard.setString(primary.timezone!); showCopyToast('Timezone copied') } : undefined} />
          {primary?.postal ? <InfoRow icon="envelope" label="Postal" value={primary.postal} onCopy={async () => { await Pasteboard.setString(primary.postal!); showCopyToast('Postal copied') }} /> : null}
          {primary?.currency ? <InfoRow icon="dollarsign.circle" label="Currency" value={primary.currency} onCopy={async () => { await Pasteboard.setString(primary.currency!); showCopyToast('Currency copied') }} /> : null}
          {primary?.calling_code ? <InfoRow icon="phone" label="Calling Code" value={`+${primary.calling_code}`} onCopy={async () => { await Pasteboard.setString(`+${primary.calling_code!}`); showCopyToast('Calling code copied') }} /> : null}
        </VStack>

        {/* Cloudflare Trace */}
        {data?.cfTrace && (
          <VStack
            spacing={8}
            padding={{ horizontal: 16, vertical: 14 }}
            background="secondarySystemGroupedBackground"
            clipShape={{ type: 'rect', cornerRadius: 18 }}
          >
            <HStack>
              <Text font="headline">Cloudflare Trace</Text>
              <Spacer />
              <Image systemName="cloud.fill" foregroundStyle="#F6821F" frame={{ width: 18, height: 18 }} />
            </HStack>
            <Divider />
            <InfoRow icon="server.rack" label="Colo" value={data.cfTrace.colo} />
            <InfoRow icon="lock" label="TLS" value={data.cfTrace.tls} />
            <InfoRow icon="globe" label="HTTP" value={data.cfTrace.http} />
            <InfoRow icon="location" label="Location" value={data.cfTrace.loc} />
            <InfoRow icon="shield" label="WARP" value={data.cfTrace.warp} />
            <InfoRow icon="arrow.left.arrow.right" label="Scheme" value={data.cfTrace.visit_scheme} />
          </VStack>
        )}

        {/* Source Status */}
        <VStack
          spacing={8}
          padding={{ horizontal: 16, vertical: 14 }}
          background="secondarySystemGroupedBackground"
          clipShape={{ type: 'rect', cornerRadius: 18 }}
        >
          <HStack>
            <Text font="headline">Data Sources</Text>
            <Spacer />
            <Text font="caption" foregroundStyle="secondaryLabel">{[data?.ipinfo, data?.ipapi, data?.ipapiCom, data?.ipwhois, data?.cfTrace].filter(Boolean).length}/5</Text>
          </HStack>
          <Divider />
          <VStack spacing={6}>
            <SourceStatus name="ipinfo.io" ok={!!data?.ipinfo} />
            <SourceStatus name="ipapi.co" ok={!!data?.ipapi} />
            <SourceStatus name="ip-api.com" ok={!!data?.ipapiCom} />
            <SourceStatus name="ipwho.is" ok={!!data?.ipwhois} />
            <SourceStatus name="Cloudflare Trace" ok={!!data?.cfTrace} />
          </VStack>
        </VStack>

        {/* Refresh Button */}
        <Button
          title="Refresh"
          systemImage="arrow.clockwise"
          action={loadData}
        />

        <Spacer />
      </VStack>
    </ScrollView>
  )
}
