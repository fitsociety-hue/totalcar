/**
 * 강동어울림복지관 차량통합관리 - 초기 테스트용 샘플 DB (js/mockData.js)
 * 11개 시트 구조 완벽 반영
 */
const MOCK_DATA = {
  // 1. Users (사용자 계정)
  Users: [
    { user_id: '1001', name: '김복지', team: '복지사업팀', position: '팀원', password_hash: '1234', phone: '010-1234-5678', email: 'kim@gde.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1003', name: '박차량', team: '운영지원팀', position: '차량관리담당자', password_hash: '1234', phone: '010-3456-7890', email: 'park@gde.or.kr', status: '재직', created_at: '2026-01-10' }
  ],

  // 2. Vehicles (차량 등록 정보)
  Vehicles: [
    {
      vehicle_id: '236루5818',
      register_date: '2023-04-15',
      model: '현대 스타리아 (9인승 승합)',
      insurance_start: '2026-04-15',
      insurance_end: '2027-04-14',
      status: '운행가능',
      scrap_date: '',
      current_mileage: 38450,
      hipass_id: 'HP-8849201',
      note: '메인 복지사업 수송용 차량'
    }
  ],

  // 3. DriveRequests (차량 운행 신청 및 예약 캘린더)
  DriveRequests: [
    {
      request_id: 'REQ-20260811-01',
      team: '복지사업팀',
      applicant_id: '1001',
      applicant_name: '김복지',
      vehicle_id: '236루5818',
      drive_date: new Date().toISOString().split('T')[0],
      start_time: '09:30',
      end_time: '12:30',
      purpose: '강동구 관내 독거노인 도시락 배달 수송',
      approval_status: '확정(우선권)',
      approver_id: '자동확정',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    }
  ],

  // 4. DriveLogs (차량운행일지)
  DriveLogs: [
    {
      log_id: 'LOG-20260810-01',
      vehicle_id: '236루5818',
      date: '2026-08-10',
      driver_id: '1001',
      driver_name: '김복지',
      depart_time: '09:30',
      arrival_time: '12:20',
      destination: '강동구 천호동/성내동 일대',
      purpose: '독거노인 도시락 지원',
      start_km: 38410,
      end_km: 38450,
      distance_km: 40,
      companion: '사회복지사 2명',
      hipass_balance: 32500,
      request_id: 'REQ-20260810-01',
      status: '작성완료'
    }
  ],

  // 5. Fuel (주유 기록)
  Fuel: [
    {
      fuel_id: 'FUEL-20260805-01',
      vehicle_id: '236루5818',
      date: '2026-08-05',
      amount_won: 75000,
      liter: 48.5,
      station: 'GS칼텍스 강동주유소',
      unit_price: 1546,
      note: '법인카드 주유'
    }
  ],

  // 6. Maintenance (정비/점검 기록)
  Maintenance: [
    {
      maint_id: 'MAINT-20260720-01',
      vehicle_id: '236루5818',
      in_date: '2026-07-20',
      out_date: '2026-07-20',
      reason: '정기점검·검사',
      detail: '엔진오일 교환, 브레이크 패드 점검 및 에어컨 필터 교체',
      cost_total: 145000,
      insurance_claim: false,
      self_pay_org: 145000,
      self_pay_staff: 0,
      next_due_date: '2026-10-20',
      receipt_file: ''
    }
  ],

  // 7. Accidents (사고 경위서)
  Accidents: [],

  // 8. Insurance (보험 이력)
  Insurance: [
    {
      insurance_id: 'INS-2026-01',
      vehicle_id: '236루5818',
      company: 'DB손해보험',
      company_phone: '1588-0100',
      claim_phone: '1588-0100 (사고/긴급출동 1번)',
      agent_name: '강동대리점 박보험',
      agent_phone: '010-8888-7777',
      policy_number: 'POL-8849102-DB',
      start_date: '2026-04-15',
      end_date: '2027-04-14',
      premium: 980000,
      pay_cycle: '일시납',
      pay_date: '2026-04-10',
      coverage_liability_person: '무한',
      coverage_liability_property: '1억원',
      coverage_self_injury: '3천만원',
      coverage_self_car: '가입',
      deductible: 200000
    }
  ],

  // 9. ApprovalLogs (결재 이력)
  ApprovalLogs: [
    { log_id: 'APPLOG-01', month: '2026-07', stage: '기안', actor_id: '1003', actor_name: '박차량', status: '승인', date: '2026-08-01 10:00' }
  ],

  // 10. AuditLogs (감사 이력)
  AuditLogs: [],

  // 11. Notifications (알림 로그)
  Notifications: []
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOCK_DATA;
}
