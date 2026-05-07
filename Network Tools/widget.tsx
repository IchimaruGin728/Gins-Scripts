// Network Tools - Home Screen Widgets (Interactive)
import {
  Widget, WidgetFamily, Text, VStack, HStack, Spacer,
  Gauge, Image, Divider, Button
} from 'scripting'
import { fetchAllIPSources, calculateRisk, IPInfo } from './utils/ip'
import { RefreshIPIntent, QuickPingIntent } from './app_intents'

async function main() {
  const family = Widget.family

  if (family === 'systemSmall') {
    // Small: Quick IP status with refresh button
    let ip = '—'
    let location = 'Loading…'
    let riskLabel = ''
    let riskColor = '#8E8E93'

    try {
      const data = await fetchAllIPSources()
      const primary: IPInfo | null = data.ipapiCom || data.ipinfo || data.ipapi || data.ipwhois || null
      if (primary) {
        ip = primary.ip || '—'
        location = [primary.city, primary.country_name || primary.country].filter(Boolean).join(', ') || '—'
        const risk = calculateRisk(primary)
        riskLabel = risk.riskLabel
        riskColor = risk.risk > 60 ? '#FF3B30' : risk.risk > 30 ? '#FF9500' : '#34C759'
      }
    } catch { /* empty */ }

    Widget.present(
      <VStack spacing={6} padding>
        <HStack>
          <Image systemName="globe" foregroundStyle="#007AFF" frame={{ width: 16, height: 16 }} />
          <Text font="caption" foregroundStyle="secondaryLabel">Network Tools</Text>
          <Spacer />
          <Button title="Refresh" systemImage="arrow.clockwise" intent={(RefreshIPIntent as any)()} />
        </HStack>
        <Text font="title2">{ip}</Text>
        <Text font="caption" foregroundStyle="secondaryLabel">{location}</Text>
        <Spacer />
        <HStack>
          <Image
            systemName={riskLabel === 'Low' ? 'shield.checkered' : 'shield'}
            foregroundStyle={riskColor as any}
            frame={{ width: 12, height: 12 }}
          />
          <Text font="caption" foregroundStyle={riskColor as any}>{riskLabel || '—'} Risk</Text>
        </HStack>
      </VStack>
    )
  } else {
    // Medium: Network dashboard with refresh + quick ping
    let ip = '—'
    let location = '—'
    let isp = '—'
    let colo = '—'
    let risk = 0
    let riskLabel = '—'
    let riskColor = '#8E8E93'

    try {
      const data = await fetchAllIPSources()
      const primary: IPInfo | null = data.ipapiCom || data.ipinfo || data.ipapi || data.ipwhois || null
      if (primary) {
        ip = primary.ip || '—'
        location = [primary.city, primary.region, primary.country_name || primary.country].filter(Boolean).join(', ') || '—'
        isp = primary.isp || primary.org || '—'
        const r = calculateRisk(primary)
        risk = r.risk
        riskLabel = r.riskLabel
        riskColor = risk > 60 ? '#FF3B30' : risk > 30 ? '#FF9500' : '#34C759'
      }
      if (data.cfTrace) {
        colo = data.cfTrace.colo || '—'
      }
    } catch { /* empty */ }

    Widget.present(
      <VStack spacing={8} padding>
        <HStack>
          <Image systemName="network" foregroundStyle="#007AFF" frame={{ width: 18, height: 18 }} />
          <Text font="headline"> Network Tools</Text>
          <Spacer />
          <Text font="caption" foregroundStyle={riskColor as any}>{riskLabel} Risk</Text>
          <Button title="Refresh" systemImage="arrow.clockwise" intent={(RefreshIPIntent as any)()} />
        </HStack>

        <HStack spacing={16}>
          <VStack alignment="leading" spacing={2}>
            <Text font="caption" foregroundStyle="secondaryLabel">IP ADDRESS</Text>
            <Text font="title3">{ip}</Text>
          </VStack>
          <VStack alignment="leading" spacing={2}>
            <Text font="caption" foregroundStyle="secondaryLabel">LOCATION</Text>
            <Text font="subheadline">{location}</Text>
          </VStack>
        </HStack>

        <Divider />

        <HStack spacing={16}>
          <VStack alignment="leading" spacing={2}>
            <Text font="caption" foregroundStyle="secondaryLabel">ISP</Text>
            <Text font="caption">{isp}</Text>
          </VStack>
          <VStack alignment="leading" spacing={2}>
            <Text font="caption" foregroundStyle="secondaryLabel">CF COLO</Text>
            <Text font="caption">{colo}</Text>
          </VStack>
        </HStack>

        <Gauge
          value={risk / 100}
          label={<Text font="caption2">Risk</Text>}
          min={0}
          max={1}
          currentValueLabel={<Text font="caption" foregroundStyle={riskColor as any}>{risk}</Text>}
        />

        <HStack spacing={8}>
          <Button title="Ping CF" systemImage="waveform.path.ecg" intent={(QuickPingIntent as any)()} />
          <Spacer />
        </HStack>
      </VStack>,
      { reloadPolicy: { policy: 'after', date: new Date(Date.now() + 1000 * 60 * 30) } }
    )
  }
}

main()
