// Live Activity for DNS Benchmark — Dynamic Island + Lock Screen
import {
  LiveActivity, LiveActivityUI, LiveActivityUIBuilder,
  LiveActivityUIExpandedCenter, LiveActivityUIExpandedLeading,
  LiveActivityUIExpandedTrailing, LiveActivityUIExpandedBottom,
  HStack, VStack, Text, Image, Spacer, ProgressView, Gauge,
} from "scripting"

export type DNSBenchState = {
  progress: number        // 0..total
  total: number           // e.g. 20 servers
  status: "idle" | "testing" | "done" | "error"
  currentServer: string   // e.g. "Cloudflare"
  fastest: string         // e.g. "Google"
  fastestMs: number       // e.g. 12
  top3: Array<{ name: string; ms: number }>  // top 3 results
}

function CompactProgressRing({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? progress / total : 0
  return (
    <HStack spacing={3}>
      <Text font="caption2" foregroundStyle="white" fontWeight="bold">{progress}</Text>
      <Text font="caption2" foregroundStyle={{ light: "#999", dark: "#777" }}>/{total}</Text>
    </HStack>
  )
}

function TopResultBadge({ name, ms }: { name: string; ms: number }) {
  const color = ms < 20 ? "#34C759" : ms < 50 ? "#30D158" : ms < 100 ? "#FF9F0A" : "#FF453A"
  return (
    <HStack spacing={4}>
      <Image systemName="bolt.fill" foregroundStyle={color} frame={{ width: 10, height: 10 }} />
      <Text font="caption2" foregroundStyle="white" fontWeight="semibold">{name}</Text>
      <Text font="caption2" foregroundStyle={color} fontWeight="bold">{ms}ms</Text>
    </HStack>
  )
}

function ExpandedProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? progress / total : 0
  return (
    <VStack spacing={4}>
      <HStack>
        <Text font="caption" foregroundStyle={{ light: "#999", dark: "#777" }}>
          {progress === total ? "✅ Complete" : `📡 Testing…`}
        </Text>
        <Spacer />
        <Text font="caption" foregroundStyle="white" fontWeight="bold">
          {Math.round(pct * 100)}%
        </Text>
      </HStack>
      {/* Custom progress bar using Gauge */}
      <Gauge
        value={pct}
        min={0}
        max={1}
        label={<Text> </Text>}
        currentValueLabel={<Text> </Text>}
        minValueLabel={<Text> </Text>}
        maxValueLabel={<Text> </Text>}
      />
    </VStack>
  )
}

