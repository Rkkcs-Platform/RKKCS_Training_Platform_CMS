import type { AxiosError } from 'axios'

interface ApiErrorBody {
  message?: string | string[]
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra. Vui lòng thử lại',
): string {
  if (!error) return fallback

  const axiosError = error as AxiosError<ApiErrorBody>
  const message = axiosError.response?.data?.message

  if (Array.isArray(message)) {
    return message[0] ?? fallback
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
