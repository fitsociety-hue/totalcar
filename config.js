/**
 * 강동어울림복지관 차량통합관리 앱 설정 (config.js)
 */
const APP_CONFIG = {
  APP_TITLE: '강동어울림복지관 스마트 차량통합관리',
  ORGANIZATION_NAME: '강동어울림복지관',
  VERSION: 'v1.1.0',
  
  // GAS (Google Apps Script) Web App URL
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwZaU08pK5PEdjH31rltsL4yEQmDRNoO8mmRy1fDmcgZk3N02Ob4xVnb5vcHpnoUShTZQ/exec',

  // GitHub 저장소 정보
  GITHUB_REPO: 'https://github.com/fitsociety-hue/totalcar',

  // 기본 세션 유지 시간 (밀리초)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
  SESSION_USER_KEY: 'TOTALCAR_LOGGED_IN_USER',

  // 구글 워크스페이스 (Google Workspace) 통합 링크 및 설정
  GOOGLE_WORKSPACE: {
    DOMAIN: '@gde.or.kr',
    SHARED_DRIVE_URL: 'https://drive.google.com/drive/folders/1gangdong_totalcar_shared_drive',
    SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1gangdong_totalcar_db_sheets/edit',
    DOCS_TEMPLATE_URL: 'https://docs.google.com/document/d/1gangdong_totalcar_monthly_report_doc/edit',
    CHAT_WEBHOOK_URL: 'https://chat.googleapis.com/v1/spaces/AAQA_totalcar_alerts/messages'
  },

  // 차량 상태 정의
  VEHICLE_STATUS: {
    AVAILABLE: { code: '운행가능', label: '운행 가능', color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
    MAINTENANCE: { code: '정비중', label: '정비/점검 중', color: '#F59E0B', badgeBg: 'rgba(245, 158, 11, 0.15)' },
    ACCIDENT: { code: '사고처리중', label: '사고 처리 중', color: '#EF4444', badgeBg: 'rgba(239, 68, 68, 0.15)' },
    SCRAPPED: { code: '폐차', label: '폐차 (운행불가)', color: '#6B7280', badgeBg: 'rgba(107, 114, 128, 0.15)' }
  },

  // 권한 계층 정의
  ROLES: {
    STAFF: { code: '팀원', label: '직원 (팀원)' },
    TEAM_LEADER: { code: '팀장', label: '직원 (팀장)' },
    VEHICLE_MANAGER: { code: '차량관리담당자', label: '차량 관리 담당자' },
    SECRETARY: { code: '사무국장', label: '사무국장 (중간결재)' },
    DIRECTOR: { code: '관장', label: '관장 (최종결재)' }
  },

  // 결재 진행 상태
  APPROVAL_STATUS: {
    PENDING: { code: '대기', label: '승인 대기', color: '#F59E0B' },
    APPROVED: { code: '승인', label: '승인 완료', color: '#10B981' },
    REJECTED: { code: '반려', label: '반려됨', color: '#EF4444' }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