const builder: LiveActivityUIBuilder<DNSBenchState> = (state) => {
  const { progress, total, status, currentServer, fastest, fastestMs, top3 } = state
  const isDone = status === "done"
  const isError = status === "error"
  const pct = total > 0 ? progress / total : 0

  return (
    <LiveActivityUI
      /* ── Lock Screen (content) ── */
      content={
        <VStack spacing={8} activityBackgroundTint={{ light: "#1C1C1E", dark: "#1C1C1E" }}>
          <HStack>
            <Image systemName="speedometer" foregroundStyle="#FF9F0A" frame={{ width: 18, height: 18 }} />
            <Text font="headline" foregroundStyle="white"> DNS Benchmark</Text>
            <Spacer />
            <Text font="caption" foregroundStyle={{ light: "#999", dark: "#777" }}>
              {isDone ? "Done" : isError ? "Error" : `${progress}/${total}`}
            </Text>
          </HStack>
          
          <ExpandedProgressBar progress={progress} total={total} />
          
          {currentServer && !isDone ? (
            <HStack>
              <Image systemName="antenna.radiowaves.left.and.right" foregroundStyle="#0A84FF" frame={{ width: 12, height: 12 }} />
              <Text font="caption" foregroundStyle={{ light: "#BBB", dark: "#999" }}>
                {"  "}{currentServer}
              </Text>
            </HStack>
          ) : null}
          
          {fastestMs > 0 && (
            <HStack>
              <Image systemName="bolt.fill" foregroundStyle="#FFD60A" frame={{ width: 14, height: 14 }} />
              <Text font="subheadline" foregroundStyle="white"> Fastest: </Text>
              <Text font="subheadline" foregroundStyle="#34C759" fontWeight="bold">{fastest}</Text>
              <Text font="subheadline" foregroundStyle="#FFD60A" fontWeight="bold"> {fastestMs}ms</Text>
            </HStack>
          )}
          
          {top3.length > 0 && isDone && (
            <VStack spacing={4}>
              {top3.map((r, i) => (
                <HStack key={i} spacing={6}>
                  <Text font="caption" foregroundStyle={i === 0 ? "#FFD60A" : i === 1 ? "#C0C0C0" : "#CD7F32"}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </Text>
                  <Text font="caption" foregroundStyle="white">{r.name}</Text>
                  <Spacer />
                  <Text font="caption" foregroundStyle="#34C759" fontWeight="bold">{r.ms}ms</Text>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      }

      /* ── Dynamic Island Compact Leading ── */
      compactLeading={
        <HStack spacing={2}>
          {isDone ? (
            <Image systemName="checkmark.circle.fill" foregroundStyle="#34C759" frame={{ width: 16, height: 16 }} />
          ) : isError ? (
            <Image systemName="xmark.circle.fill" foregroundStyle="#FF453A" frame={{ width: 16, height: 16 }} />
          ) : (
            <Image systemName="speedometer" foregroundStyle="#FF9F0A" frame={{ width: 16, height: 16 }} />
          )}
          <CompactProgressRing progress={progress} total={total} />
        </HStack>
      }

      /* ── Dynamic Island Compact Trailing ── */
      compactTrailing={
        fastestMs > 0 ? (
          <HStack spacing={2}>
            <Image systemName="bolt.fill" foregroundStyle="#FFD60A" frame={{ width: 10, height: 10 }} />
            <Text font="caption2" foregroundStyle="#34C759" fontWeight="bold">{fastestMs}</Text>
          </HStack>
        ) : (
          <Image systemName="antenna.radiowaves.left.and.right" foregroundStyle="#0A84FF" frame={{ width: 16, height: 16 }} />
        )
      }

      /* ── Dynamic Island Minimal (smallest pill) ── */
      minimal={
        isDone ? (
          <Image systemName="checkmark.circle.fill" foregroundStyle="#34C759" frame={{ width: 16, height: 16 }} />
        ) : (
          <Image systemName="speedometer" foregroundStyle="#FF9F0A" frame={{ width: 16, height: 16 }} />
        )
      }
    >
      {/* ── Dynamic Island Expanded ── */}
      <LiveActivityUIExpandedLeading>
        <VStack alignment="center" spacing={2}>
          {isDone ? (
            <Image systemName="checkmark.circle.fill" foregroundStyle="#34C759" frame={{ width: 28, height: 28 }} />
          ) : (
            <Image systemName="speedometer" foregroundStyle="#FF9F0A" frame={{ width: 28, height: 28 }} />
          )}
          <Text font="caption2" foregroundStyle={{ light: "#999", dark: "#777" }}>
            {isDone ? "Done" : `${Math.round(pct * 100)}%`}
          </Text>
        </VStack>
      </LiveActivityUIExpandedLeading>

      <LiveActivityUIExpandedCenter>
        <VStack spacing={6}>
          <Text font="headline" foregroundStyle="white">DNS Benchmark</Text>
          
          {!isDone && currentServer ? (
            <HStack spacing={4}>
              <Image systemName="antenna.radiowaves.left.and.right" foregroundStyle="#0A84FF" frame={{ width: 12, height: 12 }} />
              <Text font="subheadline" foregroundStyle={{ light: "#CCC", dark: "#999" }}>{currentServer}</Text>
            </HStack>
          ) : null}
          
          {fastestMs > 0 && (
            <TopResultBadge name={fastest} ms={fastestMs} />
          )}
        </VStack>
      </LiveActivityUIExpandedCenter>

      <LiveActivityUIExpandedTrailing>
        <VStack alignment="center" spacing={2}>
          <Text font="title" foregroundStyle="white" fontWeight="bold">{progress}</Text>
          <Text font="caption2" foregroundStyle={{ light: "#999", dark: "#777" }}>of {total}</Text>
        </VStack>
      </LiveActivityUIExpandedTrailing>

      <LiveActivityUIExpandedBottom>
        <VStack spacing={6}>
          <ExpandedProgressBar progress={progress} total={total} />
          
          {top3.length > 0 && (
            <HStack spacing={12}>
              {top3.map((r, i) => (
                <HStack key={i} spacing={4}>
                  <Text font="caption2" foregroundStyle={i === 0 ? "#FFD60A" : i === 1 ? "#C0C0C0" : "#CD7F32"}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </Text>
                  <Text font="caption2" foregroundStyle="white" fontWeight="semibold">{r.name.substring(0, 10)}</Text>
                  <Text font="caption2" foregroundStyle="#34C759" fontWeight="bold">{r.ms}ms</Text>
                </HStack>
              ))}
            </HStack>
          )}
        </VStack>
      </LiveActivityUIExpandedBottom>
    </LiveActivityUI>
  )
}

export const DNSBenchLiveActivity = LiveActivity.register("DNSBenchLiveActivity", builder)
