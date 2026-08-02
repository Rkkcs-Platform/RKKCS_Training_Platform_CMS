import type { AdminChallengeDetail, AdminChallengeNotFound } from '@/types/challenge'
import { api } from './api'

export async function fetchChallengeByDate(date: string, shopId?: string) {
  const { data } = await api.get<AdminChallengeDetail | AdminChallengeNotFound>(
    `/admin/challenges/date/${date}`,
    { params: shopId ? { shopId } : undefined },
  )
  return data
}

export async function generateChallenge(payload: {
  date: string
  shopId?: string
  codeCount?: number
  codeLength?: number
}) {
  const { data } = await api.post<AdminChallengeDetail>(
    '/admin/challenges/generate',
    payload,
  )
  return data
}

export async function regenerateChallenge(challengeId: string) {
  const { data } = await api.post<AdminChallengeDetail>(
    `/admin/challenges/${challengeId}/regenerate`,
  )
  return data
}

export async function lockChallenge(challengeId: string) {
  const { data } = await api.post<AdminChallengeDetail>(
    `/admin/challenges/${challengeId}/lock`,
  )
  return data
}

export async function unlockChallenge(challengeId: string) {
  const { data } = await api.post<AdminChallengeDetail>(
    `/admin/challenges/${challengeId}/unlock`,
  )
  return data
}

export async function exportChallengeCodesByDate(date: string, shopId?: string) {
  const { data, headers } = await api.get<Blob>(
    `/admin/challenges/date/${date}/codes/export`,
    {
      responseType: 'blob',
      params: shopId ? { shopId } : undefined,
    },
  )

  const disposition = headers['content-disposition'] as string | undefined
  const filenameMatch = disposition?.match(/filename="(.+)"/)
  const filename = filenameMatch?.[1] ?? `challenge-codes-${date}.csv`

  return { blob: data, filename }
}
