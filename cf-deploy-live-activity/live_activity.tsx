/** @jsxRuntime classic */
// CF Deploy Live Activity — Dynamic Island UI
// 灵动岛同时显示 Pages 构建进度 + Workers 部署状态

type PagesStatus  = "idle" | "queued" | "active" | "success" | "failure" | "canceled"
type WorkerStatus = "idle" | "deploying" | "active" | "failed"

interface PagesState {
  status: PagesStatus
  branch: string
  commitMessage: string
  environment: string
  startedAt: string
  completedAt?: string
  buildDurationMs?: number
  url?: string
}

interface WorkerState {
  status: WorkerStatus
  scriptTag: string
  deployedAt: string
  routes: number
}

interface DeployState {
  pages: PagesState
  worker: WorkerState
  pagesProject: string   // 静态，合并进 state
  workerName: string     // 静态，合并进 state
}

// ---- 样式工具 ----

function pagesColor(s: PagesStatus): string {
  switch (s) {
    case "success":  return "#22C55E"
    case "failure":  return "#EF4444"
    case "canceled": return "#F59E0B"
    case "active":   return "#3B82F6"
    case "queued":   return "#8B5CF6"
    default:         return "#555555"
  }
}

function pagesIcon(s: PagesStatus): string {
  switch (s) {
    case "success":  return "✓"
    case "failure":  return "✕"
    case "canceled": return "⊘"
    case "active":   return "▶"
    case "queued":   return "…"
    default:         return "○"
  }
}

function pagesLabel(s: PagesStatus): string {
  switch (s) {
    case "success":  return "已上线"
    case "failure":  return "失败"
    case "canceled": return "取消"
    case "active":   return "构建中"
    case "queued":   return "排队"
    default:         return "空闲"
  }
}

function workerColor(s: WorkerStatus): string {
  switch (s) {
    case "active":    return "#22C55E"
    case "deploying": return "#F59E0B"
    case "failed":    return "#EF4444"
    default:          return "#555555"
  }
}

function workerIcon(s: WorkerStatus): string {
  switch (s) {
    case "active":    return "✓"
    case "deploying": return "↑"
    case "failed":    return "✕"
    default:          return "○"
  }
}

function workerLabel(s: WorkerStatus): string {
  switch (s) {
    case "active":    return "运行中"
    case "deploying": return "部署中"
    case "failed":    return "失败"
    default:          return "空闲"
  }
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function timeAgo(iso: string): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "刚刚"
  if (m < 60) return `${m}m 前`
  return `${Math.floor(m / 60)}h 前`
}

