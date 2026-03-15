import {
  AppIntentManager,
  AppIntentProtocol,
} from "scripting"
import { CFDeployLiveActivity } from "./live_activity"

// ======= 配置区 =======
const CF_API_TOKEN  = "YOUR_API_TOKEN_HERE"
const CF_ACCOUNT_ID = "YOUR_ACCOUNT_ID_HERE"
const PAGES_PROJECT = "YOUR_PAGES_PROJECT_NAME"
const WORKER_NAME   = "YOUR_WORKER_SCRIPT_NAME"
// ======================

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
  pagesProject: string
  workerName: string
}

async function fetchPagesDeployment(): Promise<PagesState> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${PAGES_PROJECT}/deployments?per_page=1`,
    { headers: { "Authorization": `Bearer ${CF_API_TOKEN}` } }
  )
  const json = await res.json()
  const d = json?.result?.[0]
  if (!d) return {
    status: "idle", branch: "—", commitMessage: "",
    environment: "production", startedAt: new Date().toISOString(),
  }

  const started   = new Date(d.created_on)
  const completed = d.modified_on ? new Date(d.modified_on) : undefined

  return {
    status:          mapPagesStatus(d.latest_stage?.status, d.latest_stage?.name),
    branch:          d.deployment_trigger?.metadata?.branch ?? "unknown",
    commitMessage:   d.deployment_trigger?.metadata?.commit_message ?? "",
    environment:     d.environment ?? "production",
    startedAt:       d.created_on,
    completedAt:     d.modified_on,
    buildDurationMs: completed ? completed.getTime() - started.getTime() : undefined,
    url:             d.url,
  }
}

function mapPagesStatus(status?: string, stage?: string): PagesStatus {
  if (!status) return "idle"
  if (status === "success" && stage === "deploy") return "success"
  if (status === "failure")  return "failure"
  if (status === "canceled") return "canceled"
  if (status === "active")   return "active"
  if (status === "queued")   return "queued"
  return "active"
}

async function fetchWorkerState(): Promise<WorkerState> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${WORKER_NAME}`,
    { headers: { "Authorization": `Bearer ${CF_API_TOKEN}` } }
  )
  const json = await res.json()
  const script = json?.result
  if (!script) return { status: "idle", scriptTag: "—", deployedAt: "", routes: 0 }

  const deployedAt = script.modified_on ?? script.created_on ?? ""
  const ageMs = deployedAt ? Date.now() - new Date(deployedAt).getTime() : Infinity
  const status: WorkerStatus = ageMs < 2 * 60 * 1000 ? "deploying" : "active"

  const routeRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/routes`,
    { headers: { "Authorization": `Bearer ${CF_API_TOKEN}` } }
  )
  const routeJson = await routeRes.json()

  return {
    status,
    scriptTag: (script.etag ?? "").slice(0, 8),
    deployedAt,
    routes: routeJson?.result?.length ?? 0,
  }
}

// 轮询 Intent
export const CheckDeployStatus = AppIntentManager.register({
  name: "CheckDeployStatus",
  protocol: AppIntentProtocol.LiveActivityIntent,
  perform: async () => {
    const [pages, worker] = await Promise.all([
      fetchPagesDeployment(),
      fetchWorkerState(),
    ])
    const state: DeployState = { pages, worker, pagesProject: PAGES_PROJECT, workerName: WORKER_NAME }

    CFDeployLiveActivity.update(state)

    const pagesSettled = ["success", "failure", "canceled", "idle"].includes(pages.status)
    if (pagesSettled && worker.status !== "deploying") {
      CFDeployLiveActivity.end()
    }
  },
})

// 手动启动 Intent
export const StartDeployMonitor = AppIntentManager.register({
  name: "StartDeployMonitor",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    const [pages, worker] = await Promise.all([
      fetchPagesDeployment(),
      fetchWorkerState(),
    ])
    const state: DeployState = { pages, worker, pagesProject: PAGES_PROJECT, workerName: WORKER_NAME }
    CFDeployLiveActivity.start({ contentState: state })
  },
})
