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
import { alpha, chartData, loadWeather, readSettings, speedUnit, symbolFor, unitText } from "./shared"

const settings = readSettings(Widget.parameter)
const weather = await loadWeather(settings)
const series = chartData(weather.hourly, Widget.family === "systemLarge" ? 10 : 6)

function GlassCard(props: { children: JSX.Element | JSX.Element[]; fill?: string }) {
  return (
    <ZStack>
      <RoundedRectangle
        fill={props.fill || "rgba(255,255,255,0.08)"}
        cornerRadius={16}
      />
      <VStack padding={10} spacing={4}>
        {props.children}
      </VStack>
    </ZStack>
  )
}

function HourlyTrend() {
  return (
    <HStack spacing={8}>
      {series.map((item) => {
        const max = Math.max(...series.map((entry) => entry.temp), 1)
        const ratio = Math.max(0.25, item.temp / max)
        return (
          <VStack spacing={4}>
            <Text font={{ size: 9, weight: "semibold" }} foregroundStyle="#F8FBFF">
              {item.temp}°
            </Text>
            <RoundedRectangle
              fill={{
                type: "linearGradient",
                colors: [alpha("#8ED8FF", 0.96), alpha("#8ED8FF", 0.24)],
                startPoint: { x: 0.5, y: 0 },
                endPoint: { x: 0.5, y: 1 },
              }}
              cornerRadius={999}
              frame={{ width: 10, height: 24 + Math.round(34 * ratio) }}
            />
            <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.84)}>
              {item.label}
            </Text>
          </VStack>
        )
      })}
    </HStack>
  )
}

function Header() {
  return (
    <HStack alignment="center">
      <VStack alignment="leading" spacing={2}>
        <Text font={{ size: 14, weight: "semibold" }} foregroundStyle="#F8FBFF">
          {settings.weatherName}
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.92)}>
          {weather.now.text}
        </Text>
      </VStack>
      <Spacer />
      <Image
        systemName={symbolFor(weather.now.icon)}
        resizable
        scaleToFit
        frame={{ width: 26, height: 26 }}
        foregroundStyle="#FFFFFF"
      />
    </HStack>
  )
}

function SmallLayout() {
  return (
    <VStack alignment="leading" spacing={8}>
      <Header />
      <VStack alignment="leading" spacing={2}>
        <Text font={{ size: 34, weight: "bold", design: "rounded" }} foregroundStyle="#FFFFFF">
          {weather.now.temp}{unitText(settings.unit)}
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.92)}>
          体感 {weather.now.feelsLike}{unitText(settings.unit)}
        </Text>
      </VStack>
      <Spacer />
      <HStack spacing={8}>
        <GlassCard>
          <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.84)}>
            湿度
          </Text>
          <Text font={{ size: 12, weight: "semibold" }} foregroundStyle="#FFFFFF">
            {weather.now.humidity}%
          </Text>
        </GlassCard>
        <GlassCard fill="rgba(255,210,122,0.12)">
          <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha("#FFE3B0", 0.92)}>
            风速
          </Text>
          <Text font={{ size: 12, weight: "semibold" }} foregroundStyle="#FFD27A">
            {weather.now.windSpeed} {speedUnit(settings.unit)}
          </Text>
        </GlassCard>
      </HStack>
    </VStack>
  )
}

function MediumLayout() {
  return (
    <VStack alignment="leading" spacing={10}>
      <Header />
      <HStack alignment="top" spacing={14}>
        <VStack alignment="leading" spacing={6}>
          <Text font={{ size: 38, weight: "bold", design: "rounded" }} foregroundStyle="#FFFFFF">
            {weather.now.temp}{unitText(settings.unit)}
          </Text>
          <Text font={{ size: 11, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.92)}>
            {weather.daily[0].tempMin} / {weather.daily[0].tempMax}{unitText(settings.unit)} · {weather.now.windDir}
          </Text>
          <HStack spacing={8}>
            <GlassCard>
              <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.84)}>
                降水
              </Text>
              <Text font={{ size: 12, weight: "semibold" }} foregroundStyle="#FFFFFF">
                {weather.now.precip} mm
              </Text>
            </GlassCard>
            <GlassCard fill="rgba(255,210,122,0.12)">
              <Text font={{ size: 9, weight: "medium" }} foregroundStyle={alpha("#FFE3B0", 0.92)}>
                气压
              </Text>
              <Text font={{ size: 12, weight: "semibold" }} foregroundStyle="#FFD27A">
                {weather.now.pressure}
              </Text>
            </GlassCard>
          </HStack>
        </VStack>
        <Spacer />
      </HStack>
      <HourlyTrend />
    </VStack>
  )
}

