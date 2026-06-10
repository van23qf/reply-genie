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
  return http.post<ExecuteResponse>('/api/v1/agent-flows/2/execute', {
    input: params,
  })
}
