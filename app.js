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
  if (btnHeaderLogin) btnHeaderLogin.addEventListener('click', () => openLoginModal());

  const btnHeaderSignup = document.getElementById('btn-header-signup');
  if (btnHeaderSignup) btnHeaderSignup.addEventListener('click', () => openSignupModal());

  const btnHeaderLogout = document.getElementById('btn-header-logout');
  if (btnHeaderLogout) btnHeaderLogout.addEventListener('click', () => {
    AppStore.logout();
    if (roleSelect) roleSelect.value = '';
    showToast('성공적으로 로그아웃 되었습니다.');
  });

  const btnMobileLogin = document.getElementById('btn-mobile-login');
  if (btnMobileLogin) btnMobileLogin.addEventListener('click', () => openLoginModal());

  const btnBell = document.getElementById('btn-mobile-bell');
  if (btnBell) btnBell.addEventListener('click', () => showToast('🔔 새로운 알림이 없습니다.'));

  const btnSettings = document.getElementById('btn-mobile-settings');
  if (btnSettings) btnSettings.addEventListener('click', () => showToast('⚙️ 시스템 설정 메뉴는 준비 중입니다.'));

  const btnDesktopHome = document.getElementById('btn-desktop-home');
  if (btnDesktopHome) btnDesktopHome.addEventListener('click', () => {
    AppStore.setState({ activeTab: 'home' });
    showToast('🏠 홈 화면으로 이동했습니다.');
  });

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

  // 3.1.1 상단 로고/브랜드 클릭 시 홈 이동 처리
  const btnBrandHome = document.getElementById('btn-brand-home');
  if (btnBrandHome) {
    btnBrandHome.addEventListener('click', () => {
      tabItems.forEach(t => {
        if (t.dataset.tab === 'home') t.classList.add('active');
        else t.classList.remove('active');
      });
      AppStore.setState({ activeTab: 'home' });
      showToast('🏠 홈 화면으로 이동했습니다.');
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

  // 3.3 모달 닫기버튼 및 바깥 배경 클릭 처리 (드래그 텍스트 선택 시 모달 닫힘 현상 완벽 방지)
  let mouseDownTarget = null;
  document.addEventListener('mousedown', (e) => {
    mouseDownTarget = e.target;
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close-btn')) {
      closeModal();
      return;
    }
    if (e.target === modalOverlay && mouseDownTarget === modalOverlay) {
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
        const summary = AppStore.getVehicleSummary(activeVehicleId);
        const insuranceAlerts = AppStore.getInsuranceAlerts();
        mobileContent.innerHTML = `
          ${AppComponents.renderServiceQuickGrid()}
          ${AppComponents.renderVehicleVisualizer(activeVehicle, data.Vehicles)}
        `;
      } else if (activeTab === 'schedule') {
        mobileContent.innerHTML = `
          ${AppComponents.renderBookingCalendar(data.DriveRequests, activeVehicleId, state.bookingFilterMode === 'all')}
        `;
      } else if (activeTab === 'drivelog') {
        mobileContent.innerHTML = renderDriveLogTab(data.DriveLogs, activeVehicleId);
      } else if (activeTab === 'maint') {
        mobileContent.innerHTML = renderMaintenanceAndAccidentsTab(data, activeVehicleId);
      } else if (activeTab === 'admin') {
        mobileContent.innerHTML = renderAdminAndReportTab(data, currentUser);
      }

      // 차량 선택 리스트 리스너 바인딩
      document.querySelectorAll('.vehicle-list-item').forEach(el => {
        el.addEventListener('click', (e) => {
          const val = e.currentTarget.dataset.id;
          AppStore.setState({ activeVehicleId: val });
          showToast(`🚘 기준 차량이 [${val}] (으)로 선택되었습니다.`);
        });
      });

      const btnListAdd = document.getElementById('btn-list-add-vehicle');
      if (btnListAdd) {
        btnListAdd.addEventListener('click', () => openVehicleModal());
      }

      // 모바일 뷰 내 버튼 리스너 바인딩
      bindTabButtons();
    }

    // [B] 데스크톱 대시보드 렌더링 (PC 멀티컬럼 와이드 뷰)
    if (desktopWorkspace) {
      const summary = AppStore.getVehicleSummary(activeVehicleId);
      const insuranceAlerts = AppStore.getInsuranceAlerts();

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

        ${AppComponents.renderIntegratedSummary(summary, insuranceAlerts)}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div>
            ${AppComponents.renderBookingCalendar(data.DriveRequests, activeVehicleId, state.bookingFilterMode === 'all')}
          </div>
          <div>
            ${renderDriveLogTab(data.DriveLogs, activeVehicleId)}
          </div>
        </div>

        <div style="margin-top:16px;">
          ${renderMaintenanceAndAccidentsTab(data, activeVehicleId)}
        </div>

        ${AppComponents.renderVehicleManagementPanel(data.Vehicles, data.Insurance)}
      `;

      // 데스크톱 상단 버튼 이벤트 바인딩
      const btnDeskAdd = document.getElementById('btn-desktop-add-veh');
      if (btnDeskAdd) btnDeskAdd.addEventListener('click', () => openVehicleModal());
      const btnDeskReq = document.getElementById('btn-desktop-request');
      if (btnDeskReq) btnDeskReq.addEventListener('click', () => openRequestModal());
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
                <th style="width:20%;">운행일자</th>
                <th style="width:20%;">운전자</th>
                <th style="width:25%;">목적지</th>
                <th style="width:18%;">주행거리</th>
                <th style="width:17%;">관리</th>
              </tr>
            </thead>
            <tbody>
              ${vehLogs.map(l => `
                <tr>
                  <td><strong class="nobr">${l.date}</strong></td>
                  <td><span class="nobr">${l.driver_name || '직원'}</span></td>
                  <td style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.destination}">${l.destination}</td>
                  <td><strong style="color:var(--accent-gold);" class="nobr">${l.distance_km || 0} km</strong></td>
                  <td>
                    <div style="display:flex; gap:4px;" class="nobr">
                      <button class="btn-edit-drivelog btn-secondary" data-id="${l.log_id}" style="padding:2px 6px; font-size:0.72rem; width:auto; border-color:var(--accent-gold); color:var(--accent-gold);" title="운행일지 수정">✏️ 수정</button>
                      <button class="btn-delete-drivelog btn-secondary" data-id="${l.log_id}" style="padding:2px 6px; font-size:0.72rem; width:auto; border-color:rgba(239,68,68,0.4); color:var(--status-rose);" title="운행일지 삭제">🗑️ 삭제</button>
                    </div>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="5" style="text-align:center; color:var(--text-dim); padding:20px;">작성된 운행일지가 없습니다.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderMaintenanceAndAccidentsTab(data, vehicleId) {
    const fuelLogs = (data.Fuel || []).filter(f => String(f.vehicle_id).trim() === String(vehicleId).trim());
    const maintLogs = (data.Maintenance || []).filter(m => String(m.vehicle_id).trim() === String(vehicleId).trim());
    const accLogs = (data.Accidents || []).filter(a => String(a.vehicle_id).trim() === String(vehicleId).trim());

    // 1. 주유 기록 테이블 행
    const fuelRowsHTML = fuelLogs.map(f => {
      const amount = Number(f.amount_won) || 0;
      const liter = Number(f.liter) || 0;
      const unitPrice = Number(f.unit_price) || (liter > 0 ? Math.round(amount / liter) : 0);
      return `
        <tr>
          <td><strong class="nobr">${f.date}</strong></td>
          <td><span class="nobr" style="color:var(--text-main); font-weight:600;">⛽ ${f.station || '주유소'}</span></td>
          <td><strong style="color:var(--accent-gold);" class="nobr">${amount.toLocaleString()}원 <small style="color:var(--text-muted); font-weight:normal;">(${liter}L)</small></strong></td>
          <td><span class="nobr" style="color:var(--text-muted); font-size:0.8rem;">${unitPrice.toLocaleString()}원/L</span></td>
        </tr>
      `;
    }).join('');

    // 2. 사고 경위서 & 정비 이력 통합 목록 행
    const combinedAccMaint = [
      ...accLogs.map(a => ({ type: '사고경위서', date: a.date, title: `${a.accident_role || '사고'} (${a.location || '장소미기재'})`, detail: a.description || '내용 없음', driver: a.driver_name || '운전자', extra: a.counterpart_name ? `상대: ${a.counterpart_name}` : '단독사고', isAccident: true })),
      ...maintLogs.map(m => ({ type: '정비/점검', date: m.in_date || m.date, title: m.reason || '정비점검', detail: m.detail || '점검완료', driver: '정비업체', extra: m.cost_total ? `${Number(m.cost_total).toLocaleString()}원` : '점검완료', isAccident: false }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const accMaintRowsHTML = combinedAccMaint.map(item => {
      return `
        <tr>
          <td>
            <span class="badge nobr" style="background:${item.isAccident ? 'rgba(239,68,68,0.15)' : 'rgba(52,152,219,0.15)'}; color:${item.isAccident ? '#EF4444' : '#3498db'}; border:1px solid ${item.isAccident ? 'rgba(239,68,68,0.3)' : 'rgba(52,152,219,0.3)'};">
              ${item.type}
            </span>
          </td>
          <td>
            <span class="nobr"><strong>${item.date}</strong></span><br>
            <span style="font-size:0.75rem; color:var(--text-muted);" class="nobr">👤 ${item.driver}</span>
          </td>
          <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="${item.title} - ${item.detail}">
            <strong style="color:var(--text-main); font-size:0.85rem;">${item.title}</strong><br>
            <span style="font-size:0.75rem; color:var(--text-muted);">${item.detail}</span>
          </td>
          <td>
            <span class="nobr" style="font-size:0.8rem; color:${item.isAccident ? 'var(--status-rose)' : 'var(--accent-gold)'}; font-weight:600;">
              ${item.extra}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- 섹션 1: ⛽ 차량 주유 및 연비 차계부 -->
        <div class="glass-panel" style="padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <h3 style="font-size:1.05rem; font-weight:700; display:flex; align-items:center; gap:6px; color:var(--accent-gold);">
              <span>⛽</span> 차량 주유 및 연비 기록 <small style="color:var(--text-muted); font-weight:normal;">(${fuelLogs.length}건)</small>
            </h3>
            <button id="btn-open-fuel-modal" class="btn-primary" style="padding:6px 14px; font-size:0.8rem; width:auto;">+ 주유 입력</button>
          </div>

          <div class="custom-table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width:25%;">주유일자</th>
                  <th style="width:30%;">주유소명</th>
                  <th style="width:25%;">주유금액 (주유량)</th>
                  <th style="width:20%;">단가(원/L)</th>
                </tr>
              </thead>
              <tbody>
                ${fuelRowsHTML || '<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:20px;">등록된 주유 기록이 없습니다.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 섹션 2: 🚨 사고 경위서 및 정비/점검 이력 -->
        <div class="glass-panel" style="padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <h3 style="font-size:1.05rem; font-weight:700; display:flex; align-items:center; gap:6px; color:var(--status-rose);">
              <span>🚨</span> 사고 경위서 및 정비/점검 이력 <small style="color:var(--text-muted); font-weight:normal;">(${combinedAccMaint.length}건)</small>
            </h3>
            <button id="btn-open-accident-modal" class="btn-secondary btn-emergency" style="padding:6px 12px; font-size:0.78rem; width:auto; border-color:rgba(239,68,68,0.4); color:var(--status-rose);">🚨 사고 경위서 작성 (v1.1)</button>
          </div>

          <div class="custom-table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width:18%;">구분</th>
                  <th style="width:22%;">일자/운전자</th>
                  <th style="width:38%;">사고 및 정비 상세 내용</th>
                  <th style="width:22%;">상태 / 상대방</th>
                </tr>
              </thead>
              <tbody>
                ${accMaintRowsHTML || '<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:20px;">등록된 사고 경위서 및 정비 내역이 없습니다. (무사고 차량)</td></tr>'}
              </tbody>
            </table>
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
          📋 월별 운행일지 결재 보고서 조회 및 인쇄 (PDF / EXCEL)
        </button>

        ${AppComponents.renderVehicleManagementPanel(data.Vehicles, data.Insurance)}
      </div>
    `;
  }

  /**
   * 로그인 체크 가드
   */
  function requireAuth(callback) {
    if (!AppStore.state.currentUser) {
      showToast('🔒 로그인이 필요한 서비스입니다. 먼저 로그인해 주세요.', 'error');
      openLoginModal();
      return false;
    }
    if (callback) callback();
    return true;
  }

  /**
   * 본인 작성 데이터 확인 가드 (이름, 팀명 일치 여부)
   */
  function isOwner(record) {
    const user = AppStore.state.currentUser;
    if (!user) return false;

    const recordName = (record.applicant_name || record.writer_name || record.driver_name || record.name || '').toString().trim();
    const recordTeam = (record.team || '').toString().trim();

    if (!recordName) return true; // 작성자 정보가 없는 구형 데이터는 허용

    if (recordTeam) {
      return (recordName === user.name.toString().trim()) && (recordTeam === user.team.toString().trim());
    }
    return recordName === user.name.toString().trim();
  }

  /**
   * 탭 내 동적 버튼 이벤트 바인딩
   */
  function bindTabButtons() {
    const btnReq = document.getElementById('btn-open-request-modal');
    if (btnReq) btnReq.addEventListener('click', () => requireAuth(() => openRequestModal()));

    const btnLog = document.getElementById('btn-open-drivelog-modal');
    if (btnLog) btnLog.addEventListener('click', () => requireAuth(() => openDriveLogModal()));

    const btnAcc = document.getElementById('btn-open-accident-modal');
    if (btnAcc) btnAcc.addEventListener('click', () => requireAuth(() => openAccidentModal()));

    const btnFuel = document.getElementById('btn-open-fuel-modal');
    if (btnFuel) btnFuel.addEventListener('click', () => requireAuth(() => openFuelModal()));

    const btnRep = document.getElementById('btn-open-monthly-report');
    if (btnRep) btnRep.addEventListener('click', () => requireAuth(() => openMonthlyReportModal()));

    // 1. 상단 캡슐 칩 메뉴 클릭 이벤트
    const chipReq = document.getElementById('chip-btn-request');
    if (chipReq) chipReq.addEventListener('click', () => requireAuth(() => openRequestModal()));

    const chipLog = document.getElementById('chip-btn-drivelog');
    if (chipLog) chipLog.addEventListener('click', () => requireAuth(() => openDriveLogModal()));
    const chipFuel = document.getElementById('chip-btn-fuel');
    if (chipFuel) chipFuel.addEventListener('click', () => requireAuth(() => openFuelModal()));
    const chipReport = document.getElementById('chip-btn-report');
    if (chipReport) chipReport.addEventListener('click', () => requireAuth(() => openMonthlyReportModal()));
    const chipStats = document.getElementById('chip-btn-stats');
    if (chipStats) chipStats.addEventListener('click', () => requireAuth(() => openMonthlyReportModal()));

    // 2. 4종 퀵 서비스 그리드 클릭 이벤트
    const qReq = document.getElementById('quick-service-request');
    if (qReq) qReq.addEventListener('click', () => requireAuth(() => openRequestModal()));
    const qLog = document.getElementById('quick-service-drivelog');
    if (qLog) qLog.addEventListener('click', () => requireAuth(() => openDriveLogModal()));
    const qFuel = document.getElementById('quick-service-fuel');
    if (qFuel) qFuel.addEventListener('click', () => requireAuth(() => openFuelModal()));
    const qAcc = document.getElementById('quick-service-accident');
    if (qAcc) qAcc.addEventListener('click', () => requireAuth(() => openAccidentModal()));

    // 3. (제거된 영웅 카드 버튼 리스너 영역)

    // 차량, 하이패스, 보험 등록 및 관리 버튼 핸들러
    const btnAddVeh = document.getElementById('btn-open-add-vehicle-modal');
    if (btnAddVeh) btnAddVeh.addEventListener('click', () => requireAuth(() => openVehicleModal()));

    const btnEmptyAdd = document.getElementById('btn-empty-add-vehicle');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => requireAuth(() => openVehicleModal()));

    document.querySelectorAll('.btn-edit-vehicle').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!requireAuth()) return;
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


    // 예약 현황 선택차량/전체차량 필터 버튼 핸들러
    const btnFilterSelected = document.getElementById('btn-booking-filter-selected');
    if (btnFilterSelected) {
      btnFilterSelected.addEventListener('click', () => {
        AppStore.setState({ bookingFilterMode: 'selected' });
      });
    }

    const btnFilterAll = document.getElementById('btn-booking-filter-all');
    if (btnFilterAll) {
      btnFilterAll.addEventListener('click', () => {
        AppStore.setState({ bookingFilterMode: 'all' });
      });
    }

    // 예약 현황 수정 / 삭제 (취소) 이벤트 위임 핸들러
    document.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-request');
      if (editBtn) {
        if (!requireAuth()) return;
        const reqId = editBtn.dataset.id;
        const reqToEdit = (AppStore.state.data.DriveRequests || []).find(r => String(r.request_id) === String(reqId));
        if (reqToEdit) {
          if (!isOwner(reqToEdit)) {
            showToast('⚠️ 본인이 작성한 데이터만 수정할 수 있습니다.', 'error');
            return;
          }
          openRequestModal(reqToEdit);
        }
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-request');
      if (deleteBtn) {
        if (!requireAuth()) return;
        const reqId = deleteBtn.dataset.id;
        const reqToDelete = (AppStore.state.data.DriveRequests || []).find(r => String(r.request_id) === String(reqId));
        if (reqToDelete) {
          if (!isOwner(reqToDelete)) {
            showToast('⚠️ 본인이 작성한 데이터만 삭제할 수 있습니다.', 'error');
            return;
          }
          if (confirm(`🗑️ [${reqToDelete.vehicle_id}] (${reqToDelete.drive_date} ${reqToDelete.start_time}~${reqToDelete.end_time}) 차량 운행 신청을 삭제(취소)하시겠습니까?`)) {
            const pin = prompt('삭제를 진행하려면 공통 삭제 비밀번호 4자리를 입력하세요.');
            if (pin === '0741') {
              await AppStore.deleteDriveRequest(reqId);
              showToast(`🗑️ 차량 운행 신청이 취소/삭제되었습니다.`);
            } else if (pin !== null) {
              showToast('⚠️ 비밀번호가 일치하지 않습니다. 삭제가 취소되었습니다.', 'error');
            }
          }
        }
        return;
      }

      // 운행 신청 기반 일지 작성 이벤트 위임 핸들러
      const createLogFromReqBtn = e.target.closest('.btn-create-drivelog-from-req');
      if (createLogFromReqBtn) {
        if (!requireAuth()) return;
        const reqId = createLogFromReqBtn.dataset.id;
        const req = (AppStore.state.data.DriveRequests || []).find(r => String(r.request_id) === String(reqId));
        if (req) {
          if (!isOwner(req)) {
            showToast('⚠️ 본인이 신청한 내역에 대해서만 일지를 작성할 수 있습니다.', 'error');
            return;
          }
          openDriveLogModal(null, req);
        }
        return;
      }

      // 운행일지 수정 / 삭제 이벤트 위임 핸들러
      const editLogBtn = e.target.closest('.btn-edit-drivelog');
      if (editLogBtn) {
        if (!requireAuth()) return;
        const logId = editLogBtn.dataset.id;
        const logToEdit = (AppStore.state.data.DriveLogs || []).find(l => String(l.log_id) === String(logId));
        if (logToEdit) {
          if (!isOwner(logToEdit)) {
            showToast('⚠️ 본인이 작성한 일지만 수정할 수 있습니다.', 'error');
            return;
          }
          openDriveLogModal(logToEdit);
        }
        return;
      }

      const deleteLogBtn = e.target.closest('.btn-delete-drivelog');
      if (deleteLogBtn) {
        if (!requireAuth()) return;
        const logId = deleteLogBtn.dataset.id;
        const logToDelete = (AppStore.state.data.DriveLogs || []).find(l => String(l.log_id) === String(logId));
        if (logToDelete) {
          if (!isOwner(logToDelete)) {
            showToast('⚠️ 본인이 작성한 일지만 삭제할 수 있습니다.', 'error');
            return;
          }
          if (confirm(`🗑️ [${logToDelete.date}] (${logToDelete.driver_name}) 운행일지 기록을 삭제하시겠습니까?`)) {
            const pin = prompt('삭제를 진행하려면 공통 삭제 비밀번호 4자리를 입력하세요.');
            if (pin === '0741') {
              await AppStore.deleteDriveLog(logId);
              showToast(`🗑️ 차량 운행일지가 성공적으로 삭제되었습니다.`);
            } else if (pin !== null) {
              showToast('⚠️ 비밀번호가 일치하지 않습니다. 삭제가 취소되었습니다.', 'error');
            }
          }
        }
        return;
      }
    });
  }

  /**
   * 공통 폼 제출 시 "⏳ 저장 중..." / "⏳ 로그인 중..." 인디케이터 처리 및 버튼 비활성화 헬퍼
   */
  function setFormSavingState(formElement, isSaving, customSavingText = '저장 중입니다...') {
    if (!formElement) return;
    const submitBtn = formElement.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (isSaving) {
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.innerHTML;
      }
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'not-allowed';
      submitBtn.innerHTML = `<span style="display:inline-block; animation:spin 1s infinite linear;">⏳</span> ${customSavingText}`;
      
      const toastMsg = customSavingText.includes('로그인')
        ? `⏳ 인증 서버 확인 및 로그인 처리 중입니다... 잠시만 기다려 주십시오.`
        : `⏳ 구글 스프레드시트에 저장하고 있습니다... 잠시만 기다려 주십시오.`;
      showToast(toastMsg);
    } else {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
      if (submitBtn.dataset.originalText) {
        submitBtn.innerHTML = submitBtn.dataset.originalText;
      }
    }
  }

  /**
   * 모달 오픈 함수들
   */
  function openVehicleModal(vehicleToEdit = null) {
    if (!AppStore.state.currentUser) {
      AppStore.setCurrentUserByRole('차량관리담당자');
    }
    const insuranceToEdit = vehicleToEdit 
      ? AppStore.state.data.Insurance.find(i => i.vehicle_id === vehicleToEdit.vehicle_id) 
      : null;

    modalOverlay.innerHTML = AppComponents.renderVehicleFormModal(vehicleToEdit, insuranceToEdit);
    openModal();

    const form = document.getElementById('form-vehicle-manage');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vehData = {
          vehicle_id: document.getElementById('veh-id').value.trim(),
          model: document.getElementById('veh-model').value.trim(),
          register_date: document.getElementById('veh-regdate').value,
          current_mileage: Number(document.getElementById('veh-mileage').value) || 0,
          status: document.getElementById('veh-status').value
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

        setFormSavingState(form, true, '차량 정보 저장 중...');
        try {
          if (vehicleToEdit) {
            await AppStore.updateVehicle(vehicleToEdit.vehicle_id, vehData, insData);
            closeModal();
            showToast(`✏️ 차량 [${vehData.vehicle_id}] 정보 및 하이패스/보험 연동이 수정되었습니다.`);
          } else {
            const res = await AppStore.createVehicle(vehData, insData);
            if (!res.success) {
              showToast(res.message, 'error');
              return;
            }
            closeModal();
            showToast(`🎉 신규 차량 [${vehData.vehicle_id}] (${vehData.model}) 및 하이패스/보험 연동 완료!`);
          }
        } finally {
          setFormSavingState(form, false);
        }
      });
    }
  }

  function openRequestModal(requestToEdit = null) {
    const activeVehId = requestToEdit ? requestToEdit.vehicle_id : AppStore.state.activeVehicleId;
    const user = AppStore.state.currentUser || { name: '김복지', team: '복지사업팀' };
    const vehicles = AppStore.state.data.Vehicles || [];

    const vehOptions = vehicles.map(v => {
      const vid = v.vehicle_id || (Array.isArray(v) ? v[0] : '미등록차량');
      const vmodel = v.model || (Array.isArray(v) ? v[1] : '승합차');
      return `<option value="${vid}" ${vid === activeVehId ? 'selected' : ''}>🚘 ${vid} (${vmodel})</option>`;
    }).join('');

    const defaultDate = requestToEdit ? requestToEdit.drive_date : new Date().toISOString().split('T')[0];
    const defaultStart = requestToEdit ? requestToEdit.start_time : '09:00';
    const defaultEnd = requestToEdit ? requestToEdit.end_time : '12:00';
    const defaultDriver = requestToEdit ? (requestToEdit.driver_name || requestToEdit.applicant_name) : user.name;
    const defaultCompanion = requestToEdit ? (requestToEdit.companion || '') : '';
    const defaultPurpose = requestToEdit ? (requestToEdit.purpose || '') : '';

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">${requestToEdit ? '✏️ 차량 운행 신청 수정' : '🚗 차량 운행 신청'}</h3>
          <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
        </div>

        <form id="request-submit-form">
          <input type="hidden" name="request_id" value="${requestToEdit ? requestToEdit.request_id : ''}">
          <div class="form-group">
            <label>신청자 / 팀명</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="text" class="form-control" value="${requestToEdit ? requestToEdit.applicant_name : user.name}" readonly>
              <input type="text" class="form-control" value="${requestToEdit ? (requestToEdit.team || user.team) : user.team}" readonly>
            </div>
          </div>

          <div class="form-group">
            <label>운전자 성명 * / 동승자 (선택)</label>
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:8px;">
              <input type="text" name="driver_name" class="form-control" value="${defaultDriver}" placeholder="운전자 성함" required>
              <input type="text" name="companion" class="form-control" value="${defaultCompanion}" placeholder="예: 김용필 외 2명 또는 이팀장, 박차량">
            </div>
          </div>

          <div class="form-group">
            <label>신청 차량 *</label>
            <select name="vehicle_id" class="form-control" required>
              ${vehOptions || '<option value="미등록">등록된 차량 없음</option>'}
            </select>
          </div>

          <div class="form-group">
            <label>📅 운행 예정일 *</label>
            <input type="date" name="drive_date" class="form-control" value="${defaultDate}" required>
          </div>

          <div class="form-group">
            <label>🕒 운행 예정 시간 (시작 ~ 종료) *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div style="position:relative; display:flex; align-items:center;">
                <span style="position:absolute; left:10px; color:var(--accent-gold); font-weight:700; pointer-events:none; font-size:0.85rem;">🕒 시작</span>
                <input type="time" name="start_time" class="form-control" value="${defaultStart}" style="padding-left:60px;" required>
              </div>
              <div style="position:relative; display:flex; align-items:center;">
                <span style="position:absolute; left:10px; color:var(--accent-gold); font-weight:700; pointer-events:none; font-size:0.85rem;">🕒 종료</span>
                <input type="time" name="end_time" class="form-control" value="${defaultEnd}" style="padding-left:60px;" required>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>운행 목적 *</label>
            <textarea name="purpose" class="form-control" rows="2" placeholder="운행 목적을 입력하십시오." required>${defaultPurpose}</textarea>
          </div>

          <div id="conflict-warning" style="display:none; color:var(--status-rose); font-size:0.8rem; margin-bottom:10px; font-weight:700;">
            ⚠️ 입력하신 시간대에 해당 차량의 기존 승인/대기 예약이 존재합니다! (중복 예약 불가능)
          </div>

          <button type="submit" class="btn-primary">${requestToEdit ? '운행 신청 수정 저장' : '운행 신청 제출'}</button>
        </form>
      </div>
    `;
    openModal();

    // 중복 예약 실시간 검증 핸들러
    const form = document.getElementById('request-submit-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const reqId = formData.get('request_id');
      const vehicle_id = formData.get('vehicle_id');
      const drive_date = formData.get('drive_date');
      const start_time = formData.get('start_time');
      const end_time = formData.get('end_time');

      // 실시간 중복 체크 (수정 시 본인 ID 제외)
      const priorReq = AppStore.checkBookingConflict(vehicle_id, drive_date, start_time, end_time, reqId || null);
      if (priorReq) {
        openTimeNegotiationModal(priorReq, vehicle_id, drive_date, start_time, end_time);
        return;
      }

      setFormSavingState(form, true, reqId ? '운행 신청 수정 중...' : '운행 신청 저장 중...');
      try {
        if (reqId) {
          // [수정] 기존 신청 업데이트
          const reqData = {
            request_id: reqId,
            driver_name: formData.get('driver_name'),
            companion: formData.get('companion') || '',
            vehicle_id,
            drive_date,
            start_time,
            end_time,
            purpose: formData.get('purpose')
          };
          await AppAPI.request('updateDriveRequest', reqData);
          await AppStore.loadInitialData();
          closeModal();
          showToast(`✏️ [${vehicle_id}] 차량 운행 신청 정보가 수정되었습니다.`);
        } else {
          // [신규] 새로운 신청 생성
          const newReq = {
            request_id: `REQ-${Date.now()}`,
            applicant_id: user.user_id || '1001',
            applicant_name: user.name,
            team: user.team || '복지사업팀',
            driver_name: formData.get('driver_name') || user.name,
            companion: formData.get('companion') || '',
            vehicle_id,
            drive_date,
            start_time,
            end_time,
            purpose: formData.get('purpose'),
            approval_status: '확정(우선권)',
            approver_id: '자동확정',
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };

          const currentReqs = AppStore.deduplicateDriveRequests([newReq, ...(AppStore.state.data.DriveRequests || [])]);
          const updatedData = { ...AppStore.state.data, DriveRequests: currentReqs };
          AppAPI.saveStorage(updatedData);
          AppStore.setState({
            data: updatedData,
            activeVehicleId: vehicle_id,
            bookingFilterMode: 'all'
          });

          await AppAPI.request('createDriveRequest', newReq);
          await AppStore.loadInitialData();
          closeModal();
          showToast(`🎉 [${vehicle_id}] 차량 운행 신청이 성공적으로 완료되었습니다.`);
        }
      } finally {
        setFormSavingState(form, false);
      }
    });
  }

  function openTimeNegotiationModal(priorReq, targetVehicleId, driveDate, startTime, endTime) {
    const user = AppStore.state.currentUser || { name: '익명 직원' };
    const vehicles = AppStore.state.data.Vehicles || [];

    modalOverlay.innerHTML = AppComponents.renderTimeNegotiationModal(
      priorReq,
      targetVehicleId,
      driveDate,
      startTime,
      endTime,
      vehicles
    );
    openModal();

    const form = document.getElementById('negotiation-submit-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        await AppStore.sendTimeNegotiationRequest({
          target_vehicle_id: targetVehicleId,
          drive_date: driveDate,
          my_name: user.name,
          suggested_start: formData.get('suggested_start'),
          suggested_end: formData.get('suggested_end'),
          suggested_vehicle: formData.get('suggested_vehicle'),
          message: formData.get('message')
        });

        closeModal();
        showToast(`💬 [${priorReq.applicant_name}] 우선권 예약자에게 시간/차량 변경 협의 메시지가 전송되었습니다.`);
      });
    }
  }

  function openDriveLogModal(logToEdit = null, linkedRequest = null) {
    const activeVeh = AppStore.getActiveVehicle();
    const user = AppStore.state.currentUser || { name: '김용필' };
    const allRequests = AppStore.state.data.DriveRequests || [];
    
    // 승인/확정된 차량 운행 신청서 목록 필터링
    const linkedRequests = allRequests.filter(r => 
      String(r.vehicle_id).trim() === String(activeVeh.vehicle_id).trim() && 
      (!r.approval_status || r.approval_status !== '반려') &&
      (r.applicant_name === user.name || r.applicant_id === user.user_id || r.driver_name === user.name)
    );

    if (!linkedRequest && !logToEdit) {
      const today = new Date().toISOString().split('T')[0];
      linkedRequest = linkedRequests.find(r => r.drive_date === today);
    }

    // 해당 차량의 직전 운행일지 종전 기록(최종 end_km) 조회
    const vehicleLogs = (AppStore.state.data.DriveLogs || [])
      .filter(l => String(l.vehicle_id).trim() === String(activeVeh.vehicle_id).trim())
      .sort((a, b) => (Number(b.end_km) || 0) - (Number(a.end_km) || 0));

    const lastEndKm = logToEdit
      ? Number(logToEdit.start_km) || 0
      : (vehicleLogs.length > 0 && Number(vehicleLogs[0].end_km) > 0 ? Number(vehicleLogs[0].end_km) : (activeVeh.current_mileage || 0));

    const defaultDate = logToEdit 
      ? (logToEdit.date || '')
      : (linkedRequest ? (linkedRequest.drive_date || '').replace(/T.*/, '') : new Date().toISOString().split('T')[0]);

    const defaultDriver = logToEdit 
      ? (logToEdit.driver_name || '')
      : (linkedRequest ? (linkedRequest.driver_name || linkedRequest.applicant_name || '') : (user.name || ''));

    const defaultDepart = logToEdit 
      ? (logToEdit.depart_time || '')
      : (linkedRequest ? (linkedRequest.start_time || '16:00').slice(0, 5) : '16:00');

    const defaultArrival = logToEdit 
      ? (logToEdit.arrival_time || '')
      : (linkedRequest ? (linkedRequest.end_time || '16:45').slice(0, 5) : '16:45');

    const defaultDest = logToEdit 
      ? (logToEdit.destination || '')
      : (linkedRequest ? (linkedRequest.destination || (linkedRequest.purpose || '').match(/^([^\s(]+)/)?.[1] || '') : '');

    const defaultPurpose = logToEdit 
      ? (logToEdit.purpose || '')
      : (linkedRequest ? (linkedRequest.purpose || '') : '');

    const defaultEndKm = logToEdit ? logToEdit.end_km : (lastEndKm > 0 ? lastEndKm + 25 : 25);
    const defaultHipassBalance = logToEdit ? (logToEdit.hipass_balance || 0) : 35000;
    const selectedReqId = linkedRequest ? linkedRequest.request_id : (logToEdit ? logToEdit.request_id || '' : '');

    modalOverlay.innerHTML = `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-glass); padding-bottom:12px;">
          <h3 style="font-size:1.15rem; color:var(--accent-gold); display:flex; align-items:center; gap:8px;">
            <span>📑</span> ${logToEdit ? '✏️ 차량 운행일지 수정' : '차량 운행일지 작성'}
          </h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.2rem;">✕</button>
        </div>

        <form id="drivelog-submit-form" style="display:flex; flex-direction:column; gap:20px;">
          <input type="hidden" name="log_id" value="${logToEdit ? logToEdit.log_id : ''}">
          <input type="hidden" name="vehicle_id" value="${activeVeh.vehicle_id}">

          <div class="form-group">
            <label style="color:var(--status-emerald); font-weight:700;">📋 차량 운행 신청서 불러오기 (선택 시 자동채움)</label>
            <select name="request_id" class="form-control" id="linked-request-select" style="border-color:var(--status-emerald); background:rgba(16,185,129,0.08);">
              <option value="">-- 운행 신청서 직접 선택 --</option>
              ${linkedRequests.map(r => `
                <option value="${r.request_id}" ${String(r.request_id) === String(selectedReqId) ? 'selected' : ''} 
                  data-date="${r.drive_date}" 
                  data-start="${r.start_time}" 
                  data-end="${r.end_time}" 
                  data-driver="${r.driver_name || r.applicant_name}" 
                  data-companion="${r.companion || ''}" 
                  data-purpose="${r.purpose || ''}">
                  📅 ${r.drive_date} (${r.start_time}~${r.end_time}) | 👤 ${r.driver_name || r.applicant_name} | ${r.purpose || '목적 미기재'}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>운행일자 / 운전자 *</label>
            <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:12px;">
              <input type="date" name="date" class="form-control" value="${defaultDate}" required>
              <input type="text" name="driver_name" id="drivelog-driver-name" class="form-control" value="${defaultDriver}" required placeholder="운전자 성명">
            </div>
          </div>

          <div class="form-group">
            <label>🕒 실제 운행 시간 (출발 ~ 복귀/도착) *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div style="position:relative; display:flex; align-items:center;">
                <span style="position:absolute; left:10px; color:var(--accent-gold); font-weight:700; pointer-events:none; font-size:0.82rem;">🕒 출발</span>
                <input type="time" name="depart_time" id="drivelog-depart-time" class="form-control" value="${defaultDepart}" style="padding-left:56px;" required>
              </div>
              <div style="position:relative; display:flex; align-items:center;">
                <span style="position:absolute; left:10px; color:var(--accent-gold); font-weight:700; pointer-events:none; font-size:0.82rem;">🕒 도착</span>
                <input type="time" name="arrival_time" id="drivelog-arrival-time" class="form-control" value="${defaultArrival}" style="padding-left:56px;" required>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>목적지 / 운행목적 & 동승자</label>
            <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:12px;">
              <input type="text" name="destination" id="drivelog-destination" class="form-control" value="${defaultDest}" placeholder="목적지 (예: 강동구청)" required>
              <input type="text" name="purpose" id="drivelog-purpose" class="form-control" value="${defaultPurpose}" placeholder="운행목적 (예: 서류 제출)" required>
            </div>
          </div>

          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label style="margin-bottom:0;">🚘 주행거리 입력 (종전 기록 사용)</label>
              <span id="calculated-distance-badge" style="font-size:0.8rem; font-weight:700; color:var(--accent-gold); background:rgba(229,169,60,0.15); padding:2px 8px; border-radius:10px;">
                주행거리: 0 km
              </span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">출발 km (종전 최종 기록)</span>
                <input type="number" id="start_km" name="start_km" class="form-control" value="${lastEndKm}" required style="background:rgba(255,255,255,0.05);">
              </div>
              <div>
                <span style="font-size:0.75rem; color:var(--accent-gold); display:block; margin-bottom:4px; font-weight:700;">도착 km (복귀 후 직접 입력) *</span>
                <input type="number" id="end_km" name="end_km" class="form-control" value="${defaultEndKm}" required placeholder="복귀 후 누적 km" style="border-color:var(--accent-gold);">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label style="color:#3498db; font-weight:700;">💳 하이패스 카드 잔액 (원)</label>
            <input type="number" name="hipass_balance" class="form-control" value="${defaultHipassBalance}" placeholder="예: 35000 (운행 완료 후 잔액)" style="border-color:#3498db; background:rgba(52,152,219,0.08);">
          </div>

          <button type="submit" class="btn-primary" style="margin-top:8px; padding:14px; font-size:1rem;">${logToEdit ? '✏️ 운행일지 수정 저장' : '📑 차량 운행일지 저장'}</button>
        </form>
      </div>
    `;
    openModal();

    const form = document.getElementById('drivelog-submit-form');
    const linkedSelect = document.getElementById('linked-request-select');
    const startKmInput = document.getElementById('start_km');
    const endKmInput = document.getElementById('end_km');
    const distanceBadge = document.getElementById('calculated-distance-badge');

    const updateCalculatedDistance = () => {
      const startVal = Number(startKmInput.value) || 0;
      const endVal = Number(endKmInput.value) || 0;
      const dist = Math.max(0, endVal - startVal);
      if (distanceBadge) {
        distanceBadge.textContent = `🚘 주행거리: ${dist} km`;
      }
    };

    updateCalculatedDistance();
    if (endKmInput) endKmInput.addEventListener('input', updateCalculatedDistance);
    if (startKmInput) startKmInput.addEventListener('input', updateCalculatedDistance);

    if (linkedSelect && form) {
      linkedSelect.addEventListener('change', () => {
        const opt = linkedSelect.selectedOptions[0];
        if (opt && opt.value) {
          const dateInput = form.querySelector('[name="date"]');
          const driverInput = document.getElementById('drivelog-driver-name');
          const departInput = document.getElementById('drivelog-depart-time');
          const arrivalInput = document.getElementById('drivelog-arrival-time');
          const purposeInput = document.getElementById('drivelog-purpose');
          const destInput = document.getElementById('drivelog-destination');

          if (dateInput && opt.dataset.date) dateInput.value = opt.dataset.date.replace(/T.*/, '');
          if (driverInput && opt.dataset.driver) driverInput.value = opt.dataset.driver;
          if (departInput && opt.dataset.start) departInput.value = opt.dataset.start.slice(0, 5);
          if (arrivalInput && opt.dataset.end) arrivalInput.value = opt.dataset.end.slice(0, 5);

          const fullPurpose = opt.dataset.purpose || '';
          if (purposeInput) purposeInput.value = fullPurpose;
          if (destInput && fullPurpose) {
            const destMatch = fullPurpose.match(/^([^\s(]+)/);
            if (destMatch) destInput.value = destMatch[1];
          }
          showToast(`📋 [${opt.dataset.driver}] 님의 운행 신청 정보가 자동 기입되었습니다.`);
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const logId = formData.get('log_id');
      const start_km = Number(formData.get('start_km'));
      const end_km = Number(formData.get('end_km'));
      const distance_km = end_km - start_km;

      if (end_km < start_km) {
        showToast('도착 km는 출발 km보다 같거나 커야 합니다.', 'error');
        return;
      }

      setFormSavingState(form, true, logId ? '운행일지 수정 중...' : '운행일지 저장 중...');
      try {
        const payload = {
          log_id: logId || undefined,
          vehicle_id: activeVeh.vehicle_id,
          date: formData.get('date'),
          driver_id: user.user_id || '1001',
          driver_name: formData.get('driver_name') || user.name,
          depart_time: formData.get('depart_time'),
          arrival_time: formData.get('arrival_time'),
          destination: formData.get('destination'),
          purpose: formData.get('purpose'),
          start_km,
          end_km,
          distance_km,
          request_id: formData.get('request_id') || ''
        };

        if (logId) {
          await AppStore.updateDriveLog(payload);
          showToast(`✏️ 차량 운행일지가 수정되었습니다. (주행거리: ${distance_km}km)`);
        } else {
          await AppAPI.request('createDriveLog', payload);
          showToast(`📑 차량 운행일지가 정상적으로 저장되었습니다! (주행거리: ${distance_km}km)`);
        }

        await AppStore.loadInitialData();
        closeModal();
      } finally {
        setFormSavingState(form, false);
      }
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

        setFormSavingState(form, true, '사고 경위서 저장 중...');
        try {
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
          showToast('🚨 사고 경위서가 성공적으로 접수/저장되었습니다.');
        } finally {
          setFormSavingState(form, false);
        }
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

      setFormSavingState(form, true, '주유 기록 저장 중...');
      try {
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
        showToast('⛽ 주유 기록이 성공적으로 저장되었습니다.');
      } finally {
        setFormSavingState(form, false);
      }
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
            <button id="btn-export-excel" class="btn-primary" style="padding:4px 12px; font-size:0.8rem; width:auto; background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:#FFF;">📊 EXCEL 다운로드</button>
            <button onclick="window.print()" class="btn-primary" style="padding:4px 12px; font-size:0.8rem; width:auto;">🖨️ 인쇄 / PDF 출력</button>
            <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
          </div>
        </div>
        ${AppComponents.renderMonthlyApprovalReport('2026년 08월', activeVeh.vehicle_id, logs, AppStore.state.data.ApprovalLogs)}
      </div>
    `;
    openModal();

    const btnExcel = document.getElementById('btn-export-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        let csvContent = "\uFEFF";
        csvContent += "운행일자,운전자,출발시간,도착시간,목적지,운행목적,출발km,도착km,운행거리(km),하이패스(잔액)\n";
        logs.forEach(l => {
          const dest = (l.destination || '').replace(/"/g, '""');
          const purpose = (l.purpose || '').replace(/"/g, '""');
          csvContent += `"${l.date}","${l.driver_name}","${l.depart_time}","${l.arrival_time}","${dest}","${purpose}","${l.start_km}","${l.end_km}","${l.distance_km}","${l.hipass_balance || ''}"\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `차량운행일지_${activeVeh.vehicle_id}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('📊 월별 운행일지 데이터가 엑셀(CSV) 형식으로 다운로드 되었습니다.');
      });
    }
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
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const identity = (formData.get('identity') || '').toString().trim();
        const password = (formData.get('password') || '').toString().trim();

        if (errorMsg) errorMsg.style.display = 'none';

        if (!identity || !password) {
          if (errorMsg) {
            errorMsg.textContent = `⚠️ 계정 아이디와 비밀번호를 모두 입력해주세요.`;
            errorMsg.style.display = 'block';
          }
          return;
        }

        setFormSavingState(form, true, '로그인 중...');

        try {
          const res = await AppStore.login(identity, password);
          if (!res.success) {
            if (errorMsg) {
              errorMsg.textContent = `⚠️ ${res.message}`;
              errorMsg.style.display = 'block';
            }
            showToast(`⚠️ ${res.message}`, 'error');
            return;
          }

          closeModal();
          showToast(`🎉 환영합니다! ${res.user.name} (${res.user.position}) 님 로그인 완료.`);
        } catch (err) {
          if (errorMsg) {
            errorMsg.textContent = `⚠️ 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.`;
            errorMsg.style.display = 'block';
          }
        } finally {
          setFormSavingState(form, false);
        }
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

  function openModal(content = null) {
    if (typeof content === 'string' && content.trim()) {
      modalOverlay.innerHTML = content;
    }
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
