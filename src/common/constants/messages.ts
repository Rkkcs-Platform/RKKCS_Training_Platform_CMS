export const TOAST_MESSAGES = {
  auth: {
    loginSuccess: 'Đăng nhập thành công',
    loginFailed: 'Đăng nhập thất bại. Email hoặc mật khẩu không đúng',
    notAdmin: 'Tài khoản không có quyền admin',
    missingCredentials: 'Vui lòng nhập email và mật khẩu',
    logoutSuccess: 'Đăng xuất thành công',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
  },
  submissions: {
    loadFailed: 'Không tải được lịch sử nhập mã',
    detailFailed: 'Không tải được chi tiết',
  },
  challenge: {
    loadFailed: 'Không tải được mã challenge hôm nay',
    notFound: 'Chưa có challenge cho ngày hôm nay',
    exportSuccess: 'Đã tải file CSV',
    exportFailed: 'Export mã thất bại',
  },
  common: {
    requestFailed: 'Có lỗi xảy ra. Vui lòng thử lại',
  },
} as const

export const APP_LABELS = {
  appName: 'Brain Training',
  adminPanel: 'Admin CMS',
  nav: {
    todayCodes: 'Mã hôm nay',
    userHistory: 'Lịch sử user',
  },
} as const
