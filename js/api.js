/**
 * 강동어울림복지관 차량통합관리 - GAS API & LocalStorage Fallback 엔진 (js/api.js)
 */
const AppAPI = {
  // LocalStorage Key
  STORAGE_KEY: 'GANGDONG_TOTALCAR_DB_V1',

  /**
   * DB 초기화 (LocalStorage가 비어있으면 MOCK_DATA 세팅)
   */
  initStorage() {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
    }
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error('LocalStorage parse error, resetting mock data:', e);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(MOCK_DATA));
      return MOCK_DATA;
    }
  },

  /**
   * LocalStorage 전체 저장
   */
  saveStorage(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * GAS Web App HTTP 요청 (또는 Fallback)
   */
  async request(action, payload = {}) {
    const requestData = { action, ...payload };
    
    // 1차 시도: GAS Web App POST fetch
    if (APP_CONFIG.GAS_WEB_APP_URL && !APP_CONFIG.GAS_WEB_APP_URL.includes('YOUR_GAS')) {
      try {
        const response = await fetch(APP_CONFIG.GAS_WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.status === 'success') {
            return resJson.data;
          }
        }
      } catch (err) {
        console.warn('GAS Endpoint fetch error, switching to LocalStorage mode:', err);
      }
    }

    // 2차 Fallback: LocalStorage 오프라인 데이터 처리
    return this.handleOfflineAction(action, payload);
  },

  /**
   * 오프라인 LocalStorage 처리기
   */
  handleOfflineAction(action, payload) {
    const db = this.initStorage();

    switch (action) {
      case 'getInitialData':
        return db;

      case 'createDriveRequest': {
        const newReq = {
          request_id: `REQ-${Date.now()}`,
          created_at: new Date().toLocaleString(),
          approval_status: '대기',
          ...payload
        };
        db.DriveRequests.unshift(newReq);
        this.saveStorage(db);
        return newReq;
      }

      case 'approveDriveRequest': {
        const reqIndex = db.DriveRequests.findIndex(r => r.request_id === payload.request_id);
        if (reqIndex !== -1) {
          db.DriveRequests[reqIndex].approval_status = payload.status; // '승인' 또는 '반려'
          db.DriveRequests[reqIndex].approver_id = payload.approver_id;
          this.saveStorage(db);
          return db.DriveRequests[reqIndex];
        }
        throw new Error('해당 신청을 찾을 수 없습니다.');
      }

      case 'createDriveLog': {
        const newLog = {
          log_id: `LOG-${Date.now()}`,
          status: '작성완료',
          ...payload
        };
        db.DriveLogs.unshift(newLog);

        // 차량 누적 거리 자동 갱신
        const vehicle = db.Vehicles.find(v => v.vehicle_id === payload.vehicle_id);
        if (vehicle && payload.end_km > vehicle.current_mileage) {
          vehicle.current_mileage = Number(payload.end_km);
        }
        this.saveStorage(db);
        return newLog;
      }

      case 'createFuelLog': {
        const newFuel = {
          fuel_id: `FUEL-${Date.now()}`,
          ...payload
        };
        db.Fuel.unshift(newFuel);
        this.saveStorage(db);
        return newFuel;
      }

      case 'createMaintenanceLog': {
        const newMaint = {
          maint_id: `MAINT-${Date.now()}`,
          ...payload
        };
        db.Maintenance.unshift(newMaint);
        this.saveStorage(db);
        return newMaint;
      }

      case 'createAccidentLog': {
        const newAcc = {
          accident_id: `ACC-${Date.now()}`,
          ...payload
        };
        db.Accidents.unshift(newAcc);
        this.saveStorage(db);
        return newAcc;
      }

      case 'createUserAccount': {
        const newUser = {
          user_id: payload.user_id || `USER-${Date.now()}`,
          ...payload
        };
        db.Users.push(newUser);
        this.saveStorage(db);
        return newUser;
      }

      case 'sendEmailNotification': {
        console.log('📧 [Gmail Simulation] Sent email to:', payload.email, payload.subject);
        return { sent: true, recipient: payload.email };
      }

      case 'sendGoogleChatNotification': {
        console.log('💬 [Google Chat Simulation] Sent message:', payload.text);
        return { sent: true };
      }

      case 'updateVehicleStatus': {
        const vehicle = db.Vehicles.find(v => v.vehicle_id === payload.vehicle_id);
        if (vehicle) {
          vehicle.status = payload.status;
          this.saveStorage(db);
          return vehicle;
        }
        throw new Error('차량을 찾을 수 없습니다.');
      }

      case 'createVehicle': {
        console.log('🚗 [Vehicle Create API] Added vehicle:', payload.vehicle);
        const vIdx = db.Vehicles.findIndex(v => v.vehicle_id === payload.vehicle.vehicle_id);
        if (vIdx === -1) {
          db.Vehicles.push(payload.vehicle);
        }
        if (payload.insurance) {
          const iIdx = db.Insurance.findIndex(i => i.vehicle_id === payload.vehicle.vehicle_id);
          if (iIdx === -1) {
            db.Insurance.push(payload.insurance);
          }
        }
        this.saveStorage(db);
        return { success: true };
      }

      case 'updateVehicle': {
        console.log('✏️ [Vehicle Update API] Updated vehicle:', payload.vehicle);
        const vIdx = db.Vehicles.findIndex(v => v.vehicle_id === payload.vehicle.vehicle_id);
        if (vIdx !== -1) {
          db.Vehicles[vIdx] = { ...db.Vehicles[vIdx], ...payload.vehicle };
        }
        if (payload.insurance) {
          const iIdx = db.Insurance.findIndex(i => i.vehicle_id === payload.vehicle.vehicle_id);
          if (iIdx !== -1) {
            db.Insurance[iIdx] = { ...db.Insurance[iIdx], ...payload.insurance };
          } else {
            db.Insurance.push(payload.insurance);
          }
        }
        this.saveStorage(db);
        return { success: true };
      }

      case 'deleteVehicle': {
        console.log('🗑️ [Vehicle Delete API] Deleted vehicle ID:', payload.vehicle_id);
        db.Vehicles = db.Vehicles.filter(v => v.vehicle_id !== payload.vehicle_id);
        db.Insurance = db.Insurance.filter(i => i.vehicle_id !== payload.vehicle_id);
        this.saveStorage(db);
        return { success: true };
      }

      default:
        return db;
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppAPI;
}