function LargeLayout() {
  return (
    <VStack alignment="leading" spacing={10}>
      <Header />
      <HStack alignment="center">
        <VStack alignment="leading" spacing={3}>
          <Text font={{ size: 42, weight: "bold", design: "rounded" }} foregroundStyle="#FFFFFF">
            {weather.now.temp}{unitText(settings.unit)}
          </Text>
          <Text font={{ size: 12, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.92)}>
            体感 {weather.now.feelsLike}{unitText(settings.unit)} · {weather.now.windDir} {weather.now.windSpeed} {speedUnit(settings.unit)}
          </Text>
        </VStack>
        <Spacer />
        <Image
          systemName={symbolFor(weather.now.icon)}
          resizable
          scaleToFit
          frame={{ width: 60, height: 60 }}
          foregroundStyle="#FFFFFF"
        />
      </HStack>
      <HourlyTrend />
      <Text font={{ size: 12, weight: "semibold" }} foregroundStyle="#F8FBFF">
        三日趋势
      </Text>
      <HStack spacing={8}>
        {weather.daily.slice(0, 3).map((day) => (
          <GlassCard>
            <Text font={{ size: 10, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.84)}>
              {new Date(day.fxDate).getMonth() + 1}/{new Date(day.fxDate).getDate()}
            </Text>
            <Image
              systemName={symbolFor(day.iconDay)}
              resizable
              scaleToFit
              frame={{ width: 16, height: 16 }}
              foregroundStyle="#FFFFFF"
            />
            <Text font={{ size: 11, weight: "semibold" }} foregroundStyle="#FFFFFF">
              {day.textDay}
            </Text>
            <Text font={{ size: 10, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.9)}>
              {day.tempMin} / {day.tempMax}{unitText(settings.unit)}
            </Text>
          </GlassCard>
        ))}
      </HStack>
    </VStack>
  )
}

function WeatherWidget() {
  return (
    <EnvironmentValuesReader keys={["widgetRenderingMode", "showsWidgetContainerBackground"]}>
      {(env) => {
        const colorful = env.widgetRenderingMode === "fullColor"
        const showBackground = env.showsWidgetContainerBackground
        const topColor = colorful ? "#081226" : "#101722"
        const bottomColor = colorful ? "#1B4F83" : "#24364A"
        const cardOpacity = showBackground ? 0.08 : 0.14
        const background = {
          type: "linearGradient",
          colors: [topColor, bottomColor],
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 1, y: 1 },
        }

        const content =
          Widget.family === "systemSmall"
            ? <SmallLayout />
            : Widget.family === "systemLarge"
              ? <LargeLayout />
              : <MediumLayout />

        return (
          <ZStack
            padding={18}
            background={background}
          >
            <RoundedRectangle
              fill={alpha("#FFFFFF", cardOpacity)}
              cornerRadius={28}
            />
            <VStack spacing={0}>
              {content}
              <Spacer />
              <Text font={{ size: 10, weight: "medium" }} foregroundStyle={alpha("#D9EBFF", 0.72)}>
                观测 {weather.now.obsTime.slice(11, 16)} · QWeather
              </Text>
            </VStack>
          </ZStack>
        )
      }}
    </EnvironmentValuesReader>
  )
}

Widget.present(<WeatherWidget />, {
  reloadPolicy: {
    policy: "after",
    date: new Date(Date.now() + 1000 * 60 * 30),
  },
})

Script.exit()
