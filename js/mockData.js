/**
 * 강동어울림복지관 차량통합관리 - 초기 테스트용 샘플 DB (js/mockData.js)
 * 11개 시트 구조 완벽 반영
 */
const MOCK_DATA = {
  // 1. Users (사용자 계정)
  Users: [],

  // 2. Vehicles (차량 등록 정보)
  Vehicles: [],

  // 3. DriveRequests (차량 운행 신청 및 예약 캘린더)
  DriveRequests: [],

  // 4. DriveLogs (차량운행일지)
  DriveLogs: [],

  // 5. Fuel (주유 기록)
  Fuel: [],

  // 6. Maintenance (정비/점검 기록)
  Maintenance: [],

  // 7. Accidents (사고 경위서)
  Accidents: [],

  // 8. Insurance (보험 이력)
  Insurance: [],

  // 9. ApprovalLogs (결재 이력)
  ApprovalLogs: [],

  // 10. AuditLogs (감사 이력)
  AuditLogs: [],

  // 11. Notifications (알림 로그)
  Notifications: []
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOCK_DATA;
}
