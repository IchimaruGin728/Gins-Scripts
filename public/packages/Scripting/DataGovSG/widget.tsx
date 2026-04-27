import {
  EnvironmentValuesReader,
  HStack,
  Image,
  RoundedRectangle,
  Script,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack,
} from "scripting"
import { PALETTE, alpha, forecastSymbol, loadDashboard, pm25Tone, readSettings } from "./shared"

const settings = readSettings(Widget.parameter)
const dashboard = await loadDashboard(settings)

function Card(props: { title?: string; children: JSX.Element | JSX.Element[]; fill?: string }) {
  return (
    <ZStack>
      <RoundedRectangle
        fill={props.fill || PALETTE.card}
        cornerRadius={18}
      />
      <VStack alignment="leading" spacing={5} padding={12}>
        {props.title ? (
          <Text font={{ size: 10, weight: "semibold" }} foregroundStyle={PALETTE.whiteSoft}>
            {props.title}
          </Text>
        ) : null}
        {props.children}
      </VStack>
    </ZStack>
  )
}

function Header() {
  return (
    <HStack alignment="center">
      <VStack alignment="leading" spacing={2}>
        <Text font={{ size: 15, weight: "bold", design: "rounded" }} foregroundStyle={PALETTE.white}>
          data.gov.sg
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
          {dashboard.twoHourArea.area} · {dashboard.twoHourArea.period}
        </Text>
      </VStack>
      <Spacer />
      <Image
        systemName="circle.hexagongrid.fill"
        resizable
        scaleToFit
        frame={{ width: 22, height: 22 }}
        foregroundStyle={PALETTE.purpleSoft}
      />
    </HStack>
  )
}

function StatChip(props: { label: string; value: string; tone?: string }) {
  return (
    <Card fill={PALETTE.cardStrong}>
      <Text font={{ size: 9, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
        {props.label}
      </Text>
      <Text font={{ size: 13, weight: "semibold" }} foregroundStyle={props.tone || PALETTE.white}>
        {props.value}
      </Text>
    </Card>
  )
}

function UvBars() {
  const max = Math.max(...dashboard.uvSeries.map((item) => item.value), 1)
  return (
    <HStack alignment="bottom" spacing={5}>
      {dashboard.uvSeries.slice(-8).map((item) => (
        <VStack alignment="center" spacing={4}>
          <RoundedRectangle
            fill={{
              type: "linearGradient",
              colors: [PALETTE.purpleBright, alpha(PALETTE.purpleBright, 0.24)],
              startPoint: { x: 0.5, y: 0 },
              endPoint: { x: 0.5, y: 1 },
            }}
            cornerRadius={999}
            frame={{ width: 10, height: 18 + Math.round((item.value / max) * 34) }}
          />
          <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha(PALETTE.white, 0.7)}>
            {item.hour}
          </Text>
        </VStack>
      ))}
    </HStack>
  )
}

function Pm25Bars() {
  const entries = Object.entries(dashboard.pm25)
  const max = Math.max(...entries.map(([, value]) => value), 1)
  return (
    <HStack alignment="bottom" spacing={8}>
      {entries.map(([region, value]) => (
        <VStack alignment="center" spacing={4}>
          <Text font={{ size: 10, weight: "semibold" }} foregroundStyle={pm25Tone(value)}>
            {value}
          </Text>
          <RoundedRectangle
            fill={pm25Tone(value)}
            cornerRadius={999}
            frame={{ width: 10, height: 14 + Math.round((value / max) * 28) }}
          />
          <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha(PALETTE.white, 0.72)}>
            {region.slice(0, 1).toUpperCase()}
          </Text>
        </VStack>
      ))}
    </HStack>
  )
}

