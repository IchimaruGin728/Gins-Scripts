import {
  LiveActivity,
  LiveActivityUI,
  LiveActivityUIExpandedCenter,
  HStack,
  VStack,
  Text,
  Spacer,
  Rectangle,
} from "scripting"

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

export interface DeployState {
  pages: PagesState
  worker: WorkerState
  pagesProject: string
  workerName: string
}

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
    case "success":  return "checkmark.circle.fill"
    case "failure":  return "xmark.circle.fill"
    case "canceled": return "minus.circle.fill"
    case "active":   return "play.circle.fill"
    case "queued":   return "clock.fill"
    default:         return "circle"
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
    case "active":    return "checkmark.circle.fill"
    case "deploying": return "arrow.up.circle.fill"
    case "failed":    return "xmark.circle.fill"
    default:          return "circle"
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
          <HStack spacing={4} padding={{ leading: 6, trailing: 2 }}>
            <Text font={12} fontWeight="bold" foregroundStyle={pagesColor(pages.status)}>
              P
            </Text>
            <Text font={10} fontWeight="semibold" foregroundStyle="#F6821F">
              {pagesLabel(pages.status)}
            </Text>
          </HStack>
        }
        compactTrailing={
          <HStack spacing={4} padding={{ leading: 2, trailing: 6 }}>
            <Text font={12} fontWeight="bold" foregroundStyle={workerColor(worker.status)}>
              W
            </Text>
            <Text font={10} fontWeight="semibold" foregroundStyle="#8B5CF6">
              {workerLabel(worker.status)}
            </Text>
          </HStack>
        }
        minimal={
          <Text font={12} fontWeight="bold" foregroundStyle={anyBusy ? "#F59E0B" : "#22C55E"}>
            {anyBusy ? "↑" : "✓"}
          </Text>
        }
        content={
          <HStack spacing={0} padding={12}>
            <HStack spacing={8}>
              <Text font={18} foregroundStyle={pagesColor(pages.status)}>
                P
              </Text>
              <VStack spacing={2}>
                <HStack spacing={4}>
                  <Text font={11} fontWeight="bold" foregroundStyle="#F6821F">Pages</Text>
                  <Text font={11} foregroundStyle={pagesColor(pages.status)}>
                    {pagesLabel(pages.status)}
                  </Text>
                </HStack>
                <Text font={10} foregroundStyle="secondaryLabel">
                  {pages.branch}
                </Text>
              </VStack>
            </HStack>
            <Spacer />
            <HStack spacing={8}>
              <Text font={18} foregroundStyle={workerColor(worker.status)}>
                W
              </Text>
              <VStack spacing={2}>
                <HStack spacing={4}>
                  <Text font={11} fontWeight="bold" foregroundStyle="#8B5CF6">Worker</Text>
                  <Text font={11} foregroundStyle={workerColor(worker.status)}>
                    {workerLabel(worker.status)}
                  </Text>
                </HStack>
                <Text font={10} foregroundStyle="secondaryLabel">
                  {worker.scriptTag ? `#${worker.scriptTag}` : "—"}
                </Text>
              </VStack>
            </HStack>
          </HStack>
        }
      >
        {/* 展开区域 */}
        <LiveActivityUIExpandedCenter>
          <HStack spacing={0} padding={0}>
            {/* Pages 一侧 */}
            <VStack spacing={8} padding={14} frame={{ minWidth: 0, maxWidth: Infinity }}>
              <HStack spacing={4}>
                <Text font={10} foregroundStyle="secondaryLabel">PAGES</Text>
                <Spacer />
                <Text font={11} fontWeight="semibold" foregroundStyle="#F6821F" lineLimit={1}>
                  {state.pagesProject}
                </Text>
              </HStack>

              <HStack spacing={6}>
                <Text font={16} fontWeight="bold" foregroundStyle={pagesColor(pages.status)}>
                  P
                </Text>
                <VStack spacing={2}>
                  <Text font={13} fontWeight="semibold" foregroundStyle={pagesColor(pages.status)}>
                    {pagesLabel(pages.status)}
                  </Text>
                  <Text font={10} foregroundStyle="#8B5CF6">
                    {pages.branch}
                  </Text>
                </VStack>
              </HStack>

              <Text font={10} foregroundStyle="secondaryLabel" lineLimit={1}>
                {pages.commitMessage.slice(0, 28)}{pages.commitMessage.length > 28 ? "…" : ""}
              </Text>

              {pagesBuilding ? (
                <VStack spacing={3}>
                  <HStack>
                    <Text font={9} foregroundStyle="secondaryLabel">
                      {mins}:{String(secs).padStart(2, "0")} 已用
                    </Text>
                    <Spacer />
                    <Text font={9} foregroundStyle="secondaryLabel">
                      {pages.environment}
                    </Text>
                  </HStack>
                </VStack>
              ) : null}

              {!pagesBuilding && pages.buildDurationMs !== undefined ? (
                <Text font={10} foregroundStyle="secondaryLabel">
                  耗时 {formatDuration(pages.buildDurationMs)}
                </Text>
              ) : null}
            </VStack>

            {/* Worker 一侧 */}
            <VStack spacing={8} padding={14} frame={{ minWidth: 0, maxWidth: Infinity }}>
              <HStack spacing={4}>
                <Text font={10} foregroundStyle="secondaryLabel">WORKER</Text>
                <Spacer />
                <Text font={11} fontWeight="semibold" foregroundStyle="#8B5CF6" lineLimit={1}>
                  {state.workerName}
                </Text>
              </HStack>

              <HStack spacing={6}>
                <Text font={16} fontWeight="bold" foregroundStyle={workerColor(worker.status)}>
                  W
                </Text>
                <VStack spacing={2}>
                  <Text font={13} fontWeight="semibold" foregroundStyle={workerColor(worker.status)}>
                    {workerLabel(worker.status)}
                  </Text>
                  <Text font={10} foregroundStyle="secondaryLabel">
                    {worker.scriptTag ? `#${worker.scriptTag}` : "—"}
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4}>
                <Text font={10} foregroundStyle="secondaryLabel">路由</Text>
                <Text font={10} foregroundStyle="#3B82F6">{worker.routes}</Text>
              </HStack>

              <Text font={10} foregroundStyle="secondaryLabel">
                {worker.deployedAt ? `部署于 ${timeAgo(worker.deployedAt)}` : "—"}
              </Text>

              {worker.status === "deploying" ? (
                <Text font={10} foregroundStyle="#F59E0B">
                  正在激活新版本...
                </Text>
              ) : null}
            </VStack>
          </HStack>
        </LiveActivityUIExpandedCenter>
      </LiveActivityUI>
    )
  }
)
