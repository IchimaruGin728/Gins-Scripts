import {
  EnvironmentValuesReader,
  Gauge,
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
import {
  COLOR_MAP,
  type CountdownItem,
  heatmapPalette,
  itemState,
  loadHeatmapColor,
  loadItems,
  loadTheme,
  palette,
  randomHeatColor,
} from "./shared"

const items = loadItems()
const mode = loadTheme()
const theme = palette(mode)
const heatmapKey = loadHeatmapColor()

function IconView({ item, size = 16, color = theme.title }: { item: CountdownItem; size?: number; color?: string }) {
  if (item.iconType === "txt") {
    return (
      <Text font={{ size, weight: "medium" }} foregroundStyle={color}>
        {item.icon}
      </Text>
    )
  }
  return (
    <Image
      systemName={item.icon || "star.fill"}
      resizable
      scaleToFit
      frame={{ width: size, height: size }}
      foregroundStyle={color}
    />
  )
}

function Ring({ item, size }: { item: CountdownItem; size: number }) {
  const state = itemState(item)
  const color = COLOR_MAP[item.colorKey] || theme.accent
  const label = state.diff === 0 ? "今" : String(state.diff)
  return (
    <Gauge
      value={state.progress}
      min={0}
      max={1}
      label={<Text>{item.name}</Text>}
      currentValueLabel={
        <Text font={{ size: label.length > 2 ? size * 0.22 : size * 0.28, weight: "bold", design: "rounded" }}>
          {label}
        </Text>
      }
      gaugeStyle="accessoryCircularCapacity"
      tint={color}
      frame={{ width: size, height: size }}
    />
  )
}

function LinearBar({ item, width = 120, height = 6 }: { item: CountdownItem; width?: number; height?: number }) {
  const state = itemState(item)
  const color = COLOR_MAP[item.colorKey] || theme.accent
  return (
    <ZStack alignment="leading" frame={{ width, height }}>
      <RoundedRectangle fill={theme.base} cornerRadius={height / 2} frame={{ width, height }} />
      <RoundedRectangle
        fill={color}
        cornerRadius={height / 2}
        frame={{ width: Math.max(6, width * state.progress), height }}
      />
    </ZStack>
  )
}

function Heatmap({ cols = 12, rows = 3, cell = 6 }: { cols?: number; rows?: number; cell?: number }) {
  const colors = heatmapPalette(mode, heatmapKey)
  return (
    <VStack spacing={2}>
      {Array.from({ length: rows }).map((_, row) => (
        <HStack spacing={2}>
          {Array.from({ length: cols }).map((__, col) => (
            <RoundedRectangle
              fill={randomHeatColor(colors, theme.heatBase)}
              cornerRadius={2}
              frame={{ width: cell, height: cell }}
              opacity={col + row >= 0 ? 1 : 1}
            />
          ))}
        </HStack>
      ))}
    </VStack>
  )
}

function Card({ children, height = 64 }: { children: JSX.Element | JSX.Element[]; height?: number }) {
  return (
    <ZStack frame={{ height }}>
      <RoundedRectangle fill={theme.card} cornerRadius={10} />
      <HStack alignment="center" spacing={8} padding={{ top: 7, leading: 9, bottom: 7, trailing: 9 }}>
        {children}
      </HStack>
    </ZStack>
  )
}

function ListItem({ item, compact = false }: { item: CountdownItem; compact?: boolean }) {
  const state = itemState(item)
  const color = COLOR_MAP[item.colorKey] || theme.accent
  return (
    <Card height={compact ? 56 : 64}>
      <RoundedRectangle fill={color} cornerRadius={999} frame={{ width: 4, height: compact ? 42 : 50 }} />
      <VStack alignment="leading" spacing={2}>
        <HStack spacing={4}>
          <Text
            font={{ size: compact ? 11 : 12, weight: "bold" }}
            foregroundStyle={state.isUrgent ? theme.warning : theme.title}
            lineLimit={1}
          >
            {item.name}
          </Text>
          <IconView item={item} size={compact ? 10 : 12} color={theme.date} />
        </HStack>
        <Text font={{ size: 9, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
          {state.displayDate}
        </Text>
        <Text font={{ size: compact ? 13 : 15, weight: "bold", design: "rounded" }} foregroundStyle={theme.text}>
          {state.diff} Days left
        </Text>
        {!compact ? <LinearBar item={item} width={112} height={4} /> : null}
      </VStack>
    </Card>
  )
}

function EmptyCell() {
  return (
    <Card>
      <VStack alignment="leading" spacing={6}>
        <Heatmap cols={9} rows={3} cell={5} />
        <Text font={{ size: 10, weight: "medium" }} foregroundStyle={theme.date}>
          添加项目
        </Text>
      </VStack>
      <Spacer />
      <Image systemName="plus.circle" resizable scaleToFit frame={{ width: 28, height: 28 }} foregroundStyle={theme.date} />
    </Card>
  )
}

function SmallOne({ item }: { item: CountdownItem }) {
  const state = itemState(item)
  const color = COLOR_MAP[item.colorKey] || theme.accent
  return (
    <VStack alignment="leading" spacing={8}>
      <Ring item={item} size={46} />
      <Text font={{ size: 18, weight: "bold" }} foregroundStyle={state.isUrgent ? theme.warning : theme.title} lineLimit={1}>
        {item.name}
      </Text>
      <Text font={{ size: 11, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
        {state.displayDate}
      </Text>
      <Spacer />
      <HStack spacing={8}>
        <IconView item={item} size={20} color={color} />
        <Text font={{ size: 34, weight: "bold", design: "rounded" }} foregroundStyle={color}>
          {state.diff}
        </Text>
        <VStack alignment="leading" spacing={0}>
          <Text font={{ size: 12, weight: "bold" }} foregroundStyle={theme.date}>
            days
          </Text>
          <Text font={{ size: 12, weight: "bold" }} foregroundStyle={theme.date}>
            left
          </Text>
        </VStack>
      </HStack>
    </VStack>
  )
}

function SmallLayout() {
  if (items.length === 1) return <SmallOne item={items[0]} />
  if (items.length === 2) {
    return (
      <VStack spacing={8}>
        <ListItem item={items[0]} compact />
        <ListItem item={items[1]} compact />
      </VStack>
    )
  }
  return <StandardGrid limit={4} cols={1} />
}

function MediumOne({ item }: { item: CountdownItem }) {
  const state = itemState(item)
  const color = COLOR_MAP[item.colorKey] || theme.accent
  return (
    <HStack alignment="center" spacing={14}>
      <Ring item={item} size={58} />
      <VStack alignment="leading" spacing={6}>
        <Text font={{ size: 18, weight: "bold" }} foregroundStyle={state.isUrgent ? theme.warning : theme.title} lineLimit={1}>
          {item.name}
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
          {state.displayDate}
        </Text>
        <HStack spacing={6}>
          <IconView item={item} size={16} color={color} />
          <Text font={{ size: 28, weight: "bold", design: "rounded" }} foregroundStyle={theme.text}>
            {state.diff}
          </Text>
          <Text font={{ size: 12, weight: "medium" }} foregroundStyle={theme.date}>
            days left
          </Text>
        </HStack>
      </VStack>
      <Spacer />
      <Heatmap cols={10} rows={7} cell={8} />
    </HStack>
  )
}

function MediumTwo() {
  return (
    <HStack alignment="center" spacing={14}>
      <VStack alignment="leading" spacing={8}>
        <Ring item={items[0]} size={56} />
        <Text font={{ size: 16, weight: "bold" }} foregroundStyle={theme.title} lineLimit={1}>
          {items[0].name}
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
          {itemState(items[0]).displayDate}
        </Text>
        <Text font={{ size: 22, weight: "bold", design: "rounded" }} foregroundStyle={COLOR_MAP[items[0].colorKey]}>
          {itemState(items[0]).diff} days left
        </Text>
      </VStack>
      <Spacer />
      <VStack alignment="leading" spacing={8}>
        <HStack spacing={6}>
          <Text font={{ size: 16, weight: "bold" }} foregroundStyle={theme.title} lineLimit={1}>
            {items[1].name}
          </Text>
          <IconView item={items[1]} size={16} color={COLOR_MAP[items[1].colorKey]} />
        </HStack>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
          {itemState(items[1]).displayDate}
        </Text>
        <Text font={{ size: 22, weight: "bold", design: "rounded" }} foregroundStyle={theme.text}>
          {itemState(items[1]).diff} Days left
        </Text>
        <LinearBar item={items[1]} width={136} height={8} />
      </VStack>
    </HStack>
  )
}

function MediumThree() {
  return (
    <HStack alignment="center" spacing={14}>
      <Ring item={items[0]} size={68} />
      <VStack alignment="leading" spacing={5}>
        <Text font={{ size: 17, weight: "bold" }} foregroundStyle={theme.title} lineLimit={1}>
          {items[0].name}
        </Text>
        <Text font={{ size: 11, weight: "medium" }} foregroundStyle={theme.date} lineLimit={1}>
          {itemState(items[0]).displayDate}
        </Text>
        <Text font={{ size: 23, weight: "bold", design: "rounded" }} foregroundStyle={theme.text}>
          {itemState(items[0]).diff} Days left
        </Text>
      </VStack>
      <Spacer />
      <VStack spacing={8}>
        <ListItem item={items[1]} compact />
        <ListItem item={items[2]} compact />
      </VStack>
    </HStack>
  )
}

function StandardGrid({ limit, cols }: { limit: number; cols: number }) {
  const visible = Array.from({ length: limit }).map((_, index) => items[index])
  const rows = Math.ceil(limit / cols)
  return (
    <VStack spacing={8}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <HStack spacing={8}>
          {Array.from({ length: cols }).map((__, colIndex) => {
            const item = visible[rowIndex * cols + colIndex]
            return item ? <ListItem item={item} compact={Widget.family !== "systemLarge"} /> : <EmptyCell />
          })}
        </HStack>
      ))}
    </VStack>
  )
}

function MediumLayout() {
  if (items.length === 1) return <MediumOne item={items[0]} />
  if (items.length === 2) return <MediumTwo />
  if (items.length === 3) return <MediumThree />
  return <StandardGrid limit={4} cols={2} />
}

function LargeLayout() {
  return <StandardGrid limit={8} cols={2} />
}

function CountdownWidget() {
  return (
    <EnvironmentValuesReader keys={["widgetRenderingMode", "showsWidgetContainerBackground"]}>
      {() => {
        const content =
          Widget.family === "systemSmall" ? <SmallLayout /> : Widget.family === "systemLarge" ? <LargeLayout /> : <MediumLayout />
        return (
          <ZStack padding={Widget.family === "systemSmall" ? 14 : 16} background={theme.bg}>
            <VStack spacing={0}>
              {content}
              <Spacer />
            </VStack>
          </ZStack>
        )
      }}
    </EnvironmentValuesReader>
  )
}

Widget.present(<CountdownWidget />, {
  reloadPolicy: {
    policy: "after",
    date: new Date(Date.now() + 1000 * 60 * 10),
  },
})

Script.exit()
