import type {
  AdminSubmissionDetail,
  AdminSubmissionListResponse,
  SubmissionStatus,
} from '@/types/submission'
import { api } from './api'

export async function fetchAdminSubmissions(params?: {
  page?: number
  limit?: number
  date?: string
  status?: SubmissionStatus
}) {
  const { data } = await api.get<AdminSubmissionListResponse>(
    '/admin/submissions',
    { params },
  )
  return data
}

export async function fetchAdminSubmissionById(submissionId: string) {
  const { data } = await api.get<AdminSubmissionDetail>(
    `/admin/submissions/${submissionId}`,
  )
  return data
}
