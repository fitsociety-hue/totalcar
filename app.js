/**
 * 강동어울림복지관 차량통합관리 - 메인 애플리케이션 수석 컨트롤러 (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚗 Initializing Gangdong Eoullim Vehicle Integrated App...');

  // 1. DOM 요소 바인딩
  const roleSelect = document.getElementById('role-selector');
  const splashScreen = document.getElementById('splash-screen');
  const mobileContent = document.getElementById('mobile-content');
  const desktopWorkspace = document.getElementById('desktop-workspace');
  const tabItems = document.querySelectorAll('.tab-item');
  const modalOverlay = document.getElementById('modal-overlay');
  const btnViewMobile = document.getElementById('btn-view-mobile');
  const btnViewDesktop = document.getElementById('btn-view-desktop');
  const appWrapper = document.querySelector('.app-wrapper');

  // 스플래시 화면 1.2초 후 자동 숨김
  setTimeout(() => {
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      setTimeout(() => splashScreen.style.display = 'none', 500);
    }
  }, 1200);

  // 2. 상태 변경 구독 및 뷰 갱신
  AppStore.subscribe((state) => {
    renderApp(state);
  });

  // 3. 이벤트 리스너 즉시 등록 (Non-blocking: 즉시 반응)

  // 3.1 역할 변경 스위처 (테스트용)
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const position = e.target.value;
      if (position) {
        AppStore.setCurrentUserByRole(position);
        showToast(`사용자 권한이 [${position}] (으)로 전환되었습니다.`);
      }
    });
  }

  // 상단바 로그인/회원가입/로그아웃 버튼 핸들러
  const btnHeaderLogin = document.getElementById('btn-header-login');
  if (btnHeaderLogin) btnHeaderLogin.addEventListener('click', openLoginModal);

  const btnHeaderSignup = document.getElementById('btn-header-signup');
  if (btnHeaderSignup) btnHeaderSignup.addEventListener('click', openSignupModal);

  const btnHeaderLogout = document.getElementById('btn-header-logout');
  if (btnHeaderLogout) btnHeaderLogout.addEventListener('click', () => {
    AppStore.logout();
    if (roleSelect) roleSelect.value = '';
    showToast('성공적으로 로그아웃 되었습니다.');
  });

  const btnMobileLogin = document.getElementById('btn-mobile-login');
  if (btnMobileLogin) btnMobileLogin.addEventListener('click', openLoginModal);

  // 뷰 모드 전환 버튼 핸들러 (모바일 전용 vs PC 대시보드)
  if (btnViewMobile) {
    btnViewMobile.addEventListener('click', () => {
      AppStore.setState({ viewMode: 'mobile' });
      showToast('📱 모바일 앱 전용 뷰로 전환되었습니다.');
    });
  }

  if (btnViewDesktop) {
    btnViewDesktop.addEventListener('click', () => {
      AppStore.setState({ viewMode: 'desktop' });
      showToast('🖥️ PC 대시보드 뷰로 전환되었습니다.');
    });
  }

  // 3.2 모바일 하단 탭바 전환
  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      tabItems.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      AppStore.setState({ activeTab: tabName });
    });
  });

  // 3.3 모달 닫기버튼 글로벌 바인딩
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close-btn') || e.target === modalOverlay) {
      closeModal();
    }
  });

  // 초기 1회 렌더링 (즉시 렌더링)
  renderApp(AppStore.state);

  // 4. 백그라운드 DB 데이터 비동기 로드 (Non-blocking)
  AppStore.loadInitialData().then(() => {
    if (roleSelect && AppStore.state.currentUser) {
      roleSelect.value = AppStore.state.currentUser.position || '';
    }
  });

  /**
   * 메인 렌더링 루틴
   */
  function renderApp(state) {
    const { currentUser, activeVehicleId, activeTab, viewMode, data } = state;
    const activeVehicle = AppStore.getActiveVehicle();
    const insurance = (data.Insurance || []).find(i => i.vehicle_id === activeVehicleId) || {};

    // 뷰 모드 클래스 적용
    if (appWrapper) {
      if (viewMode === 'mobile') {
        appWrapper.classList.add('mode-mobile');
        appWrapper.classList.remove('mode-desktop');
        if (btnViewMobile) {
          btnViewMobile.style.borderColor = 'var(--accent-gold)';
          btnViewMobile.style.color = 'var(--accent-gold)';
        }
        if (btnViewDesktop) {
          btnViewDesktop.style.borderColor = 'var(--border-glass)';
          btnViewDesktop.style.color = 'var(--text-main)';
        }
      } else {
        appWrapper.classList.add('mode-desktop');
        appWrapper.classList.remove('mode-mobile');
        if (btnViewDesktop) {
          btnViewDesktop.style.borderColor = 'var(--accent-gold)';
          btnViewDesktop.style.color = 'var(--accent-gold)';
        }
        if (btnViewMobile) {
          btnViewMobile.style.borderColor = 'var(--border-glass)';
          btnViewMobile.style.color = 'var(--text-main)';
        }
      }
    }

    // 상단바 및 모바일 헤더 사용자 세션 정보 반영
    const headerUserName = document.getElementById('header-user-name');
    const headerUserRole = document.getElementById('header-user-role');
    const btnLogin = document.getElementById('btn-header-login');
    const btnSignup = document.getElementById('btn-header-signup');
    const btnLogout = document.getElementById('btn-header-logout');

    if (currentUser) {
      if (headerUserName) headerUserName.textContent = currentUser.name;
      if (headerUserRole) headerUserRole.textContent = currentUser.position;
      if (btnLogin) btnLogin.style.display = 'none';
      if (btnSignup) btnSignup.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'inline-flex';
    } else {
      if (headerUserName) headerUserName.textContent = '손님';
      if (headerUserRole) headerUserRole.textContent = '비로그인';
      if (btnLogin) btnLogin.style.display = 'inline-flex';
      if (btnSignup) btnSignup.style.display = 'inline-flex';
      if (btnLogout) btnLogout.style.display = 'none';
    }

    // [A] 모바일 뷰 렌더링 (탭별 분기 - 한 화면 1-Screen 최적화)
    if (mobileContent) {
      if (activeTab === 'home') {
        const pendingCount = data.DriveRequests.filter(r => r.approval_status === '대기').length;
        mobileContent.innerHTML = `
          ${AppComponents.renderVehicleVisualizer(activeVehicle, data.Vehicles)}
          ${AppComponents.renderDigitalExtras(activeVehicle, insurance, pendingCount)}
        `;
      } else if (activeTab === 'schedule') {
        mobileContent.innerHTML = `
          ${AppComponents.renderBookingCalendar(data.DriveRequests, activeVehicleId)}
        `;
      } else if (activeTab === 'drivelog') {
        mobileContent.innerHTML = renderDriveLogTab(data.DriveLogs, activeVehicleId);
      } else if (activeTab === 'maint') {
        mobileContent.innerHTML = renderMaintenanceAndAccidentsTab(data, activeVehicleId);
      } else if (activeTab === 'admin') {
        mobileContent.innerHTML = renderAdminAndReportTab(data, currentUser);
      }

      // 차량 선택 드롭다운 리스너 바인딩
      const vSelect = document.getElementById('vehicle-select-dropdown');
      if (vSelect) {
        vSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (val === '__ADD_NEW__') {
            openVehicleModal();
          } else {
            AppStore.setState({ activeVehicleId: val });
            showToast(`🚘 선택 차량이 [${val}] (으)로 유기적 연동되었습니다.`);
          }
        });
      }

      // 모바일 뷰 내 버튼 리스너 바인딩
      bindTabButtons();
    }

    // [B] 데스크톱 대시보드 렌더링 (PC 멀티컬럼 와이드 뷰)
    if (desktopWorkspace) {
      desktopWorkspace.innerHTML = `
        <div class="desktop-header">
          <div>
            <h2>${APP_CONFIG.ORGANIZATION_NAME} 차량 통합 관리 대시보드</h2>
            <div style="font-size:0.85rem; color:var(--text-muted);">
              현재 접속자: <strong style="color:var(--accent-gold);">${currentUser ? currentUser.name : '손님'}</strong> (${currentUser ? currentUser.position : '비로그인'}) | 
              선택 차량: <strong style="color:var(--status-emerald);">${activeVehicle.vehicle_id}</strong> (${activeVehicle.model})
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            ${currentUser && ['차량관리담당자', '사무국장', '관장'].includes(currentUser.position) ? `
            <button id="btn-desktop-add-veh" class="btn-primary" style="width:auto; padding:8px 14px; font-size:0.85rem;">+ 차량 등록</button>
            ` : ''}
            <button id="btn-desktop-request" class="btn-primary" style="width:auto; padding:8px 14px; font-size:0.85rem;">+ 운행 신청</button>
            <button id="btn-desktop-report" class="btn-secondary" style="width:auto; padding:8px 14px; font-size:0.85rem;">📋 월별보고서 인쇄/PDF</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div>
            ${AppComponents.renderBookingCalendar(data.DriveRequests, activeVehicleId)}
          </div>
          <div>
            ${renderDriveLogTab(data.DriveLogs, activeVehicleId)}
          </div>
        </div>

        <div style="margin-top:16px;">
          ${renderMaintenanceAndAccidentsTab(data, activeVehicleId)}
        </div>

        ${AppComponents.renderVehicleManagementPanel(data.Vehicles, data.Insurance)}
        ${AppComponents.renderGoogleWorkspacePanel()}
      `;

      // 데스크톱 상단 버튼 이벤트 바인딩
      const btnDeskAdd = document.getElementById('btn-desktop-add-veh');
      if (btnDeskAdd) btnDeskAdd.addEventListener('click', () => openVehicleModal());
      const btnDeskReq = document.getElementById('btn-desktop-request');
      if (btnDeskReq) btnDeskReq.addEventListener('click', openRequestModal);
      const btnDeskRep = document.getElementById('btn-desktop-report');
      if (btnDeskRep) btnDeskRep.addEventListener('click', openMonthlyReportModal);
      bindTabButtons();
    }
  }

  /**
   * 탭별 내부 동적 HTML 렌더러
   */
  function renderDriveLogTab(logs, vehicleId) {
    const vehLogs = logs.filter(l => l.vehicle_id === vehicleId);
    return `
      <div class="glass-panel" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1rem; font-weight:700; display:flex; align-items:center; gap:6px;"><span>📑</span> 차량운행일지 목록</h3>
          <button id="btn-open-drivelog-modal" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:auto;">+ 운행일지 작성</button>
        </div>

        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width:25%;">운행일자</th>
                <th style="width:25%;">운전자</th>
                <th style="width:30%;">목적지</th>
                <th style="width:20%;">주행거리</th>
              </tr>
            </thead>
            <tbody>
              ${vehLogs.map(l => `
                <tr>
                  <td><strong class="nobr">${l.date}</strong></td>
                  <td><span class="nobr">${l.driver_name || '김복지'}</span></td>
                  <td style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.destination}">${l.destination}</td>
                  <td><strong style="color:var(--accent-gold);" class="nobr">${l.distance_km} km</strong></td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:20px;">작성된 운행일지가 없습니다.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderMaintenanceAndAccidentsTab(data, vehicleId) {
    const fuelLogs = data.Fuel.filter(f => f.vehicle_id === vehicleId);
    const maintLogs = data.Maintenance.filter(m => m.vehicle_id === vehicleId);
    const accLogs = data.Accidents.filter(a => a.vehicle_id === vehicleId);

    return `
      <div class="glass-panel" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1rem; font-weight:700; display:flex; align-items:center; gap:6px;"><span>🛠️</span> 차계부 및 정비/사고 이력</h3>
          <div style="display:flex; gap:6px;">
            <button id="btn-open-accident-modal" class="btn-secondary btn-emergency" style="padding:4px 10px; font-size:0.75rem; width:auto;">🚨 사고 경위서 작성 (v1.1)</button>
            <button id="btn-open-fuel-modal" class="btn-primary" style="padding:4px 10px; font-size:0.75rem; width:auto;">+ 주유 입력</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="font-size:0.75rem; color:var(--text-muted);">최근 주유 기록 (${fuelLogs.length}건)</div>
            ${fuelLogs.length > 0 ? `<div style="font-size:0.95rem; font-weight:700; color:var(--accent-gold); margin-top:4px;" class="nobr">${fuelLogs[0].station} - ${fuelLogs[0].amount_won.toLocaleString()}원</div>` : '<div style="font-size:0.8rem; color:var(--text-dim);">기록 없음</div>'}
          </div>
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="font-size:0.75rem; color:var(--text-muted);">등록된 사고 경위서 (v1.1)</div>
            ${accLogs.length > 0 ? `<div style="font-size:0.9rem; font-weight:700; color:var(--status-rose); margin-top:4px;" class="nobr">${accLogs[0].accident_role}사고 (${accLogs[0].date})</div>` : '<div style="font-size:0.8rem; color:var(--text-dim); margin-top:4px;">무사고 차량</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminAndReportTab(data, currentUser) {
    const allReqs = data.DriveRequests || [];
    const todayReqs = allReqs.filter(r => r.drive_date === new Date().toISOString().slice(0,10));

    return `
      <div class="glass-panel" style="padding:16px;">
        <h3 style="font-size:1rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;"><span>⚙️</span> 시스템 통합 관리</h3>

        <div style="margin-bottom:16px; background:rgba(16,185,129,0.1); padding:12px; border-radius:var(--radius-md); border:1px solid rgba(16,185,129,0.3);">
          <h4 style="font-size:0.9rem; color:#10B981; margin-bottom:8px;">🔄 오늘 예약 현황 (${todayReqs.length}건) — 중복 자동 방지</h4>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">동일 차량·동일 시간대 중복 신청 시 자동 차단됩니다.</div>
          ${todayReqs.map(req => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:var(--radius-sm); margin-bottom:6px;">
              <div>
                <div style="font-weight:700; font-size:0.85rem;" class="nobr">${req.applicant_name} (${req.team || '-'})</div>
                <div style="font-size:0.75rem; color:var(--text-muted);" class="nobr">${req.vehicle_id} | ${req.drive_date} (${req.start_time}~${req.end_time})</div>
              </div>
              <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; background:rgba(16,185,129,0.2); color:#10B981; font-weight:600;">확정</span>
            </div>
          `).join('') || '<div style="font-size:0.8rem; color:var(--text-dim);">오늘 예약이 없습니다.</div>'}
        </div>

        <button id="btn-open-monthly-report" class="btn-primary" style="margin-top:10px;">
          📋 월별 운행일지 결재 보고서 조회 및 인쇄 (PDF)
        </button>

        ${AppComponents.renderVehicleManagementPanel(data.Vehicles, data.Insurance)}
        ${AppComponents.renderGoogleWorkspacePanel()}
      </div>
    `;
  }

  /**
   * 탭 내 동적 버튼 이벤트 바인딩
   */
  function bindTabButtons() {
    const btnReq = document.getElementById('btn-open-request-modal');
    if (btnReq) btnReq.addEventListener('click', openRequestModal);

    const btnLog = document.getElementById('btn-open-drivelog-modal');
    if (btnLog) btnLog.addEventListener('click', openDriveLogModal);

    const btnAcc = document.getElementById('btn-open-accident-modal');
    if (btnAcc) btnAcc.addEventListener('click', openAccidentModal);

    const btnFuel = document.getElementById('btn-open-fuel-modal');
    if (btnFuel) btnFuel.addEventListener('click', openFuelModal);

    const btnRep = document.getElementById('btn-open-monthly-report');
    if (btnRep) btnRep.addEventListener('click', openMonthlyReportModal);

    // 차량, 하이패스, 보험 등록 및 관리 버튼 핸들러
    const btnAddVeh = document.getElementById('btn-open-add-vehicle-modal');
    if (btnAddVeh) btnAddVeh.addEventListener('click', () => openVehicleModal());

    const btnEmptyAdd = document.getElementById('btn-empty-add-vehicle');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => openVehicleModal());

    document.querySelectorAll('.btn-edit-vehicle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const veh = AppStore.state.data.Vehicles.find(v => v.vehicle_id === id);
        if (veh) openVehicleModal(veh);
      });
    });

    document.querySelectorAll('.btn-delete-vehicle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm(`차량 [${id}] 정보 및 연동 하이패스/보험 데이터를 삭제하시겠습니까?`)) {
          const res = await AppStore.deleteVehicle(id);
          if (res.success) {
            showToast(`🗑️ 차량 [${id}] 정보가 삭제되었습니다.`);
          } else {
            showToast(res.message, 'error');
          }
        }
      });
    });

    // 구글 워크스페이스 메일 / 챗 테스트 버튼 핸들러
    const btnGmail = document.getElementById('btn-gsuite-gmail-test');
    if (btnGmail) {
      btnGmail.addEventListener('click', async () => {
        const user = AppStore.state.currentUser || { name: '김복지', email: 'kim@gde.or.kr' };
        await AppAPI.request('sendEmailNotification', {
          email: user.email,
          subject: '[강동어울림복지관] 구글 워크스페이스 알림 테스트',
          body: `안녕하세요 ${user.name} 님, 스마트 차량통합관리 구글 메일 알림 연동 테스트입니다.`
        });
        showToast(`📧 [Gmail] ${user.name} (${user.email}) 님 계정으로 알림 메일이 발송되었습니다.`);
      });
    }

    const btnChat = document.getElementById('btn-gsuite-chat-test');
    if (btnChat) {
      btnChat.addEventListener('click', async () => {
        await AppAPI.request('sendGoogleChatNotification', {
          text: `💬 [강동어울림복지관 차량통합관리] 구글 챗 스페이스 알림 연동 완료!`
        });
        showToast(`💬 [Google Chat] 복지관 차량관리 구글 챗 스페이스 알림 전송 완료!`);
      });
    }

    // (승인/반려 제거됨 — 중복 예약 자동 검증으로 대체)
  }

  /**
   * 모달 오픈 함수들
   */
  function openVehicleModal(vehicleToEdit = null) {
    const insuranceToEdit = vehicleToEdit 
      ? AppStore.state.data.Insurance.find(i => i.vehicle_id === vehicleToEdit.vehicle_id) 
      : null;
    openModal(AppComponents.renderVehicleFormModal(vehicleToEdit, insuranceToEdit));

    const form = document.getElementById('form-vehicle-manage');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vehData = {
          vehicle_id: document.getElementById('veh-id').value.trim(),
          model: document.getElementById('veh-model').value.trim(),
          register_date: document.getElementById('veh-regdate').value,
          current_mileage: Number(document.getElementById('veh-mileage').value) || 0,
          status: document.getElementById('veh-status').value,
          hipass_id: document.getElementById('veh-hipass-id').value.trim(),
          hipass_card: document.getElementById('veh-hipass-card').value.trim()
        };

        const insData = {
          company: document.getElementById('ins-company').value.trim(),
          claim_phone: document.getElementById('ins-phone').value.trim(),
          policy_number: document.getElementById('ins-policy').value.trim(),
          insurance_end: document.getElementById('ins-end').value,
          coverage: document.getElementById('ins-coverage').value.trim()
        };

        if (!vehData.vehicle_id || !vehData.model) {
          showToast('차량 번호와 차종/모델을 입력해 주세요.', 'error');
          return;
        }

        if (vehicleToEdit) {
          await AppStore.updateVehicle(vehicleToEdit.vehicle_id, vehData, insData);
          showToast(`✏️ 차량 [${vehData.vehicle_id}] 정보 및 하이패스/보험 연동이 수정되었습니다.`);
        } else {
          const res = await AppStore.createVehicle(vehData, insData);
          if (!res.success) {
            showToast(res.message, 'error');
            return;
          }
          showToast(`🎉 신규 차량 [${vehData.vehicle_id}] (${vehData.model}) 및 하이패스/보험 연동 완료!`);
        }

        closeModal();
      });
    }
  }

  function openRequestModal() {
    const activeVehId = AppStore.state.activeVehicleId;
    const user = AppStore.state.currentUser || { name: '김복지', team: '복지사업팀' };

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">🚗 차량 운행 신청</h3>
          <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
        </div>

        <form id="request-submit-form">
          <div class="form-group">
            <label>신청자 / 팀명</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="text" class="form-control" value="${user.name}" readonly>
              <input type="text" class="form-control" value="${user.team}" readonly>
            </div>
          </div>

          <div class="form-group">
            <label>신청 차량 *</label>
            <select name="vehicle_id" class="form-control" required>
              ${AppStore.state.data.Vehicles.map(v => `<option value="${v.vehicle_id}" ${v.vehicle_id === activeVehId ? 'selected' : ''}>${v.vehicle_id} (${v.model})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>운행 예정일 *</label>
            <input type="date" name="drive_date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div class="form-group">
            <label>운행 예정 시간 (시작 ~ 종료) *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="time" name="start_time" class="form-control" value="09:00" required>
              <input type="time" name="end_time" class="form-control" value="12:00" required>
            </div>
          </div>

          <div class="form-group">
            <label>운행 목적 *</label>
            <textarea name="purpose" class="form-control" rows="2" placeholder="운행 목적을 입력하십시오." required></textarea>
          </div>

          <div id="conflict-warning" style="display:none; color:var(--status-rose); font-size:0.8rem; margin-bottom:10px; font-weight:700;">
            ⚠️ 입력하신 시간대에 해당 차량의 기존 승인/대기 예약이 존재합니다! (중복 예약 불가능)
          </div>

          <button type="submit" class="btn-primary">운행 신청 제출</button>
        </form>
      </div>
    `;
    openModal();

    // 중복 예약 실시간 검증 핸들러
    const form = document.getElementById('request-submit-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const vehicle_id = formData.get('vehicle_id');
      const drive_date = formData.get('drive_date');
      const start_time = formData.get('start_time');
      const end_time = formData.get('end_time');

      // 실시간 중복 체크
      const isConflict = AppStore.checkBookingConflict(vehicle_id, drive_date, start_time, end_time);
      if (isConflict) {
        document.getElementById('conflict-warning').style.display = 'block';
        return;
      }

      await AppAPI.request('createDriveRequest', {
        applicant_id: user.user_id || '1001',
        applicant_name: user.name,
        team: user.team,
        vehicle_id,
        drive_date,
        start_time,
        end_time,
        purpose: formData.get('purpose')
      });

      await AppStore.loadInitialData();
      closeModal();
      showToast('운행 신청이 성공적으로 접수되었습니다.');
    });
  }

  function openDriveLogModal() {
    const activeVeh = AppStore.getActiveVehicle();
    const user = AppStore.state.currentUser || { name: '김복지' };

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">📑 차량운행일지 작성</h3>
          <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
        </div>

        <form id="drivelog-submit-form">
          <input type="hidden" name="vehicle_id" value="${activeVeh.vehicle_id}">

          <div class="form-group">
            <label>운행일자 / 운전자</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="date" name="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
              <input type="text" class="form-control" value="${user.name}" readonly>
            </div>
          </div>

          <div class="form-group">
            <label>출발시간 / 도착시간</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="time" name="depart_time" class="form-control" value="09:30" required>
              <input type="time" name="arrival_time" class="form-control" value="11:40" required>
            </div>
          </div>

          <div class="form-group">
            <label>목적지 / 운행목적</label>
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:8px;">
              <input type="text" name="destination" class="form-control" placeholder="목적지" required>
              <input type="text" name="purpose" class="form-control" placeholder="운행목적" required>
            </div>
          </div>

          <div class="form-group">
            <label>출발 km (직전 종료km 자동제안) / 도착 km *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="number" id="start_km" name="start_km" class="form-control" value="${activeVeh.current_mileage}" required>
              <input type="number" id="end_km" name="end_km" class="form-control" value="${activeVeh.current_mileage + 25}" required>
            </div>
          </div>

          <button type="submit" class="btn-primary">운행일지 저장</button>
        </form>
      </div>
    `;
    openModal();

    const form = document.getElementById('drivelog-submit-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const start_km = Number(formData.get('start_km'));
      const end_km = Number(formData.get('end_km'));
      const distance_km = end_km - start_km;

      await AppAPI.request('createDriveLog', {
        vehicle_id: activeVeh.vehicle_id,
        date: formData.get('date'),
        driver_id: user.user_id || '1001',
        driver_name: user.name,
        depart_time: formData.get('depart_time'),
        arrival_time: formData.get('arrival_time'),
        destination: formData.get('destination'),
        purpose: formData.get('purpose'),
        start_km,
        end_km,
        distance_km
      });

      await AppStore.loadInitialData();
      closeModal();
      showToast(`운행일지가 저장되었습니다. (주행거리: ${distance_km}km)`);
    });
  }

  function openAccidentModal() {
    const activeVeh = AppStore.getActiveVehicle();
    const user = AppStore.state.currentUser || { name: '김복지' };
    const insurance = AppStore.state.data.Insurance.find(i => i.vehicle_id === activeVeh.vehicle_id);

    modalOverlay.innerHTML = AppComponents.renderAccidentFormModal(activeVeh.vehicle_id, user.name, insurance);
    openModal();

    const form = document.getElementById('accident-submit-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        await AppAPI.request('createAccidentLog', {
          vehicle_id: activeVeh.vehicle_id,
          date: formData.get('date'),
          driver_id: user.user_id || '1001',
          driver_name: user.name,
          location: formData.get('location'),
          accident_role: formData.get('accident_role'),
          damage_person_yn: formData.get('damage_person_yn') || 'N',
          damage_person_detail: formData.get('damage_person_detail') || '',
          damage_property_yn: formData.get('damage_property_yn') || 'N',
          damage_property_detail: formData.get('damage_property_detail') || '',
          counterpart_name: formData.get('counterpart_name') || '',
          counterpart_phone: formData.get('counterpart_phone') || '',
          counterpart_insurance: formData.get('counterpart_insurance') || '',
          description: formData.get('description')
        });

        await AppStore.loadInitialData();
        closeModal();
        showToast('사고 경위서(v1.1)가 성공적으로 접수되었습니다.');
      });
    }
  }

  function openFuelModal() {
    const activeVeh = AppStore.getActiveVehicle();

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">⛽ 주유 기록 입력</h3>
          <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
        </div>

        <form id="fuel-submit-form">
          <input type="hidden" name="vehicle_id" value="${activeVeh.vehicle_id}">
          <div class="form-group">
            <label>주유 일자 / 주유소명</label>
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:8px;">
              <input type="date" name="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
              <input type="text" name="station" class="form-control" placeholder="주유소명" value="GS칼텍스 강동주유소" required>
            </div>
          </div>
          <div class="form-group">
            <label>주유 금액(원) / 주유량(L)</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="number" name="amount_won" class="form-control" value="65000" required>
              <input type="number" step="0.1" name="liter" class="form-control" value="42.0" required>
            </div>
          </div>
          <button type="submit" class="btn-primary">주유 기록 저장</button>
        </form>
      </div>
    `;
    openModal();

    const form = document.getElementById('fuel-submit-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const amount = Number(formData.get('amount_won'));
      const liter = Number(formData.get('liter'));
      const unit_price = Math.round(amount / liter);

      await AppAPI.request('createFuelLog', {
        vehicle_id: activeVeh.vehicle_id,
        date: formData.get('date'),
        station: formData.get('station'),
        amount_won: amount,
        liter,
        unit_price
      });

      await AppStore.loadInitialData();
      closeModal();
      showToast(`주유 기록이 저장되었습니다. (리터당 단가: ${unit_price.toLocaleString()}원)`);
    });
  }

  function openMonthlyReportModal() {
    const activeVeh = AppStore.getActiveVehicle();
    const logs = AppStore.state.data.DriveLogs.filter(l => l.vehicle_id === activeVeh.vehicle_id);

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel" style="max-width:780px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">📋 월별 운행일지 보고서 (인쇄/PDF 미리보기)</h3>
          <div style="display:flex; gap:8px;">
            <button onclick="window.print()" class="btn-primary" style="padding:4px 12px; font-size:0.8rem; width:auto;">🖨️ 인쇄 / PDF 출력</button>
            <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
          </div>
        </div>
        ${AppComponents.renderMonthlyApprovalReport('2026년 08월', activeVeh.vehicle_id, logs, AppStore.state.data.ApprovalLogs)}
      </div>
    `;
    openModal();
  }

  function openLoginModal() {
    modalOverlay.innerHTML = AppComponents.renderLoginModal();
    openModal();

    const form = document.getElementById('auth-login-form');
    const errorMsg = document.getElementById('login-error-msg');
    const btnSwitchSignup = document.getElementById('btn-switch-to-signup');

    if (btnSwitchSignup) {
      btnSwitchSignup.addEventListener('click', openSignupModal);
    }

    // 퀵 데모 로그인 리스너
    document.querySelectorAll('.btn-quick-demo-login').forEach(btn => {
      btn.addEventListener('click', () => {
        const position = btn.dataset.role;
        AppStore.setCurrentUserByRole(position);
        closeModal();
        showToast(`[${position}] 계정으로 1초 빠른 로그인 되었습니다.`);
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const identity = formData.get('identity');
        const password = formData.get('password');

        const res = AppStore.login(identity, password);
        if (!res.success) {
          errorMsg.textContent = `⚠️ ${res.message}`;
          errorMsg.style.display = 'block';
          return;
        }

        closeModal();
        showToast(`환영합니다! ${res.user.name} (${res.user.position}) 님 로그인 완료.`);
      });
    }
  }

  function openSignupModal() {
    modalOverlay.innerHTML = AppComponents.renderSignupModal();
    openModal();

    const form = document.getElementById('auth-signup-form');
    const errorMsg = document.getElementById('signup-error-msg');
    const btnSwitchLogin = document.getElementById('btn-switch-to-login');

    if (btnSwitchLogin) {
      btnSwitchLogin.addEventListener('click', openLoginModal);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const password = formData.get('password');
        const password_confirm = formData.get('password_confirm');

        if (password !== password_confirm) {
          errorMsg.textContent = '⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다.';
          errorMsg.style.display = 'block';
          return;
        }

        const userData = {
          name: formData.get('name'),
          team: formData.get('team'),
          position: formData.get('position'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          password
        };

        const res = await AppStore.signup(userData);
        if (!res.success) {
          errorMsg.textContent = `⚠️ ${res.message}`;
          errorMsg.style.display = 'block';
          return;
        }

        closeModal();
        showToast(`🎉 회원가입 성공! ${res.user.name} 님으로 로그인되었습니다.`);
      });
    }
  }

  function openModal() {
    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  /**
   * 토스트 알림 메시지 출력
   */
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span> <div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
});
