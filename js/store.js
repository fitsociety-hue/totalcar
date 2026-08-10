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
        const users = fetched.Users || MOCK_DATA.Users;
        
        // LocalStorage 저장된 세션 유저 복원
        let restoredUser = null;
        try {
          const savedSession = localStorage.getItem(APP_CONFIG.SESSION_USER_KEY);
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            restoredUser = users.find(u => u.user_id === parsed.user_id || u.email === parsed.email) || parsed;
          }
        } catch (e) {
          console.warn('Session parse error:', e);
        }

        const defaultUser = restoredUser || users[0];
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
   * 로그인 처리
   */
  login(identity, password) {
    const users = this.state.data.Users || [];
    const searchKey = identity.trim().toLowerCase();
    
    // 이메일, user_id, 성명으로 조회
    const user = users.find(u => 
      (u.email && u.email.toLowerCase() === searchKey) ||
      (u.user_id && u.user_id.toLowerCase() === searchKey) ||
      (u.name && u.name.toLowerCase() === searchKey)
    );

    if (!user) {
      return { success: false, message: '존재하지 않는 사용자 계정 또는 이메일입니다.' };
    }

    // 비밀번호 검증 (기본 1234 또는 입력값 매칭)
    if (user.password_hash && user.password_hash !== password && password !== '1234') {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    // 세션 저장 & 상태 반영
    this.setState({ currentUser: user });
    try {
      localStorage.setItem(APP_CONFIG.SESSION_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }
    return { success: true, user };
  },

  /**
   * 회원가입 처리
   */
  async signup(userData) {
    const users = [...(this.state.data.Users || [])];
    
    // 기존 중복 이메일/ID 체크
    const existing = users.find(u => u.email === userData.email || u.user_id === userData.user_id);
    if (existing) {
      return { success: false, message: '이미 가입된 아이디/이메일입니다.' };
    }

    const newUserId = `USER_${Date.now()}`;
    const newUser = {
      user_id: newUserId,
      name: userData.name,
      team: userData.team || '복지사업팀',
      position: userData.position || '팀원',
      email: userData.email,
      password_hash: userData.password,
      phone: userData.phone || '010-0000-0000',
      status: '재직',
      created_at: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    const updatedData = { ...this.state.data, Users: users };
    
    // LocalStorage 및 상태 반영
    AppAPI.saveStorage(updatedData);
    this.setState({ data: updatedData, currentUser: newUser });
    try {
      localStorage.setItem(APP_CONFIG.SESSION_USER_KEY, JSON.stringify(newUser));
    } catch (e) {}

    return { success: true, user: newUser };
  },

  /**
   * 로그아웃 처리
   */
  logout() {
    try {
      localStorage.removeItem(APP_CONFIG.SESSION_USER_KEY);
    } catch (e) {}
    
    // 기본 첫 번째 사용자 계정으로 복귀 또는 null 세팅
    const defaultUser = (this.state.data.Users && this.state.data.Users[0]) || null;
    this.setState({ currentUser: defaultUser });
  },

  /**
   * 역할/사용자 변경 (테스트 및 퀵 세션용)
   */
  setCurrentUserByRole(position) {
    const user = this.state.data.Users.find(u => u.position === position) || this.state.data.Users[0];
    this.setState({ currentUser: user });
    try {
      localStorage.setItem(APP_CONFIG.SESSION_USER_KEY, JSON.stringify(user));
    } catch (e) {}
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
