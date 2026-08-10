/**
 * 강동어울림복지관 차량통합관리 - 초기 테스트용 샘플 DB (js/mockData.js)
 * 11개 시트 구조 완벽 반영
 */
const MOCK_DATA = {
  // 1. Users (사용자 계정)
  Users: [
    { user_id: '1001', name: '김복지', team: '복지사업팀', position: '팀원', password_hash: '1234', phone: '010-1234-5678', email: 'kim@gangdong.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1002', name: '이팀장', team: '복지사업팀', position: '팀장', password_hash: '1234', phone: '010-2345-6789', email: 'lee@gangdong.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1003', name: '박차량', team: '운영지원팀', position: '차량관리담당자', password_hash: '1234', phone: '010-3456-7890', email: 'park@gangdong.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1004', name: '최국장', team: '사무국', position: '사무국장', password_hash: '1234', phone: '010-4567-8901', email: 'choi@gangdong.or.kr', status: '재직', created_at: '2026-01-10' },
    { user_id: '1005', name: '정관장', team: '관장실', position: '관장', password_hash: '1234', phone: '010-5678-9012', email: 'jung@gangdong.or.kr', status: '재직', created_at: '2026-01-10' }
  ],

  // 2. Vehicles (차량 등록 정보 - 2대 운영 및 확장 대비)
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
    },
    {
      vehicle_id: '123가4567',
      register_date: '2024-02-10',
      model: '기아 카니발 (7인승 리무진)',
      insurance_start: '2026-02-10',
      insurance_end: '2027-02-09',
      status: '운행가능',
      scrap_date: '',
      current_mileage: 18200,
      hipass_id: 'HP-9930122',
      note: '행정 및 외부 방문용 차량'
    }
  ],

  // 3. DriveRequests (차량 운행 신청 및 예약 캘린더)
  DriveRequests: [
    {
      request_id: 'REQ-20260810-01',
      team: '복지사업팀',
      applicant_id: '1001',
      applicant_name: '김복지',
      vehicle_id: '236루5818',
      drive_date: '2026-08-10',
      start_time: '09:30',
      end_time: '12:30',
      purpose: '강동구 관내 독거노인 도시락 배달 봉사 수송',
      approval_status: '승인',
      approver_id: '1003',
      created_at: '2026-08-09 14:20'
    },
    {
      request_id: 'REQ-20260810-02',
      team: '복지사업팀',
      applicant_id: '1002',
      applicant_name: '이팀장',
      vehicle_id: '123가4567',
      drive_date: '2026-08-11',
      start_time: '14:00',
      end_time: '17:00',
      purpose: '서울시 복지재단 유관기관 협의회 참석',
      approval_status: '대기',
      approver_id: '',
      created_at: '2026-08-10 09:10'
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
      purpose: '도시락 배달 지원',
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

  // 7. Accidents (사고 경위서 v1.1 - 가해/피해 x 대인/대물)
  Accidents: [
    {
      accident_id: 'ACC-20260615-01',
      vehicle_id: '123가4567',
      date: '2026-06-15',
      driver_id: '1001',
      driver_name: '김복지',
      location: '강동구 올림픽로 주차장 인근',
      accident_role: '피해',
      damage_person_yn: 'N',
      damage_person_detail: '인명 피해 없음',
      damage_property_yn: 'Y',
      damage_property_detail: '후방 범퍼 미세 긁힘 (상대 후진 중 접촉)',
      counterpart_name: '홍길동',
      counterpart_phone: '010-9999-8888',
      counterpart_insurance: '삼성화재',
      description: '주차 구역 내 정차 중 상대 차량 후진 미숙으로 접촉 발생',
      claim_number: '2026-ACC-09482',
      insurance_process_date: '2026-06-18',
      processed_amount: 350000,
      linked_maint_id: '',
      attachment: ''
    }
  ],

  // 8. Insurance (보험 이력 - v1.1 긴급출동 전화번호 등 보강)
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
    },
    {
      insurance_id: 'INS-2026-02',
      vehicle_id: '123가4567',
      company: '삼성화재',
      company_phone: '1588-5114',
      claim_phone: '1588-5114 (사고접수 24시간)',
      agent_name: '천호지점 이삼성',
      agent_phone: '010-7777-6666',
      policy_number: 'POL-9940129-SS',
      start_date: '2026-02-10',
      end_date: '2027-02-09',
      premium: 850000,
      pay_cycle: '일시납',
      pay_date: '2026-02-05',
      coverage_liability_person: '무한',
      coverage_liability_property: '2억원',
      coverage_self_injury: '5천만원',
      coverage_self_car: '가입',
      deductible: 200000
    }
  ],

  // 9. ApprovalLogs (결재 이력)
  ApprovalLogs: [
    { log_id: 'APPLOG-01', month: '2026-07', stage: '기안', actor_id: '1003', actor_name: '박차량', status: '승인', date: '2026-08-01 10:00' },
    { log_id: 'APPLOG-02', month: '2026-07', stage: '1차결재(팀장)', actor_id: '1002', actor_name: '이팀장', status: '승인', date: '2026-08-01 14:30' },
    { log_id: 'APPLOG-03', month: '2026-07', stage: '2차결재(국장)', actor_id: '1004', actor_name: '최국장', status: '승인', date: '2026-08-02 09:15' },
    { log_id: 'APPLOG-04', month: '2026-07', stage: '최종결재(관장)', actor_id: '1005', actor_name: '정관장', status: '승인', date: '2026-08-02 16:00' }
  ],

  // 10. Notifications (알림 로그)
  Notifications: [
    { id: 'NOTIF-01', user_id: '1001', type: 'INFO', title: '운행 신청 승인 완료', message: '8월 10일 스타리아 운행 신청이 승인되었습니다.', read: false, date: '2026-08-09 14:20' },
    { id: 'NOTIF-02', user_id: '1003', type: 'WARN', title: '보험 만료 임박 안내', message: '123가4567 차량 보험 만료가 D-180 남았습니다.', read: true, date: '2026-08-01 09:00' }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOCK_DATA;
}
