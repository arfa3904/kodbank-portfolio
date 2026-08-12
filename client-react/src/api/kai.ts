// KAI assistant — calls the backend, which proxies to Hugging Face and
// never exposes HF_API_KEY to the browser. See backend/routes/kai.js.

import { api, ApiError } from './client'
import type { ChatMessage } from '../types'

export async function sendKaiMessage(message: string, _history: ChatMessage[] = []): Promise<string> {
  try {
    const data = await api.post<{ text: string }>('/api/kai-chat', { message })
    return data.text
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(0, 'Network error. Please try again.')
  }
}
