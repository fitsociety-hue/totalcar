/**
 * 강동어울림복지관 차량통합관리 - UI 컴포넌트 렌더러 (js/components.js)
 * 벤츠 모바일 앱 벤치마킹 & 전문가 다크 타이타늄 앰버 테마 적용
 */

const AppComponents = {

  /**
   * 1. 메르세데스 벤츠 스타일 탑뷰 비주얼라이저 카드
   */
  renderVehicleVisualizer(vehicle, allVehicles) {
    const statusInfo = APP_CONFIG.VEHICLE_STATUS[
      Object.keys(APP_CONFIG.VEHICLE_STATUS).find(k => APP_CONFIG.VEHICLE_STATUS[k].code === vehicle.status) || 'AVAILABLE'
    ];

    const vehicleOptionsHTML = allVehicles.map(v => 
      `<option value="${v.vehicle_id}" ${v.vehicle_id === vehicle.vehicle_id ? 'selected' : ''}>${v.vehicle_id} (${v.model})</option>`
    ).join('');

    return `
      <div class="vehicle-card glass-panel">
        <div class="vehicle-selector-header">
          <div>
            <div class="vehicle-name-title gold-gradient-text">${vehicle.model}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
              <select id="vehicle-select-dropdown" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-weight:600;">
                ${vehicleOptionsHTML}
              </select>
            </div>
          </div>
          <span class="badge" style="background:${statusInfo.badgeBg}; color:${statusInfo.color}; border: 1px solid ${statusInfo.color}40;">
            ● ${statusInfo.label}
          </span>
        </div>

        <!-- Interactive 2D Overhead Car Visualizer -->
        <div class="topview-container">
          <img src="assets/car-topview.svg" alt="Vehicle Overhead View" style="height:100%; max-width:100%; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6));">
        </div>

        <!-- Quick Telemetry Pills -->
        <div class="quick-stats-row">
          <div class="stat-pill">
            <div class="label">누적 주행거리</div>
            <div class="value">${Number(vehicle.current_mileage).toLocaleString()} km</div>
          </div>
          <div class="stat-pill">
            <div class="label">하이패스 단말기</div>
            <div class="value" style="font-size:0.75rem; color:var(--text-main);">${vehicle.hipass_id || '등록완료'}</div>
          </div>
          <div class="stat-pill">
            <div class="label">보험 만료일</div>
            <div class="value" style="font-size:0.75rem; color:var(--status-emerald);">${vehicle.insurance_end}</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 2. 디지털 엑스트라 / 차량 상태 목록 (벤츠 Screenshot 3 벤치마킹)
   */
  renderDigitalExtras(vehicle, insurance, pendingRequestsCount) {
    const insurancePhone = insurance ? insurance.claim_phone || insurance.company_phone : '1588-0100';

    return `
      <div class="digital-extras-container">
        <!-- 알림 및 점검 상태 카드 -->
        ${pendingRequestsCount > 0 ? `
          <div class="extra-card" style="border-color: var(--accent-gold); background: rgba(229,169,60,0.1);">
            <div class="extra-info">
              <h4 style="color: var(--accent-gold);">⚠️ 승인 대기 운행 신청</h4>
              <p>${pendingRequestsCount}건의 신청건이 결재 승인을 기다리고 있습니다.</p>
            </div>
            <div class="extra-icon-box">📌</div>
          </div>
        ` : ''}

        <div class="extra-card" id="btn-toggle-doors">
          <div class="extra-info">
            <h4>차량 잠금 및 도어/창문 상태</h4>
            <p>모든 도어 닫힘 완료 · 창문 폐쇄 확인</p>
          </div>
          <div class="extra-icon-box">🔒</div>
        </div>

        <div class="extra-card" id="btn-insurance-call">
          <div class="extra-info">
            <h4>24시간 긴급출동 & 사고접수</h4>
            <p>${insurance ? insurance.company : 'DB손해보험'} (${insurancePhone})</p>
          </div>
          <a href="tel:${insurancePhone.replace(/[^0-9]/g, '')}" class="extra-icon-box" style="text-decoration:none;">📞</a>
        </div>

        <div class="extra-card">
          <div class="extra-info">
            <h4>다음 정기점검 / 소모품</h4>
            <p>엔진오일 및 타이어 공기압 정상</p>
          </div>
          <div class="extra-icon-box">🛠️</div>
        </div>
      </div>
    `;
  },

  /**
   * 3. 운행 신청 & 중복 예약 캘린더 (Conflict Detector 내장)
   */
  renderBookingCalendar(requests, activeVehicleId) {
    const vehRequests = requests.filter(r => r.vehicle_id === activeVehicleId);

    const rowsHTML = vehRequests.map(req => {
      const statusColor = req.approval_status === '승인' ? 'var(--status-emerald)' : 
                          req.approval_status === '반려' ? 'var(--status-rose)' : 'var(--status-amber)';
      return `
        <tr>
          <td><span class="nobr"><strong>${req.drive_date}</strong></span><br><span style="font-size:0.75rem; color:var(--text-muted);" class="nobr">${req.start_time}~${req.end_time}</span></td>
          <td><span class="nobr">${req.applicant_name} <small style="color:var(--text-muted);">(${req.team})</small></span></td>
          <td style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${req.purpose}">${req.purpose}</td>
          <td>
            <span class="badge nobr" style="background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40;">
              ${req.approval_status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="glass-panel" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1rem; font-weight:700; display:flex; align-items:center; gap:6px;"><span>📅</span> 차량 운행 예약 현황</h3>
          <button id="btn-open-request-modal" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:auto;">+ 운행 신청</button>
        </div>

        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width:28%;">예정일시</th>
                <th style="width:28%;">신청자</th>
                <th style="width:28%;">운행목적</th>
                <th style="width:16%;">상태</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML || '<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:20px;">예약된 운행 건이 없습니다.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * 4. 사고 경위서 작성 모달 Form (v1.1 명세 - 가해/피해 x 대인/대물)
   */
  renderAccidentFormModal(vehicleId, driverName, insurance) {
    const claimPhone = insurance ? insurance.claim_phone || insurance.company_phone : '1588-0100';

    return `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:10px;">
          <h3 style="font-size:1.1rem; color:var(--status-rose);">🚨 차량 사고 경위서 작성 (v1.1)</h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.2rem;">✕</button>
        </div>

        <!-- 24시간 긴급출동 안내 박스 -->
        <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); padding:12px; border-radius:var(--radius-sm); margin-bottom:16px; font-size:0.85rem;">
          <div style="font-weight:700; color:#FCA5A5; margin-bottom:4px;">📞 보험사 24시간 사고접수 바로가기</div>
          <div>차량: <strong>${vehicleId}</strong> | 보험사: <strong>${insurance ? insurance.company : 'DB손해보험'}</strong> (${claimPhone})</div>
          <a href="tel:${claimPhone.replace(/[^0-9]/g, '')}" class="btn-primary btn-emergency" style="margin-top:8px; padding:6px 12px; font-size:0.8rem; width:100%; text-align:center; display:block;">
            📲 보험사 사고접수 전화 연결
          </a>
        </div>

        <form id="accident-submit-form">
          <input type="hidden" name="vehicle_id" value="${vehicleId}">
          
          <div class="form-group">
            <label>사고 일자</label>
            <input type="date" name="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div class="form-group">
            <label>운전자 / 사고장소</label>
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:8px;">
              <input type="text" name="driver_name" class="form-control" value="${driverName}" readonly>
              <input type="text" name="location" class="form-control" placeholder="사고 장소 입력" required>
            </div>
          </div>

          <!-- v1.1 핵심: 가해 / 피해 구분 -->
          <div class="form-group">
            <label style="color:var(--accent-gold);">① 사고 당사자 역할 구분 *</label>
            <select name="accident_role" class="form-control" style="border-color:var(--accent-gold); font-weight:700;" required>
              <option value="피해">피해 사고 (상대방 과실)</option>
              <option value="가해">가해 사고 (본인 과실)</option>
            </select>
          </div>

          <!-- v1.1 핵심: 대인 / 대물 피해 발생 여부 및 상세 -->
          <div class="form-group" style="background:rgba(15,18,26,0.6); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <label style="font-weight:700; color:var(--text-main);">② 대인 / 대물 발생 내역 *</label>
            
            <div style="margin-top:8px;">
              <label><input type="checkbox" name="damage_person_yn" value="Y"> 대인(부상/상대방) 사고 발생</label>
              <textarea name="damage_person_detail" class="form-control" rows="2" placeholder="대인 피해/가해 상세 (인적사항, 병원, 부상정도 등)" style="margin-top:4px;"></textarea>
            </div>

            <div style="margin-top:12px;">
              <label><input type="checkbox" name="damage_property_yn" value="Y" checked> 대물(차량/파손) 사고 발생</label>
              <textarea name="damage_property_detail" class="form-control" rows="2" placeholder="대물 피해/가해 상세 (파손부위, 상대 차량번호/차종 등)" style="margin-top:4px;"></textarea>
            </div>
          </div>

          <!-- 상대방 인적사항 -->
          <div class="form-group">
            <label>상대방 정보 (가해/피해 공통)</label>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px;">
              <input type="text" name="counterpart_name" class="form-control" placeholder="상대 성명">
              <input type="text" name="counterpart_phone" class="form-control" placeholder="연락처">
              <input type="text" name="counterpart_insurance" class="form-control" placeholder="가입보험사">
            </div>
          </div>

          <div class="form-group">
            <label>사고 경위 상세 내용</label>
            <textarea name="description" class="form-control" rows="3" placeholder="사고 발생 상황을 상세히 기술하십시오." required></textarea>
          </div>

          <div style="display:flex; gap:8px; margin-top:16px;">
            <button type="button" class="btn-secondary modal-close-btn" style="flex:1;">취소</button>
            <button type="submit" class="btn-primary" style="flex:2; background:var(--status-rose); color:#FFF;">사고 경위서 제출</button>
          </div>
        </form>
      </div>
    `;
  },

  /**
   * 5. 월별 운행일지 결재용 Printable Report HTML (담당 -> 팀장 -> 국장 -> 관장)
   */
  renderMonthlyApprovalReport(monthStr, vehicleId, logs, approvalLogs) {
    const totalKm = logs.reduce((sum, l) => sum + (Number(l.distance_km) || 0), 0);

    return `
      <div class="printable-report glass-panel" style="padding:24px; background:#FFF; color:#000;">
        <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #000; padding-bottom:10px;">
          <h2 style="font-size:1.6rem; font-weight:800; color:#000;">강동어울림복지관 차량 운행일지 월별 보고서</h2>
          <div style="font-size:0.9rem; color:#444; margin-top:4px;">대상 월: ${monthStr} | 차량번호: ${vehicleId}</div>
        </div>

        <!-- 4단계 전자 결재선 표 -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; text-align:center; font-size:0.85rem;">
          <tr>
            <th rowspan="2" style="border:1px solid #000; width:15%; background:#F3F4F6;">결 재 선</th>
            <th style="border:1px solid #000; width:21.25%; background:#F3F4F6;">기 안 (담당)</th>
            <th style="border:1px solid #000; width:21.25%; background:#F3F4F6;">1차 검토 (팀장)</th>
            <th style="border:1px solid #000; width:21.25%; background:#F3F4F6;">2차 검토 (국장)</th>
            <th style="border:1px solid #000; width:21.25%; background:#F3F4F6;">최 종 승 인 (관장)</th>
          </tr>
          <tr style="height:55px;">
            <td style="border:1px solid #000;">박차량<br><span style="font-size:0.75rem; color:#10B981;">[승인 08/01]</span></td>
            <td style="border:1px solid #000;">이팀장<br><span style="font-size:0.75rem; color:#10B981;">[승인 08/01]</span></td>
            <td style="border:1px solid #000;">최국장<br><span style="font-size:0.75rem; color:#10B981;">[승인 08/02]</span></td>
            <td style="border:1px solid #000;">정관장<br><span style="font-size:0.75rem; color:#10B981;">[최종승인]</span></td>
          </tr>
        </table>

        <!-- 운행 목록 집계 -->
        <div style="font-weight:700; margin-bottom:8px; font-size:0.95rem; color:#000;">■ 월간 운행 상세 내역 (총 운행거리: ${totalKm} km)</div>
        <table style="width:100%; border-collapse:collapse; text-align:center; font-size:0.8rem; color:#000;">
          <thead>
            <tr style="background:#E5E7EB;">
              <th style="border:1px solid #000; padding:6px;">일자</th>
              <th style="border:1px solid #000; padding:6px;">운전자</th>
              <th style="border:1px solid #000; padding:6px;">목적지</th>
              <th style="border:1px solid #000; padding:6px;">운행목적</th>
              <th style="border:1px solid #000; padding:6px;">출발km</th>
              <th style="border:1px solid #000; padding:6px;">도착km</th>
              <th style="border:1px solid #000; padding:6px;">주행거리</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="border:1px solid #000; padding:5px;"><span class="nobr">${l.date}</span></td>
                <td style="border:1px solid #000; padding:5px;"><span class="nobr">${l.driver_name || '김복지'}</span></td>
                <td style="border:1px solid #000; padding:5px;">${l.destination}</td>
                <td style="border:1px solid #000; padding:5px;">${l.purpose}</td>
                <td style="border:1px solid #000; padding:5px;"><span class="nobr">${l.start_km}</span></td>
                <td style="border:1px solid #000; padding:5px;"><span class="nobr">${l.end_km}</span></td>
                <td style="border:1px solid #000; padding:5px; font-weight:700;"><span class="nobr">${l.distance_km} km</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top:20px; text-align:right; font-size:0.8rem; color:#555;">
          위와 같이 강동어울림복지관 차량 운행 결과를 보고합니다.<br>
          작성일: ${new Date().toISOString().split('T')[0]}
        </div>
      </div>
    `;
  },

  /**
   * 6. 로그인 모달 HTML 렌더러
   */
  renderLoginModal() {
    return `
      <div class="modal-body glass-panel" style="max-width:440px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:10px;">
          <h3 style="font-size:1.15rem; color:var(--accent-gold); display:flex; align-items:center; gap:8px;">
            <span>🔑</span> 스마트 차량통합관리 로그인
          </h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.2rem;">✕</button>
        </div>

        <form id="auth-login-form">
          <div class="form-group">
            <label>아이디 또는 이메일 *</label>
            <input type="text" name="identity" class="form-control" placeholder="아이디/이메일 또는 성명 (예: kim@gangdong.or.kr)" required value="kim@gangdong.or.kr">
          </div>

          <div class="form-group">
            <label>비밀번호 *</label>
            <input type="password" name="password" class="form-control" placeholder="비밀번호 (기본: 1234)" required value="1234">
          </div>

          <div id="login-error-msg" style="display:none; color:var(--status-rose); font-size:0.8rem; margin-bottom:12px; font-weight:600;"></div>

          <button type="submit" class="btn-primary" style="margin-bottom:12px;">로그인</button>
        </form>

        <div style="text-align:center; border-top:1px dashed var(--border-glass); padding-top:14px; margin-top:8px;">
          <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">아직 계정이 없으신가요?</div>
          <button id="btn-switch-to-signup" class="btn-secondary" style="padding:8px; font-size:0.85rem;">⚡ 신규 회원가입 신청</button>
        </div>

        <!-- 1초 빠른 데모 계정 선택 바 -->
        <div style="margin-top:16px; background:rgba(229,169,60,0.08); border:1px solid var(--border-glass-strong); padding:12px; border-radius:var(--radius-sm);">
          <div style="font-size:0.75rem; color:var(--accent-gold); font-weight:700; margin-bottom:6px;">🚀 테스트용 1초 빠른 로그인 선택</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button class="btn-quick-demo-login btn-secondary" data-role="팀원" style="padding:4px 8px; font-size:0.72rem; width:auto;">김복지 (팀원)</button>
            <button class="btn-quick-demo-login btn-secondary" data-role="팀장" style="padding:4px 8px; font-size:0.72rem; width:auto;">이팀장 (팀장)</button>
            <button class="btn-quick-demo-login btn-secondary" data-role="차량관리담당자" style="padding:4px 8px; font-size:0.72rem; width:auto;">박차량 (담당자)</button>
            <button class="btn-quick-demo-login btn-secondary" data-role="사무국장" style="padding:4px 8px; font-size:0.72rem; width:auto;">최국장 (국장)</button>
            <button class="btn-quick-demo-login btn-secondary" data-role="관장" style="padding:4px 8px; font-size:0.72rem; width:auto;">정관장 (관장)</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 7. 회원가입 모달 HTML 렌더러
   */
  renderSignupModal() {
    return `
      <div class="modal-body glass-panel" style="max-width:480px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:10px;">
          <h3 style="font-size:1.15rem; color:var(--accent-gold); display:flex; align-items:center; gap:8px;">
            <span>📝</span> 강동어울림복지관 직원 회원가입
          </h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.2rem;">✕</button>
        </div>

        <form id="auth-signup-form">
          <div class="form-group">
            <label>성명 *</label>
            <input type="text" name="name" class="form-control" placeholder="성함 입력 (예: 홍길동)" required>
          </div>

          <div class="form-group">
            <label>소속 부서 / 팀명 *</label>
            <input type="text" name="team" class="form-control" placeholder="예: 복지사업팀, 운영지원팀, 기획팀" value="복지사업팀" required>
          </div>

          <div class="form-group">
            <label>직급 / 승인 권한 *</label>
            <select name="position" class="form-control" required>
              <option value="팀원" selected>직원 (팀원)</option>
              <option value="팀장">직원 (팀장)</option>
              <option value="차량관리담당자">차량 관리 담당자</option>
              <option value="사무국장">사무국장 (중간결재)</option>
              <option value="관장">관장 (최종결재)</option>
            </select>
          </div>

          <div class="form-group">
            <label>아이디 / 이메일 *</label>
            <input type="email" name="email" class="form-control" placeholder="이메일 주소 (예: hong@gangdong.or.kr)" required>
          </div>

          <div class="form-group">
            <label>연락처</label>
            <input type="tel" name="phone" class="form-control" placeholder="010-0000-0000" value="010-1234-5678">
          </div>

          <div class="form-group">
            <label>비밀번호 *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="password" name="password" class="form-control" placeholder="비밀번호" required>
              <input type="password" name="password_confirm" class="form-control" placeholder="비밀번호 확인" required>
            </div>
          </div>

          <div id="signup-error-msg" style="display:none; color:var(--status-rose); font-size:0.8rem; margin-bottom:12px; font-weight:600;"></div>

          <div style="display:flex; gap:8px; margin-top:16px;">
            <button type="button" id="btn-switch-to-login" class="btn-secondary" style="flex:1;">로그인으로 돌아가기</button>
            <button type="submit" class="btn-primary" style="flex:2;">회원가입 완료</button>
          </div>
        </form>
      </div>
    `;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppComponents;
}
