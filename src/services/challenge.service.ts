import type { AdminChallengeDetail, AdminChallengeNotFound } from '@/types/challenge'
import { api } from './api'

export async function fetchChallengeByDate(date: string) {
  const { data } = await api.get<AdminChallengeDetail | AdminChallengeNotFound>(
    `/admin/challenges/date/${date}`,
  )
  return data
}

export async function exportChallengeCodesByDate(date: string) {
  const { data, headers } = await api.get<Blob>(
    `/admin/challenges/date/${date}/codes/export`,
    { responseType: 'blob' },
  )

  const disposition = headers['content-disposition'] as string | undefined
  const filenameMatch = disposition?.match(/filename="(.+)"/)
  const filename = filenameMatch?.[1] ?? `challenge-codes-${date}.csv`

  return { blob: data, filename }
}