export const CFDeployLiveActivity = LiveActivity.register(
  "cf-deploy",
  (state: DeployState) => {
    const { pages, worker } = state
    const pagesBuilding = pages.status === "active" || pages.status === "queued"
    const anyBusy = pagesBuilding || worker.status === "deploying"

    const elapsed  = Date.now() - new Date(pages.startedAt).getTime()
    const mins     = Math.floor(elapsed / 60000)
    const secs     = Math.floor((elapsed % 60000) / 1000)
    const progress = Math.min(Math.round(elapsed / (3 * 60 * 1000) * 100), 95)

    return (
      <LiveActivityUI
        compactLeading={
          <HStack spacing={4} padding={{ left: 6, right: 2 }}>
            <Text font={{ name: "system", size: 12 }} color={pagesColor(pages.status)} fontWeight="bold">
              {pagesIcon(pages.status)}
            </Text>
            <Text font={{ name: "system", size: 10 }} color="#F6821F" fontWeight="semibold">
              Pages
            </Text>
          </HStack>
        }
        compactTrailing={
          <HStack spacing={4} padding={{ left: 2, right: 6 }}>
            <Text font={{ name: "system", size: 10 }} color={workerColor(worker.status)} fontWeight="bold">
              {workerIcon(worker.status)}
            </Text>
            <Text font={{ name: "system", size: 10 }} color="#8B5CF6" fontWeight="semibold">
              Worker
            </Text>
          </HStack>
        }
        minimal={
          <Text font={{ name: "system", size: 12 }} color={anyBusy ? "#F59E0B" : "#22C55E"} fontWeight="bold">
            {anyBusy ? "↑" : "✓"}
          </Text>
        }
        content={
          <HStack spacing={0} padding={12}>
            <HStack spacing={8}>
              <Text font={{ name: "system", size: 18 }} color={pagesColor(pages.status)}>
                {pagesIcon(pages.status)}
              </Text>
              <VStack spacing={2}>
                <HStack spacing={4}>
                  <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="bold">Pages</Text>
                  <Text font={{ name: "system", size: 11 }} color={pagesColor(pages.status)}>
                    {pagesLabel(pages.status)}
                  </Text>
                </HStack>
                <Text font={{ name: "monospaced", size: 10 }} color="#888888">
                  ⎇ {pages.branch}
                </Text>
              </VStack>
            </HStack>
            <Spacer />
            <Rectangle width={1} height={32} background={{ light: "#e5e7eb", dark: "#2a2d3a" }} />
            <Spacer />
            <HStack spacing={8}>
              <Text font={{ name: "system", size: 18 }} color={workerColor(worker.status)}>
                {workerIcon(worker.status)}
              </Text>
              <VStack spacing={2}>
                <HStack spacing={4}>
                  <Text font={{ name: "system", size: 11 }} color="#8B5CF6" fontWeight="bold">Worker</Text>
                  <Text font={{ name: "system", size: 11 }} color={workerColor(worker.status)}>
                    {workerLabel(worker.status)}
                  </Text>
                </HStack>
                <Text font={{ name: "monospaced", size: 10 }} color="#888888">
                  {worker.scriptTag ? `#${worker.scriptTag}` : "—"}
                </Text>
              </VStack>
            </HStack>
          </HStack>
        }
      >
        {/* 展开：左右分栏 Pages | Worker */}
        <LiveActivityUIExpandedCenter>
          <HStack spacing={0} padding={0}>

            {/* Pages 一侧 */}
            <VStack spacing={8} padding={14}>
              <HStack spacing={4}>
                <Text font={{ name: "system", size: 10 }} color="#888888">PAGES</Text>
                <Spacer />
                <Text font={{ name: "system", size: 11 }} color="#F6821F" fontWeight="semibold" lineLimit={1}>
                  {state.pagesProject}
                </Text>
              </HStack>

              <HStack spacing={6}>
                <Text font={{ name: "system", size: 16 }} color={pagesColor(pages.status)} fontWeight="bold">
                  {pagesIcon(pages.status)}
                </Text>
                <VStack spacing={2}>
                  <Text font={{ name: "system", size: 13 }} color={pagesColor(pages.status)} fontWeight="semibold">
                    {pagesLabel(pages.status)}
                  </Text>
                  <Text font={{ name: "monospaced", size: 10 }} color="#8B5CF6">
                    ⎇ {pages.branch}
                  </Text>
                </VStack>
              </HStack>

              <Text font={{ name: "system", size: 10 }} color={{ light: "#555555", dark: "#aaaaaa" }} lineLimit={1}>
                {pages.commitMessage.slice(0, 28)}{pages.commitMessage.length > 28 ? "…" : ""}
              </Text>

              {pagesBuilding && (
                <VStack spacing={3}>
                  <Rectangle height={3} background={{ light: "#e5e7eb", dark: "#2a2d3a" }} cornerRadius={2}>
                    <Rectangle width={`${progress}%`} height={3} background="#3B82F6" cornerRadius={2} />
                  </Rectangle>
                  <HStack>
                    <Text font={{ name: "system", size: 9 }} color="#888888">
                      {mins}:{String(secs).padStart(2, "0")} 已用
                    </Text>
                    <Spacer />
                    <Text font={{ name: "system", size: 9 }} color="#888888">
                      {pages.environment}
                    </Text>
                  </HStack>
                </VStack>
              )}

              {!pagesBuilding && pages.buildDurationMs !== undefined && (
                <Text font={{ name: "system", size: 10 }} color="#888888">
                  耗时 {formatDuration(pages.buildDurationMs)}
                </Text>
              )}
            </VStack>

            <Rectangle width={1} background={{ light: "#e5e7eb", dark: "#2a2d3a" }} />

            {/* Worker 一侧 */}
            <VStack spacing={8} padding={14}>
              <HStack spacing={4}>
                <Text font={{ name: "system", size: 10 }} color="#888888">WORKER</Text>
                <Spacer />
                <Text font={{ name: "system", size: 11 }} color="#8B5CF6" fontWeight="semibold" lineLimit={1}>
                  {state.workerName}
                </Text>
              </HStack>

              <HStack spacing={6}>
                <Text font={{ name: "system", size: 16 }} color={workerColor(worker.status)} fontWeight="bold">
                  {workerIcon(worker.status)}
                </Text>
                <VStack spacing={2}>
                  <Text font={{ name: "system", size: 13 }} color={workerColor(worker.status)} fontWeight="semibold">
                    {workerLabel(worker.status)}
                  </Text>
                  <Text font={{ name: "monospaced", size: 10 }} color="#888888">
                    {worker.scriptTag ? `#${worker.scriptTag}` : "—"}
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4}>
                <Text font={{ name: "system", size: 10 }} color="#888888">路由</Text>
                <Text font={{ name: "monospaced", size: 10 }} color="#3B82F6">{worker.routes}</Text>
              </HStack>

              <Text font={{ name: "system", size: 10 }} color="#888888">
                {worker.deployedAt ? `部署于 ${timeAgo(worker.deployedAt)}` : "—"}
              </Text>

              {worker.status === "deploying" && (
                <Text font={{ name: "system", size: 10 }} color="#F59E0B">
                  正在激活新版本...
                </Text>
              )}
            </VStack>

          </HStack>
        </LiveActivityUIExpandedCenter>
      </LiveActivityUI>
    )
  }
)