function RainfallRows() {
  const max = Math.max(dashboard.rainfallMax, 1)
  const trackWidth = 104
  return (
    <VStack spacing={6}>
      {dashboard.rainfallTop.slice(0, 3).map((item) => (
        <HStack alignment="center" spacing={8}>
          <Text font={{ size: 10, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft} frame={{ width: 80 }}>
            {item.name}
          </Text>
          <ZStack frame={{ width: trackWidth, height: 8 }}>
            <RoundedRectangle fill={alpha(PALETTE.white, 0.08)} cornerRadius={999} frame={{ width: trackWidth, height: 8 }} />
            <RoundedRectangle
              fill={PALETTE.purpleBright}
              cornerRadius={999}
              frame={{ width: Math.max(18, Math.round((item.value / max) * trackWidth)), height: 8 }}
            />
          </ZStack>
          <Text font={{ size: 10, weight: "semibold" }} foregroundStyle={PALETTE.white}>
            {item.value.toFixed(1)}
          </Text>
        </HStack>
      ))}
    </VStack>
  )
}

function SmallView() {
  return (
    <VStack alignment="leading" spacing={10}>
      <Header />
      <HStack alignment="top">
        <VStack alignment="leading" spacing={1}>
          <Text font={{ size: 34, weight: "bold", design: "rounded" }} foregroundStyle={PALETTE.white}>
            {dashboard.currentTemp.toFixed(1)}°
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            {dashboard.twentyFour.general.forecast.text}
          </Text>
        </VStack>
        <Spacer />
        <Image
          systemName={forecastSymbol(dashboard.twoHourArea.forecast)}
          resizable
          scaleToFit
          frame={{ width: 28, height: 28 }}
          foregroundStyle={PALETTE.white}
        />
      </HStack>
      <HStack spacing={8}>
        <StatChip label="UV" value={String(dashboard.uvNow)} tone={PALETTE.warning} />
        <StatChip label="Score" value={String(dashboard.outdoorScore)} tone={PALETTE.success} />
        <StatChip label="PM2.5" value={String(dashboard.pm25Max)} tone={pm25Tone(dashboard.pm25Max)} />
      </HStack>
      <Card title="2h">
        <Text font={{ size: 12, weight: "semibold" }} foregroundStyle={PALETTE.white}>
          {dashboard.twoHourArea.forecast}
        </Text>
      </Card>
    </VStack>
  )
}

function MediumView() {
  return (
    <VStack alignment="leading" spacing={10}>
      <Header />
      <HStack alignment="top" spacing={12}>
        <VStack alignment="leading" spacing={4}>
          <Text font={{ size: 38, weight: "bold", design: "rounded" }} foregroundStyle={PALETTE.white}>
            {dashboard.currentTemp.toFixed(1)}°
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            {dashboard.tempLow.toFixed(1)} / {dashboard.tempHigh.toFixed(1)}° across stations
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            {dashboard.twoHourArea.area}: {dashboard.twoHourArea.forecast}
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            Humidity {dashboard.humidityLow}-{dashboard.humidityHigh}%
          </Text>
        </VStack>
        <Spacer />
        <Card title="Outdoor">
          <Text font={{ size: 24, weight: "bold", design: "rounded" }} foregroundStyle={PALETTE.success}>
            {dashboard.outdoorScore}
          </Text>
        </Card>
      </HStack>
      <HStack spacing={10}>
        <StatChip label="PM2.5 Max" value={String(dashboard.pm25Max)} tone={pm25Tone(dashboard.pm25Max)} />
        <StatChip label="Rain Max" value={`${dashboard.rainfallMax.toFixed(1)} mm`} tone={PALETTE.purpleSoft} />
      </HStack>
      <HStack spacing={10}>
        <Card title="UV Trend">
          <UvBars />
        </Card>
        <Card title="PM2.5">
          <Pm25Bars />
        </Card>
      </HStack>
    </VStack>
  )
}

function LargeView() {
  return (
    <VStack alignment="leading" spacing={10}>
      <Header />
      <HStack alignment="top" spacing={10}>
        <Card title="Now">
          <Text font={{ size: 40, weight: "bold", design: "rounded" }} foregroundStyle={PALETTE.white}>
            {dashboard.currentTemp.toFixed(1)}°
          </Text>
          <Text font={{ size: 12, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            {dashboard.twentyFour.general.forecast.text}
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            UV {dashboard.uvNow} · Outdoor {dashboard.outdoorScore}
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
            Humidity {dashboard.humidityLow}-{dashboard.humidityHigh}% · PM2.5 max {dashboard.pm25Max}
          </Text>
        </Card>
        <Card title="24h">
          <Text font={{ size: 13, weight: "semibold" }} foregroundStyle={PALETTE.white}>
            {dashboard.twentyFour.general.validPeriod.text}
          </Text>
          {dashboard.twentyFour.periods.slice(0, 3).map((period: any) => (
            <Text font={{ size: 10, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
              {period.timePeriod.text}: {period.regions.central.text}
            </Text>
          ))}
        </Card>
      </HStack>
      <HStack spacing={10}>
        <Card title="UV Trend">
          <UvBars />
        </Card>
        <Card title="Rain Hotspots">
          <RainfallRows />
        </Card>
      </HStack>
      <Card title="4-Day Outlook">
        <HStack spacing={8}>
          {dashboard.fourDay.map((day: any) => (
            <VStack alignment="center" spacing={4}>
              <Text font={{ size: 10, weight: "semibold" }} foregroundStyle={PALETTE.whiteSoft}>
                {day.day.slice(0, 3)}
              </Text>
              <Image
                systemName={forecastSymbol(day.forecast.text)}
                resizable
                scaleToFit
                frame={{ width: 15, height: 15 }}
                foregroundStyle={PALETTE.white}
              />
              <Text font={{ size: 11, weight: "semibold" }} foregroundStyle={PALETTE.white}>
                {day.temperature.high}°
              </Text>
              <Text font={{ size: 10, weight: "medium" }} foregroundStyle={PALETTE.whiteSoft}>
                {day.temperature.low}°
              </Text>
            </VStack>
          ))}
        </HStack>
      </Card>
    </VStack>
  )
}

function WidgetView() {
  return (
    <EnvironmentValuesReader keys={["widgetRenderingMode", "showsWidgetContainerBackground"]}>
      {(env) => {
        const fullColor = env.widgetRenderingMode === "fullColor"
        const bg = {
          type: "linearGradient",
          colors: fullColor
            ? ["#120B33", "#2B1B73", "#4D3DD8"]
            : ["#17112E", "#2B2451", "#4D3DD8"],
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 1 },
        }

        return (
          <ZStack padding={18} background={bg}>
            <RoundedRectangle
              fill={alpha("#FFFFFF", env.showsWidgetContainerBackground ? 0.07 : 0.12)}
              cornerRadius={30}
            />
            <VStack spacing={0}>
              {Widget.family === "systemSmall"
                ? <SmallView />
                : Widget.family === "systemLarge"
                  ? <LargeView />
                  : <MediumView />}
              <Spacer />
              <Text font={{ size: 10, weight: "medium" }} foregroundStyle={alpha(PALETTE.white, 0.66)}>
                Updated {dashboard.updatedAt.slice(11, 16)}
              </Text>
            </VStack>
          </ZStack>
        )
      }}
    </EnvironmentValuesReader>
  )
}

Widget.present(<WidgetView />, {
  reloadPolicy: {
    policy: "after",
    date: new Date(Date.now() + 1000 * 60 * 15),
  },
})

Script.exit()
