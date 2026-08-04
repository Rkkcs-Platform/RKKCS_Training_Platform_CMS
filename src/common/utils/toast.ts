import { toast, type ExternalToast } from 'vue-sonner'
import { TOAST_MESSAGES } from '../constants/messages'

const DEFAULT_TOAST_OPTIONS: ExternalToast = {
  duration: 3000,
}

export function showSuccess(message: string, options?: ExternalToast) {
  toast.success(message, { ...DEFAULT_TOAST_OPTIONS, ...options })
}

export function showError(message: string, options?: ExternalToast) {
  toast.error(message, { ...DEFAULT_TOAST_OPTIONS, ...options })
}

export function showLoginSuccess() {
  showSuccess(TOAST_MESSAGES.auth.loginSuccess)
}

export function showLoginFailed(message?: string) {
  showError(message ?? TOAST_MESSAGES.auth.loginFailed)
}

export function showNotAdmin() {
  showError(TOAST_MESSAGES.auth.notAdmin)
}

export function showMissingCredentials() {
  showError(TOAST_MESSAGES.auth.missingCredentials)
}

export function showLogoutSuccess() {
  showSuccess(TOAST_MESSAGES.auth.logoutSuccess)
}

export function showSessionExpired() {
  showError(TOAST_MESSAGES.auth.sessionExpired)
}

export function showSubmissionsLoadFailed() {
  showError(TOAST_MESSAGES.submissions.loadFailed)
}

export function showSubmissionDetailFailed() {
  showError(TOAST_MESSAGES.submissions.detailFailed)
}

export function showChallengeLoadFailed() {
  showError(TOAST_MESSAGES.challenge.loadFailed)
}

export function showChallengeExportSuccess() {
  showSuccess(TOAST_MESSAGES.challenge.exportSuccess)
}

export function showChallengeExportFailed(message?: string) {
  showError(message ?? TOAST_MESSAGES.challenge.exportFailed)
}

export function showSettingUpdateSuccess() {
  showSuccess(TOAST_MESSAGES.setting.updateSuccess)
}

export function showSettingUpdateFailed(message?: string) {
  showError(message ?? TOAST_MESSAGES.setting.updateFailed)
}
