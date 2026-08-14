/**
 * 강동어울림복지관 차량통합관리 - 글로벌 반응형 상태 관리자 (js/store.js)
 */
const AppStore = {
  state: {
    currentUser: null,
    activeVehicleId: '365라 1271',
    activeTab: 'home',
    viewMode: 'mobile', // 'mobile' | 'desktop'
    bookingFilterMode: 'all', // 'selected' | 'all' (기본값 'all'로 전체 운행신청 내역 표출)
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
    // 세션 복원 우선 처리 (API 호출 전에 즉시 세션 반영)
    let restoredUser = null;
    try {
      const savedSession = localStorage.getItem(APP_CONFIG.SESSION_USER_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && (parsed.user_id || parsed.email)) {
          restoredUser = parsed;
          // 즉시 currentUser 반영 (새로고침 시 로그인 상태 유지)
          if (!this.state.currentUser) {
            this.setState({ currentUser: restoredUser });
          }
        }
      }
    } catch (e) {
      console.warn('Session pre-restore error:', e);
    }

    this.setState({ loading: true });
    try {
      const fetched = await AppAPI.request('getInitialData');
      const validData = (fetched && Array.isArray(fetched.Vehicles) && fetched.Vehicles.length > 0)
        ? { ...MOCK_DATA, ...fetched }
        : MOCK_DATA;

      if (validData && Array.isArray(validData.DriveRequests)) {
        validData.DriveRequests = this.deduplicateDriveRequests(validData.DriveRequests);
      }

      const users = validData.Users || MOCK_DATA.Users;
      
      // DB 유저 목록에서 세션 유저와 매칭하여 최신 정보로 교체
      if (restoredUser) {
        const matchedUser = users.find(u => u.user_id === restoredUser.user_id || u.email === restoredUser.email);
        if (matchedUser) {
          restoredUser = matchedUser;
        }
        // DB에 없어도 localStorage 세션 유저 유지 (세션 무효화 방지)
      }

      const defaultUser = restoredUser || this.state.currentUser || null;
      const defaultVeh = (validData.Vehicles && validData.Vehicles[0]) ? validData.Vehicles[0].vehicle_id : '365라 1271';
      
      this.setState({
        data: validData,
        currentUser: defaultUser,
        activeVehicleId: defaultVeh,
        loading: false
      });
    } catch (e) {
      console.error('Initial data load error:', e);
      // API 실패 시에도 세션 유저 유지
      this.setState({ loading: false, currentUser: restoredUser || this.state.currentUser || null });
    }
  },

  /**
   * 로그인 처리 (2차 GAS Fallback 포함)
   */
  async login(identity, password) {
    const users = this.state.data.Users || [];
    const searchKey = identity.trim().toLowerCase();
    
    // 1차: 로컬 데이터에서 검색 (이메일, user_id, 성명)
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === searchKey) ||
      (u.user_id && u.user_id.toLowerCase() === searchKey) ||
      (u.name && u.name.toLowerCase() === searchKey)
    );

    // 2차: 로컬에 없으면 GAS 백엔드에 직접 조회
    if (!user) {
      try {
        const gasResult = await AppAPI.request('loginUser', { identity: searchKey, password });
        if (gasResult && gasResult.success && gasResult.user) {
          // GAS에서 찾은 사용자를 로컬 DB에 추가 (다음 접속부터 로컬에서도 로그인 가능)
          const updatedUsers = [...users, gasResult.user];
          const updatedData = { ...this.state.data, Users: updatedUsers };
          AppAPI.saveStorage(updatedData);
          this.setState({ data: updatedData, currentUser: gasResult.user });
          try {
            localStorage.setItem(APP_CONFIG.SESSION_USER_KEY, JSON.stringify(gasResult.user));
          } catch (e) {}
          return { success: true, user: gasResult.user };
        } else if (gasResult && !gasResult.success) {
          return { success: false, message: gasResult.message || '존재하지 않는 사용자 계정 또는 이메일입니다.' };
        }
      } catch (e) {
        console.warn('GAS loginUser fallback failed:', e);
      }
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
    
    // 기존 중복 이메일/ID 체크 -> 스마트 프로필 업데이트 & 자동 로그인 처리
    const existingIndex = users.findIndex(u => (u.email && u.email.toLowerCase() === userData.email.toLowerCase()) || (u.user_id && u.user_id === userData.user_id));
    
    let newUser;
    if (existingIndex !== -1) {
      newUser = {
        ...users[existingIndex],
        name: userData.name || users[existingIndex].name,
        team: userData.team || users[existingIndex].team,
        position: userData.position || users[existingIndex].position,
        phone: userData.phone || users[existingIndex].phone,
        password_hash: userData.password || users[existingIndex].password_hash
      };
      users[existingIndex] = newUser;
    } else {
      const newUserId = `USER_${Date.now()}`;
      newUser = {
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
    }

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
    const users = this.state.data.Users || [];
    let user = users.find(u => u.position === position);
    if (!user) {
      user = {
        user_id: `DEMO-${Date.now()}`,
        name: `테스트 (${position})`,
        team: '복지사업팀',
        position: position,
        email: `demo_${Date.now()}@gde.or.kr`,
        status: '재직',
        created_at: new Date().toISOString().split('T')[0]
      };
    }
    this.setState({ currentUser: user });
    try {
      localStorage.setItem(APP_CONFIG.SESSION_USER_KEY, JSON.stringify(user));
    } catch (e) {}
  },

  /**
   * 활성화된 차량 객체 가져오기
   */
  getActiveVehicle() {
    const vehicles = this.state.data.Vehicles || [];
    if (vehicles.length === 0) {
      return {
        vehicle_id: '미등록',
        model: '등록된 차량 없음',
        register_date: '',
        insurance_start: '',
        insurance_end: '',
        status: '운행가능',
        scrap_date: '',
        current_mileage: 0,
        hipass_id: '미등록',
        hipass_card: '미등록',
        note: ''
      };
    }
    return vehicles.find(v => v.vehicle_id === this.state.activeVehicleId) || vehicles[0];
  },

  /**
   * 차량별 통합 요약 데이터 (유기적 연동 핵심)
   */
  getVehicleSummary(vehicleId) {
    const data = this.state.data;
    const vid = vehicleId || this.state.activeVehicleId;

    const driveLogs = (data.DriveLogs || []).filter(l => l.vehicle_id === vid);
    const driveRequests = (data.DriveRequests || []).filter(r => r.vehicle_id === vid);
    const fuelLogs = (data.Fuel || []).filter(f => f.vehicle_id === vid);
    const maintLogs = (data.Maintenance || []).filter(m => m.vehicle_id === vid);
    const accidentLogs = (data.Accidents || []).filter(a => a.vehicle_id === vid);
    const insurance = (data.Insurance || []).find(i => i.vehicle_id === vid) || null;
    const vehicle = (data.Vehicles || []).find(v => v.vehicle_id === vid) || null;

    // 월간 주행거리 합계
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthlyLogs = driveLogs.filter(l => (l.date || '').startsWith(thisMonth));
    const monthlyKm = monthlyLogs.reduce((sum, l) => sum + (Number(l.distance_km) || 0), 0);

    // 월간 비용 합계
    const monthlyFuel = fuelLogs.filter(f => (f.date || '').startsWith(thisMonth));
    const monthlyFuelCost = monthlyFuel.reduce((sum, f) => sum + (Number(f.amount_won) || 0), 0);
    const monthlyMaint = maintLogs.filter(m => (m.in_date || '').startsWith(thisMonth));
    const monthlyMaintCost = monthlyMaint.reduce((sum, m) => sum + (Number(m.cost_total) || 0), 0);

    // 보험 만료 경고
    let insuranceDDay = null;
    const insEndDate = insurance ? (insurance.insurance_end || insurance.end_date) : (vehicle ? vehicle.insurance_end : null);
    if (insEndDate) {
      const today = new Date(); today.setHours(0,0,0,0);
      const end = new Date(insEndDate); end.setHours(0,0,0,0);
      insuranceDDay = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    }

    // 오늘 예약 건수
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRequests = driveRequests.filter(r => r.drive_date === todayStr);

    return {
      vehicle,
      insurance,
      driveLogs,
      driveRequests,
      fuelLogs,
      maintLogs,
      accidentLogs,
      monthlyKm,
      monthlyFuelCost,
      monthlyMaintCost,
      monthlyTotalCost: monthlyFuelCost + monthlyMaintCost,
      insuranceDDay,
      todayRequestsCount: todayRequests.length,
      totalDriveCount: driveLogs.length,
      totalAccidentCount: accidentLogs.length,
      latestFuel: fuelLogs[0] || null,
      latestMaint: maintLogs[0] || null,
      latestAccident: accidentLogs[0] || null,
      nextMaintenanceDate: maintLogs.length > 0 ? maintLogs[0].next_due_date : null
    };
  },

  /**
   * 운행신청 → 운행일지 연결용: 미작성 신청건 가져오기
   */
  getLinkedRequests(vehicleId) {
    const data = this.state.data;
    const vid = vehicleId || this.state.activeVehicleId;
    const requests = (data.DriveRequests || []).filter(r => r.vehicle_id === vid);
    const logs = (data.DriveLogs || []).filter(l => l.vehicle_id === vid);
    const loggedReqIds = new Set(logs.map(l => l.request_id).filter(Boolean));

    return requests.filter(r =>
      (r.approval_status === '확정(우선권)' || r.approval_status === '승인') &&
      !loggedReqIds.has(r.request_id)
    );
  },

  /**
   * 보험 만료 임박 차량 경고 리스트 (30일 이내)
   */
  getInsuranceAlerts() {
    const vehicles = this.state.data.Vehicles || [];
    const insurances = this.state.data.Insurance || [];
    const today = new Date(); today.setHours(0,0,0,0);
    const alerts = [];

    vehicles.forEach(v => {
      const ins = insurances.find(i => i.vehicle_id === v.vehicle_id);
      const endStr = ins ? (ins.insurance_end || ins.end_date) : v.insurance_end;
      if (!endStr) return;
      const end = new Date(endStr); end.setHours(0,0,0,0);
      const dday = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (dday <= 30) {
        alerts.push({ vehicle_id: v.vehicle_id, model: v.model, dday, endDate: endStr, expired: dday <= 0 });
      }
    });

    return alerts;
  },

  /**
   * DriveRequests 중복 데이터 자동 정돈 (Deduplication)
   */
  deduplicateDriveRequests(requests = []) {
    const seen = new Set();
    const result = [];

    requests.forEach(req => {
      if (!req) return;
      const vid = String(req.vehicle_id || '').trim();
      const date = String(req.drive_date || '').trim();
      const start = String(req.start_time || '').trim();
      const end = String(req.end_time || '').trim();
      const key = `${vid}_${date}_${start}_${end}`;

      if (!seen.has(key)) {
        seen.add(key);
        result.push(req);
      }
    });

    return result;
  },

  /**
   * 중복 예약 검증 함수 (분 단위 100% 정밀 비교)
   * @param {string} vehicle_id 차량번호
   * @param {string} drive_date 운행일자 (YYYY-MM-DD)
   * @param {string} start_time (HH:MM)
   * @param {string} end_time (HH:MM)
   * @param {string} [excludeReqId] 제외할 신청 ID
   * @returns {Object|null} 중복된 기존 예약 객체 또는 null
   */
  checkBookingConflict(vehicle_id, drive_date, start_time, end_time, excludeReqId = null) {
    const requests = this.state.data.DriveRequests || [];

    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const parts = String(timeStr).split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    };

    const newStart = toMinutes(start_time);
    const newEnd = toMinutes(end_time);

    const conflict = requests.find(req => {
      if (excludeReqId && req.request_id === excludeReqId) return false;
      if (String(req.vehicle_id).trim() !== String(vehicle_id).trim()) return false;
      if (String(req.drive_date).trim() !== String(drive_date).trim()) return false;
      if (req.approval_status === '반려') return false;

      const reqStart = toMinutes(req.start_time);
      const reqEnd = toMinutes(req.end_time);

      // 시간대 겹침 판단: (newStart < reqEnd && newEnd > reqStart)
      return (newStart < reqEnd && newEnd > reqStart);
    });

    return conflict || null;
  },

  /**
   * 운행 신청 삭제 (취소)
   */
  async deleteDriveRequest(requestId) {
    const updatedReqs = (this.state.data.DriveRequests || []).filter(r => String(r.request_id) !== String(requestId));
    const updatedData = { ...this.state.data, DriveRequests: updatedReqs };

    AppAPI.saveStorage(updatedData);
    this.setState({ data: updatedData });

    // 백엔드 삭제 전송
    await AppAPI.request('deleteDriveRequest', { request_id: requestId });
    return true;
  },

  /**
   * 운행일지 삭제
   */
  async deleteDriveLog(logId) {
    const updatedLogs = (this.state.data.DriveLogs || []).filter(l => String(l.log_id) !== String(logId));
    const updatedData = { ...this.state.data, DriveLogs: updatedLogs };

    AppAPI.saveStorage(updatedData);
    this.setState({ data: updatedData });

    // 백엔드 삭제 전송
    await AppAPI.request('deleteDriveLog', { log_id: logId });
    return true;
  },

  /**
   * 운행일지 수정
   */
  async updateDriveLog(logData) {
    const logs = [...(this.state.data.DriveLogs || [])];
    const idx = logs.findIndex(l => String(l.log_id) === String(logData.log_id));
    if (idx !== -1) {
      logs[idx] = { ...logs[idx], ...logData };
      const updatedData = { ...this.state.data, DriveLogs: logs };
      AppAPI.saveStorage(updatedData);
      this.setState({ data: updatedData });
    }
    await AppAPI.request('updateDriveLog', logData);
    return true;
  },

  /**
   * 운행 시간 / 차량 변경 협의 요청 전송
   */
  async sendTimeNegotiationRequest(payload) {
    const { target_vehicle_id, drive_date, my_name, suggested_start, suggested_end, suggested_vehicle, message } = payload;

    const notifMsg = `💬 [${my_name}] 님으로부터 [${target_vehicle_id}] (${drive_date}) 차량 운행 변경 협의가 도착했습니다:\n- 메시지: "${message}"\n- 조정 제안시간: ${suggested_start && suggested_end ? `${suggested_start}~${suggested_end}` : '기존 동일'}${suggested_vehicle ? `\n- 대체 추천차량: ${suggested_vehicle}` : ''}`;

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type: 'WARN',
      title: '💬 차량 운행 시간/차량 변경 협의 요청',
      message: notifMsg,
      read: false,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const notifs = [newNotif, ...(this.state.data.Notifications || [])];
    this.setState({ data: { ...this.state.data, Notifications: notifs } });

    try {
      await AppAPI.request('sendGoogleChatNotification', { text: notifMsg });
    } catch (e) {}

    return { success: true };
  },

  /**
   * 차량, 하이패스, 보험 통합 등록
   */
  async createVehicle(vehicleData, insuranceData) {
    let user = this.state.currentUser;
    if (!user) {
      user = {
        user_id: `ADMIN-${Date.now()}`,
        name: '차량관리자',
        team: '운영지원팀',
        position: '차량관리담당자',
        email: 'admin@gde.or.kr',
        status: '재직',
        created_at: new Date().toISOString().split('T')[0]
      };
      this.setState({ currentUser: user });
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

    let currentIns = null;
    const iIdx = insurances.findIndex(i => i.vehicle_id === vehicleId);
    if (iIdx !== -1) {
      insurances[iIdx] = { ...insurances[iIdx], ...insuranceData };
      currentIns = insurances[iIdx];
    } else if (insuranceData) {
      currentIns = { vehicle_id: vehicleId, ...insuranceData };
      insurances.push(currentIns);
    }

    const updatedData = { ...this.state.data, Vehicles: vehicles, Insurance: insurances };
    AppAPI.saveStorage(updatedData);

    this.setState({ data: updatedData });
    await AppAPI.request('updateVehicle', { vehicle: vehicles[vIdx], insurance: currentIns });
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
    const updatedData = { ...this.state.data, Vehicles: vehicles, Insurance: insurances };

    AppAPI.saveStorage(updatedData);

    const newActiveId = vehicles.length > 0 ? vehicles[0].vehicle_id : '';
    this.setState({ data: updatedData, activeVehicleId: newActiveId });
    await AppAPI.request('deleteVehicle', { vehicle_id: vehicleId });
    return { success: true };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppStore;
}
