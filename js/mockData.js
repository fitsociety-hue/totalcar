/**
 * 강동어울림복지관 차량통합관리 - 초기 테스트용 샘플 DB (js/mockData.js)
 * 11개 시트 구조 완벽 반영
 */
const MOCK_DATA = {
  // 1. Users (사용자 계정)
  Users: [
    { user_id: '1001', name: '김복지', team: '복지사업팀', position: '팀원', password_hash: '1234', phone: '010-1234-5678', email: 'kim@gde.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1003', name: '박차량', team: '운영지원팀', position: '차량관리담당자', password_hash: '1234', phone: '010-3456-7890', email: 'park@gde.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: 'USER_178643569627O', name: '김용필', team: '전략기획팀', position: '차량관리담당자', password_hash: '2610', phone: '010-6828-0579', email: 'alias1004@gde.or.kr', status: '재직', created_at: '2026-08-11' }
  ],

  // 2. Vehicles (차량 등록 정보)
  Vehicles: [
    {
      vehicle_id: '365라 1271',
      register_date: '2026-08-01',
      model: '스타리아 (9인승 승합)',
      insurance_start: '2026-08-01',
      insurance_end: '2027-08-01',
      status: '운행가능',
      scrap_date: '',
      current_mileage: 0,
      hipass_id: 'HP-770011',
      hipass_card: '9410-****-7700',
      note: '복지관 메인 수송 및 프로그램 운영용 차량'
    },
    {
      vehicle_id: '135버 8694',
      register_date: '2026-08-05',
      model: '카니발 (특장차량)',
      insurance_start: '2026-08-05',
      insurance_end: '2027-08-05',
      status: '운행가능',
      scrap_date: '',
      current_mileage: 0,
      hipass_id: 'HP-770012',
      hipass_card: '9410-****-8694',
      note: '휠체어 리프트 지원 특장 이동 차량'
    }
  ],

  // 3. DriveRequests (차량 운행 신청 및 예약 캘린더)
  DriveRequests: [
    {
      request_id: 'REQ-20260812-01',
      team: '전략기획팀',
      applicant_id: 'USER_178643569627O',
      applicant_name: '김용필',
      driver_name: '김용필',
      companion: '이팀장, 박차량 (외 2명)',
      vehicle_id: '365라 1271',
      drive_date: new Date().toISOString().split('T')[0],
      start_time: '17:00',
      end_time: '18:00',
      purpose: '강동구청 방문 및 업무 협의 수송',
      approval_status: '확정(우선권)',
      approver_id: '자동확정',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    }
  ],

  // 4. DriveLogs (차량운행일지)
  DriveLogs: [],

  // 5. Fuel (주유 기록)
  Fuel: [],

  // 6. Maintenance (정비/점검 기록)
  Maintenance: [],

  // 7. Accidents (사고 경위서)
  Accidents: [],

  // 8. Insurance (보험 이력)
  Insurance: [
    {
      insurance_id: 'INS-365RA-1271',
      vehicle_id: '365라 1271',
      company: 'KB손해보험',
      company_phone: '1544-0114',
      claim_phone: '1544-0114',
      agent_name: '강동지점 김보험',
      policy_number: 'POL-2026-9901',
      insurance_start: '2026-08-01',
      insurance_end: '2027-08-01',
      coverage: '대인 무제한 / 대물 5억 / 자차 포함'
    },
    {
      insurance_id: 'INS-135BU-8694',
      vehicle_id: '135버 8694',
      company: 'DB손해보험',
      company_phone: '1588-0100',
      claim_phone: '1588-0100',
      agent_name: '강동지점 박보험',
      policy_number: 'POL-2026-8694',
      insurance_start: '2026-08-05',
      insurance_end: '2027-08-05',
      coverage: '대인 무제한 / 대물 5억 / 특장 리프트 보험 포함'
    }
  ],

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
