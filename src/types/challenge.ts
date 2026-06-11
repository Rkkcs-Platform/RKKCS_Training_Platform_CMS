export type ChallengeStatus = 'active' | 'locked'

export interface ChallengeCodeItem {
  order: number
  code: string
}

export interface AdminChallengeDetail {
  id: string
  date: string
  totalCodes: number
  codeLength: number
  generatedAt: string
  generatedBy: 'system' | 'admin'
  status: ChallengeStatus
  codes: ChallengeCodeItem[]
}

export interface AdminChallengeNotFound {
  date: string
  exists: false
}
