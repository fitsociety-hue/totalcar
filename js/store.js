/**
 * 강동어울림복지관 차량통합관리 - 글로벌 반응형 상태 관리자 (js/store.js)
 */
const AppStore = {
  state: {
    currentUser: null,
    activeVehicleId: '236루5818',
    activeTab: 'home',
    data: MOCK_DATA,
    loading: false,
    selectedDate: new Date().toISOString().split('T')[0]
  },

  listeners: [],

  /**
   * 상태 구독 (Observer Pattern)
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  /**
   * 상태 변경 및 이벤트 알림
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  },

  /**
   * DB 데이터 로드 및 초기 세팅
   */
  async loadInitialData() {
    this.setState({ loading: true });
    try {
      const fetched = await AppAPI.request('getInitialData');
      if (fetched) {
        // 기본 사용자 세팅 (김복지 - 팀원)
        const defaultUser = fetched.Users ? fetched.Users[0] : MOCK_DATA.Users[0];
        const defaultVeh = fetched.Vehicles ? fetched.Vehicles[0].vehicle_id : '236루5818';
        this.setState({
          data: fetched,
          currentUser: defaultUser,
          activeVehicleId: defaultVeh,
          loading: false
        });
      }
    } catch (e) {
      console.error('Initial data load error:', e);
      this.setState({ loading: false });
    }
  },

  /**
   * 역할/사용자 변경 (테스트용)
   */
  setCurrentUserByRole(position) {
    const user = this.state.data.Users.find(u => u.position === position) || this.state.data.Users[0];
    this.setState({ currentUser: user });
  },

  /**
   * 활성화된 차량 객체 가져오기
   */
  getActiveVehicle() {
    return this.state.data.Vehicles.find(v => v.vehicle_id === this.state.activeVehicleId) || this.state.data.Vehicles[0];
  },

  /**
   * 중복 예약 검증 함수 (핵심 보완 요구사항)
   * @param {string} vehicle_id 차량번호
   * @param {string} drive_date 운행일자 (YYYY-MM-DD)
   * @param {string} start_time (HH:MM)
   * @param {string} end_time (HH:MM)
   * @param {string} [excludeReqId] 제외할 신청 ID
   * @returns {boolean} 중복 존재 여부 (true=중복됨, false=예약가능)
   */
  checkBookingConflict(vehicle_id, drive_date, start_time, end_time, excludeReqId = null) {
    const requests = this.state.data.DriveRequests || [];
    
    // 승인 또는 대기 상태인 해당 차량의 신청건 확인
    const conflicts = requests.filter(req => {
      if (req.vehicle_id !== vehicle_id) return false;
      if (req.drive_date !== drive_date) return false;
      if (req.approval_status === '반려') return false;
      if (excludeReqId && req.request_id === excludeReqId) return false;

      // 시간대 중첩 확인 로직 (StartA < EndB && EndA > StartB)
      const reqStart = req.start_time;
      const reqEnd = req.end_time;
      return (start_time < reqEnd && end_time > reqStart);
    });

    return conflicts.length > 0;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppStore;
}
