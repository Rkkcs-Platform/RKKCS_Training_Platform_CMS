export type SubmissionStatus = 'in_progress' | 'completed'

export interface SubmissionUserSummary {
  id: string
  name: string
  email: string
  staffCode?: string
}

export interface AdminSubmissionItem {
  id: string
  date: string
  user: SubmissionUserSummary
  submitted: number
  correct: number
  wrong: number
  accuracy: number
  status: SubmissionStatus
  startedAt?: string
  completedAt?: string
}

export interface AdminSubmissionAnswer {
  order: number
  inputCode: string
  isCorrect: boolean
  submittedAt: string
}

export interface AdminSubmissionDetail extends AdminSubmissionItem {
  answers: AdminSubmissionAnswer[]
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminSubmissionListResponse {
  items: AdminSubmissionItem[]
  meta: PaginationMeta
}
