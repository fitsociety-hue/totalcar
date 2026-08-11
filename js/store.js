/**
 * 강동어울림복지관 차량통합관리 - 글로벌 반응형 상태 관리자 (js/store.js)
 */
const AppStore = {
  state: {
    currentUser: null,
    activeVehicleId: '236루5818',
    activeTab: 'home',
    viewMode: 'mobile', // 'mobile' | 'desktop'
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
      const validData = (fetched && Array.isArray(fetched.Vehicles) && fetched.Vehicles.length > 0)
        ? { ...MOCK_DATA, ...fetched }
        : MOCK_DATA;

      const users = validData.Users || MOCK_DATA.Users;
      
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
      const defaultVeh = (validData.Vehicles && validData.Vehicles[0]) ? validData.Vehicles[0].vehicle_id : '236루5818';
      
      this.setState({
        data: validData,
        currentUser: defaultUser,
        activeVehicleId: defaultVeh,
        loading: false
      });
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

    // GAS Web App 백엔드로 회원가입 데이터 전송
    await AppAPI.request('createUserAccount', newUser);

    return { success: true, user: newUser };
  },

  /**
   * 로그아웃 처리
   */
  logout() {
    try {
      localStorage.removeItem(APP_CONFIG.SESSION_USER_KEY);
    } catch (e) {}
    
    this.setState({ currentUser: null });
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
  },

  /**
   * 차량, 하이패스, 보험 통합 등록
   */
  async createVehicle(vehicleData, insuranceData) {
    const user = this.state.currentUser;
    const hasAccess = user && ['차량관리담당자', '사무국장', '관장'].includes(user.position);
    if (!hasAccess) {
      return { success: false, message: '권한이 없습니다. 차량관리담당자만 등록 가능합니다.' };
    }

    const vehicles = [...(this.state.data.Vehicles || [])];
    const insurances = [...(this.state.data.Insurance || [])];

    // 기존 차량번호 중복 검증
    const existing = vehicles.find(v => v.vehicle_id === vehicleData.vehicle_id);
    if (existing) {
      return { success: false, message: '이미 등록된 차량번호입니다.' };
    }

    const newVehicle = {
      vehicle_id: vehicleData.vehicle_id,
      model: vehicleData.model || '현대 스타리아 (9인승 승합)',
      register_date: vehicleData.register_date || new Date().toISOString().split('T')[0],
      insurance_start: insuranceData.insurance_start || new Date().toISOString().split('T')[0],
      insurance_end: insuranceData.insurance_end || '2027-12-31',
      status: vehicleData.status || '운행가능',
      current_mileage: Number(vehicleData.current_mileage) || 0,
      hipass_id: vehicleData.hipass_id || 'HP-000000',
      hipass_card: vehicleData.hipass_card || '9410-****-0000',
      note: vehicleData.note || ''
    };

    const newInsurance = {
      vehicle_id: vehicleData.vehicle_id,
      company: insuranceData.company || 'DB손해보험',
      policy_number: insuranceData.policy_number || `POL-${Date.now()}`,
      contractor: insuranceData.contractor || '강동어울림복지관',
      claim_phone: insuranceData.claim_phone || '1588-0100',
      insurance_start: insuranceData.insurance_start || new Date().toISOString().split('T')[0],
      insurance_end: insuranceData.insurance_end || '2027-12-31',
      coverage: insuranceData.coverage || '대인 무제한 / 대물 5억 / 자차 포함'
    };

    vehicles.push(newVehicle);
    insurances.push(newInsurance);

    const updatedData = { ...this.state.data, Vehicles: vehicles, Insurance: insurances };
    AppAPI.saveStorage(updatedData);

    this.setState({
      data: updatedData,
      activeVehicleId: newVehicle.vehicle_id
    });

    await AppAPI.request('createVehicle', { vehicle: newVehicle, insurance: newInsurance });
    return { success: true, vehicle: newVehicle };
  },

  /**
   * 차량, 하이패스, 보험 정보 수정
   */
  async updateVehicle(vehicleId, vehicleData, insuranceData) {
    const user = this.state.currentUser;
    const hasAccess = user && ['차량관리담당자', '사무국장', '관장'].includes(user.position);
    if (!hasAccess) {
      return { success: false, message: '권한이 없습니다. 차량관리담당자만 수정 가능합니다.' };
    }

    const vehicles = [...(this.state.data.Vehicles || [])];
    const insurances = [...(this.state.data.Insurance || [])];

    const vIdx = vehicles.findIndex(v => v.vehicle_id === vehicleId);
    if (vIdx !== -1) {
      vehicles[vIdx] = { ...vehicles[vIdx], ...vehicleData };
    }

    const iIdx = insurances.findIndex(i => i.vehicle_id === vehicleId);
    if (iIdx !== -1) {
      insurances[iIdx] = { ...insurances[iIdx], ...insuranceData };
    } else if (insuranceData) {
      insurances.push({ vehicle_id: vehicleId, ...insuranceData });
    }

    const updatedData = { ...this.state.data, Vehicles: vehicles, Insurance: insurances };
    AppAPI.saveStorage(updatedData);

    this.setState({ data: updatedData });
    await AppAPI.request('updateVehicle', { vehicle: vehicles[vIdx], insurance: insurances[iIdx] });
    return { success: true };
  },

  /**
   * 차량 삭제
   */
  async deleteVehicle(vehicleId) {
    const user = this.state.currentUser;
    const hasAccess = user && ['차량관리담당자', '사무국장', '관장'].includes(user.position);
    if (!hasAccess) {
      return { success: false, message: '권한이 없습니다. 차량관리담당자만 삭제 가능합니다.' };
    }

    const vehicles = (this.state.data.Vehicles || []).filter(v => v.vehicle_id !== vehicleId);
    const insurances = (this.state.data.Insurance || []).filter(i => i.vehicle_id !== vehicleId);

    if (vehicles.length === 0) {
      return { success: false, message: '최소 1대 이상의 차량이 등록되어 있어야 합니다.' };
    }

    const updatedData = { ...this.state.data, Vehicles: vehicles, Insurance: insurances };
    AppAPI.saveStorage(updatedData);

    const newActiveId = vehicles[0].vehicle_id;
    this.setState({ data: updatedData, activeVehicleId: newActiveId });
    await AppAPI.request('deleteVehicle', { vehicle_id: vehicleId });
    return { success: true };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppStore;
}
