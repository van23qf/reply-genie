import { http } from '@/http/http'

/** 请求参数 */
export interface SuggestionParams {
  scene: string
  role: string
  style: string
}

/** AI 返回结果 */
export interface SuggestionResult {
  analysis: string
  suggestions: string[]
  tip: string
}

/** 后端原始响应中的 data */
export interface ExecuteResponse {
  execution_id: number
  status: number
  message: string
  output: {
    result: SuggestionResult
  }
  nodes: any[]
}

/** 获取回话建议 */
export function getSuggestions(params: SuggestionParams) {
  const agentId = import.meta.env.VITE_REPLY_AGENT_ID
  return http.post<ExecuteResponse>(`/api/v1/agent-flows/${agentId}/execute`, {
    input: params,
  })
}
