// KST 대한민국 시간 및 날짜 포맷팅 헬퍼 함수 (ISO 1899 문자열 완전 정돈)
function formatTimeDisplay(timeVal) {
  if (!timeVal) return '09:00';
  const str = String(timeVal).trim();
  if (/^\d{2}:\d{2}$/.test(str)) return str;

  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // ISO UTC 시간에 KST (+9시간) 한국 표준시 반영
      const utcHours = d.getUTCHours();
      const kstHours = (utcHours + 9) % 24;
      const hours = String(kstHours).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    const match = str.match(/T(\d{2}):(\d{2})/);
    if (match && match[1] && match[2]) {
      const h = (parseInt(match[1], 10) + 9) % 24;
      return `${String(h).padStart(2, '0')}:${match[2]}`;
    }
  }
  return str.slice(0, 5) || '09:00';
}

function formatDateDisplay(dateVal) {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) {
    const parts = str.split('T');
    if (parts[0] && parts[0].length === 10 && !parts[0].startsWith('1899')) {
      return parts[0];
    }
  }
  if (str.startsWith('1899')) {
    return new Date().toISOString().split('T')[0];
  }
  return str.slice(0, 10);
}

const AppComponents = {

  /**
   * 1. 메르세데스 벤츠 스타일 탑뷰 비주얼라이저 카드
   */
  renderVehicleVisualizer(vehicle, allVehicles) {
    const currentUser = AppStore.state.currentUser;
    const isVehicleManager = currentUser && ['차량관리담당자', '사무국장', '관장'].includes(currentUser.position);

    if (!vehicle || !vehicle.vehicle_id || vehicle.vehicle_id === '미등록' || !allVehicles || allVehicles.length === 0) {
      return `
        <div class="vehicle-card glass-panel" style="text-align:center; padding:32px 16px;">
          <div style="font-size:2.8rem; margin-bottom:12px;">🚗</div>
          <h3 style="font-size:1.1rem; color:var(--accent-gold); margin-bottom:8px;">등록된 차량이 없습니다</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            첫 번째 복지관 차량을 신규 등록하시면 운행 관리 및 캘린더 예약을 바로 시작하실 수 있습니다.
          </p>
          <button id="btn-empty-add-vehicle" class="btn-primary" style="width:auto; display:inline-block; padding:10px 24px; font-size:0.9rem;">
            + 첫 차량 등록하기
          </button>
        </div>
      `;
    }

    const vehicleListHTML = allVehicles.map(v => {
      const statusInfo = APP_CONFIG.VEHICLE_STATUS[
        Object.keys(APP_CONFIG.VEHICLE_STATUS).find(k => APP_CONFIG.VEHICLE_STATUS[k].code === v.status) || 'AVAILABLE'
      ];
      const isSelected = v.vehicle_id === (vehicle ? vehicle.vehicle_id : null);
      
      let ddayText = '';
      if (v.insurance_end) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const end = new Date(v.insurance_end);
        end.setHours(0,0,0,0);
        const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        if (diff > 0) ddayText = `D-${diff}`;
        else if (diff === 0) ddayText = 'D-Day';
        else ddayText = `만료 D+${Math.abs(diff)}`;
      }

      return `
        <div class="vehicle-list-item ${isSelected ? 'selected' : ''}" data-id="${v.vehicle_id}" style="
          padding: 16px; 
          border-radius: var(--radius-md); 
          background: ${isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(15,18,26,0.6)'}; 
          border: 1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-glass)'};
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div>
            <div style="font-size: 1.1rem; font-weight: 700; color: ${isSelected ? 'var(--accent-gold)' : 'var(--text-main)'}; margin-bottom: 6px;">
              ${v.vehicle_id} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">(${v.model})</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              주행 <strong style="color:var(--text-main);">${Number(v.current_mileage).toLocaleString()}</strong> km <span style="margin:0 4px;">|</span> 보험 <strong style="color:var(--status-emerald);">${ddayText}</strong>
            </div>
          </div>
          <span class="badge" style="background:${statusInfo.badgeBg}; color:${statusInfo.color}; border: 1px solid ${statusInfo.color}40; padding: 6px 10px; font-size: 0.85rem; font-weight:700;">
            ● ${statusInfo.label}
          </span>
        </div>
      `;
    }).join('');

    return `
      <div class="glass-panel" style="padding: 16px; margin-top: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
          <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">🚗 전체 차량 상태 현황</h3>
          ${isVehicleManager ? `<button id="btn-list-add-vehicle" style="background:transparent; border:none; color:var(--accent-gold); font-size:0.85rem; font-weight:700; cursor:pointer;">+ 신규 등록</button>` : ''}
        </div>
        <div id="vehicle-list-container">
          ${vehicleListHTML}
        </div>
      </div>
    `;
  },

  /**
   * 1-B. 차량 번호 기준 유기적 통합 연동 요약 카드 (운행↔일지↔주유↔정비↔사고↔보험)
   */
  renderIntegratedSummary(summary, insuranceAlerts) {
    if (!summary || !summary.vehicle) return '';

    const {
      vehicle,
      insurance,
      monthlyKm,
      monthlyFuelCost,
      monthlyMaintCost,
      monthlyTotalCost,
      insuranceDDay,
      todayRequestsCount,
      totalDriveCount,
      totalAccidentCount,
      latestFuel,
      latestMaint,
      latestAccident,
      nextMaintenanceDate
    } = summary;

    // 보험 경고 렌더링
    let alertBanner = '';
    if (insuranceAlerts && insuranceAlerts.length > 0) {
      alertBanner = `
        <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); padding:10px 14px; border-radius:var(--radius-md); margin-bottom:12px; font-size:0.82rem; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.1rem;">⚠️</span>
            <div>
              <strong style="color:#FCA5A5;">보험 만료 임박 경고!</strong>
              <div style="color:var(--text-muted); font-size:0.75rem;">
                ${insuranceAlerts.map(a => `[${a.vehicle_id}] ${a.expired ? '만료됨!' : `만료 D-${a.dday}일 (${a.endDate})`}`).join(', ')}
              </div>
            </div>
          </div>
          <span class="badge" style="background:rgba(239,68,68,0.25); color:#FF8A8A;">즉시갱신 필요</span>
        </div>
      `;
    }

    return `
      ${alertBanner}
      <div class="glass-panel" style="padding:16px; margin-bottom:12px; border:1px solid var(--border-glass-strong); background:linear-gradient(145deg, rgba(20,23,32,0.85) 0%, rgba(13,15,20,0.9) 100%);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:0.95rem; font-weight:700; color:var(--accent-gold); display:flex; align-items:center; gap:6px;">
            <span>🔗</span> [${vehicle.vehicle_id}] 유기적 통합 연동 현황
          </h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">이번 달 유지비: <strong style="color:var(--accent-gold);">${monthlyTotalCost.toLocaleString()}원</strong></span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px;">
          <!-- 1. 운행/일지 연동 -->
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; color:var(--text-muted);">📑 운행일지 연동</span>
              <span class="badge" style="font-size:0.68rem; padding:1px 6px; background:rgba(16,185,129,0.15); color:#10B981;">누적 ${totalDriveCount}건</span>
            </div>
            <div style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-top:4px;">
              당월 ${monthlyKm.toLocaleString()} km <small style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(오늘 ${todayRequestsCount}건 예약)</small>
            </div>
          </div>

          <!-- 2. 주유 연동 -->
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; color:var(--text-muted);">⛽ 주유 비용 연동</span>
              <span style="font-size:0.7rem; color:var(--accent-gold);">${latestFuel ? latestFuel.date : '-'}</span>
            </div>
            <div style="font-size:0.95rem; font-weight:700; color:var(--accent-gold); margin-top:4px;">
              ${monthlyFuelCost > 0 ? `${monthlyFuelCost.toLocaleString()}원` : '기록 없음'}
              ${latestFuel ? `<div style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">최근: ${latestFuel.station}</div>` : ''}
            </div>
          </div>

          <!-- 3. 정비 연동 -->
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; color:var(--text-muted);">🛠️ 정비/점검 연동</span>
              <span style="font-size:0.7rem; color:#3498db;">${nextMaintenanceDate ? `다음: ${nextMaintenanceDate}` : '정상'}</span>
            </div>
            <div style="font-size:0.95rem; font-weight:700; color:#3498db; margin-top:4px;">
              ${monthlyMaintCost > 0 ? `${monthlyMaintCost.toLocaleString()}원` : '당월 입고없음'}
              ${latestMaint ? `<div style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">${latestMaint.reason}</div>` : ''}
            </div>
          </div>

          <!-- 4. 사고/보험 연동 -->
          <div style="background:rgba(15,18,26,0.6); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-glass);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.75rem; color:var(--text-muted);">🛡️ 사고/보험 연동</span>
              <span class="badge" style="font-size:0.68rem; padding:1px 6px; background:${totalAccidentCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${totalAccidentCount > 0 ? '#EF4444' : '#10B981'};">
                ${totalAccidentCount > 0 ? `사고 ${totalAccidentCount}건` : '무사고'}
              </span>
            </div>
            <div style="font-size:0.85rem; font-weight:700; color:var(--text-main); margin-top:4px;">
              ${insurance ? `${insurance.company}` : '보험 미등록'}
              <div style="font-size:0.7rem; color:var(--status-emerald); font-weight:normal;">
                ${insuranceDDay !== null ? (insuranceDDay > 0 ? `만료 D-${insuranceDDay}일` : '만료됨!') : ''}
                (${insurance ? (insurance.claim_phone || '1588-0100') : ''})
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 2. 디지털 엑스트라 / 차량 상태 목록 (벤츠 Screenshot 3 벤치마킹)
   */
  renderDigitalExtras(vehicle, insurance, pendingRequestsCount) {
    if (!vehicle || !vehicle.vehicle_id || vehicle.vehicle_id === '미등록') {
      return `
        <div class="digital-extras-container">
          <div class="extra-card">
            <div class="extra-info">
              <h4 style="color:var(--accent-gold);">✨ 스마트 차량통합관리 준비 완료</h4>
              <p>차량을 신규 등록하시면 실시간 24시간 긴급출동 및 도어/정비 상태 관리를 이용하실 수 있습니다.</p>
            </div>
            <div class="extra-icon-box">🚘</div>
          </div>
        </div>
      `;
    }
    const rawPhone = (insurance && (insurance.claim_phone || insurance.company_phone)) ? String(insurance.claim_phone || insurance.company_phone) : '1544-0114';
    const insurancePhone = rawPhone;
    const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');

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
            <p>${insurance ? insurance.company : 'KB손해보험'} (${insurancePhone})</p>
          </div>
          <a href="tel:${cleanPhoneDigits}" class="extra-icon-box" style="text-decoration:none;">📞</a>
        </div>

        <div class="extra-card">
          <div class="extra-info">
            <h4>다음 정기점검 / 소모품</h4>
            <p>엔진오일 및 타이어 공기압 정상</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 3. 운행 신청 & 중복 예약 캘린더 (Conflict Detector 내장)
   */
  renderBookingCalendar(requests, activeVehicleId, showAll = false) {
    const vehRequests = showAll
      ? requests
      : requests.filter(r => r.vehicle_id === activeVehicleId);

    const rowsHTML = vehRequests.map(req => {
      const dateStr = formatDateDisplay(req.drive_date);
      const startStr = formatTimeDisplay(req.start_time);
      const endStr = formatTimeDisplay(req.end_time);

      // 데이터 필드 밀림 대비 정합성 보장
      const vehIdStr = (req.vehicle_id && !req.vehicle_id.includes('1899') && !req.vehicle_id.includes('T0'))
        ? req.vehicle_id 
        : (req.driver_name || activeVehicleId || '365라 1271');

      const driverStr = (req.driver_name && !req.driver_name.includes('1899') && !req.driver_name.includes('T0'))
        ? req.driver_name 
        : (req.applicant_name || '직원');

      const companionStr = (req.companion && !req.companion.includes('1899') && !req.companion.includes('T0'))
        ? req.companion 
        : '';

      const statusStr = (req.approval_status && !req.approval_status.includes('T0') && !req.approval_status.includes('1899'))
        ? req.approval_status 
        : '확정(우선권)';

      return `
        <tr>
          <td><span class="nobr"><strong>${dateStr}</strong></span><br><span style="font-size:0.75rem; color:var(--text-muted);" class="nobr">🕒 ${startStr}~${endStr}</span></td>
          <td><span class="nobr" style="color:var(--accent-gold); font-weight:700;">🚘 ${vehIdStr}</span></td>
          <td>
            <span class="nobr">👤 ${driverStr} <small style="color:var(--text-muted);">(${req.team || ''})</small></span>
            ${companionStr ? `<br><span style="font-size:0.72rem; color:var(--status-emerald);" class="nobr">👥 동승: ${companionStr}</span>` : ''}
          </td>
          <td style="max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${req.purpose}">${req.purpose}</td>
          <td>
            <span class="badge nobr" style="background:rgba(16,185,129,0.15); color:#10B981; border:1px solid rgba(16,185,129,0.3);">
              ${statusStr}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:4px;" class="nobr">
              <button class="btn-create-drivelog-from-req btn-secondary" data-id="${req.request_id}" style="padding:2px 6px; font-size:0.72rem; width:auto; border-color:var(--status-emerald); color:var(--status-emerald);" title="이 신청서 기반 차량 운행일지 작성">✍️ 일지 작성</button>
              <button class="btn-edit-request btn-secondary" data-id="${req.request_id}" style="padding:2px 6px; font-size:0.72rem; width:auto; border-color:var(--accent-gold); color:var(--accent-gold);" title="운행 신청 정보 수정">✏️ 수정</button>
              <button class="btn-delete-request btn-secondary" data-id="${req.request_id}" style="padding:2px 6px; font-size:0.72rem; width:auto; border-color:rgba(239,68,68,0.4); color:var(--status-rose);" title="운행 신청 취소/삭제">🗑️ 취소</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="glass-panel" style="padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="font-size:1rem; font-weight:700; display:flex; align-items:center; gap:6px;"><span>📅</span> 차량 운행 예약 현황</h3>
            <div style="display:inline-flex; background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); border-radius:14px; padding:2px;">
              <button id="btn-booking-filter-selected" class="btn-booking-filter ${!showAll ? 'active-filter' : ''}" style="padding:2px 8px; font-size:0.72rem; border-radius:12px; color:${!showAll ? 'var(--accent-gold)' : 'var(--text-muted)'}; background:${!showAll ? 'rgba(229,169,60,0.2)' : 'transparent'}; font-weight:600; cursor:pointer;">🚘 ${activeVehicleId || '선택차량'}</button>
              <button id="btn-booking-filter-all" class="btn-booking-filter ${showAll ? 'active-filter' : ''}" style="padding:2px 8px; font-size:0.72rem; border-radius:12px; color:${showAll ? 'var(--accent-gold)' : 'var(--text-muted)'}; background:${showAll ? 'rgba(229,169,60,0.2)' : 'transparent'}; font-weight:600; cursor:pointer;">🌐 전체차량 (${requests.length}건)</button>
            </div>
          </div>
          <button id="btn-open-request-modal" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:auto;">+ 운행 신청</button>
        </div>

        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width:22%;">예정일시</th>
                <th style="width:18%;">차량번호</th>
                <th style="width:20%;">신청자/동승자</th>
                <th style="width:18%;">운행목적</th>
                <th style="width:10%;">상태</th>
                <th style="width:12%;">관리</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML || '<tr><td colspan="6" style="text-align:center; color:var(--text-dim); padding:20px;">예약된 운행 건이 없습니다.</td></tr>'}
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
      <div class="modal-body glass-panel" style="max-width:440px; padding:24px 22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; border-bottom:1px solid var(--border-glass); padding-bottom:14px;">
          <h3 style="font-size:1.18rem; color:var(--accent-gold); display:flex; align-items:center; gap:8px; font-weight:700;">
            <span>🔑</span> 스마트 차량통합관리 로그인
          </h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.3rem; padding:4px;">✕</button>
        </div>

        <form id="auth-login-form" style="display:flex; flex-direction:column; gap:20px;">
          <div class="form-group" style="margin-bottom:0;">
            <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.88rem; color:var(--text-main);">복지관 구글 메일 계정 (@gde.or.kr) 또는 아이디 *</label>
            <input type="text" name="identity" class="form-control" placeholder="구글 메일 주소 (예: kim@gde.or.kr)" style="padding:12px 14px; font-size:0.95rem; border-radius:var(--radius-sm);" required value="kim@gde.or.kr">
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.88rem; color:var(--text-main);">비밀번호 *</label>
            <input type="password" name="password" class="form-control" placeholder="비밀번호 입력" style="padding:12px 14px; font-size:0.95rem; border-radius:var(--radius-sm);" required>
          </div>

          <div id="login-error-msg" style="display:none; color:var(--status-rose); font-size:0.82rem; font-weight:600; padding:4px 0;"></div>

          <button type="submit" class="btn-primary" style="margin-top:6px; padding:14px; font-size:1rem; font-weight:700; border-radius:var(--radius-sm); letter-spacing:1px; box-shadow:0 4px 15px rgba(229,169,60,0.25);">로그인</button>
        </form>

        <div style="text-align:center; border-top:1px dashed var(--border-glass); padding-top:20px; margin-top:24px;">
          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">아직 계정이 없으신가요?</div>
          <button id="btn-switch-to-signup" class="btn-secondary" style="padding:11px 16px; font-size:0.88rem; width:100%; font-weight:600; border-radius:var(--radius-sm);">⚡ 신규 회원가입 신청</button>
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
            <label>복지관 구글 메일 계정 (@gde.or.kr) *</label>
            <input type="email" name="email" class="form-control" placeholder="복지관 구글 메일 계정으로 가입 (예: kim@gde.or.kr)" required>
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
  },


  /**
   * 8. 차량, 하이패스, 보험 통합 등록/수정 모달 (9월 3호차 대비)
   */
  renderVehicleFormModal(vehicleToEdit = null, insuranceToEdit = null) {
    const isEdit = !!vehicleToEdit;
    const v = vehicleToEdit || {
      vehicle_id: '',
      model: '',
      register_date: new Date().toISOString().split('T')[0],
      current_mileage: 0,
      hipass_id: 'HP-770011',
      hipass_card: '9410-****-7700',
      status: '운행가능',
      note: ''
    };
    const ins = insuranceToEdit || {
      company: 'KB손해보험',
      policy_number: 'POL-2026-9900',
      contractor: '강동어울림복지관',
      claim_phone: '1544-0114',
      insurance_start: new Date().toISOString().split('T')[0],
      insurance_end: '2027-09-01',
      coverage: '대인 무제한 / 대물 5억 / 자차 포함'
    };

    return `
      <div class="modal-body glass-panel" style="max-width:560px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:10px;">
          <h3 style="font-size:1.15rem; color:var(--accent-gold); display:flex; align-items:center; gap:8px;">
            ${isEdit ? '<span>✏️</span> 차량 & 전용 보험 정보 수정' : '<span>🚗</span> 차량 & 전용 보험 신규 등록'}
          </h3>
          <button class="modal-close-btn" style="color:var(--text-muted); font-size:1.2rem;">✕</button>
        </div>
        <form id="form-vehicle-manage">
          <div style="background:rgba(229,169,60,0.08); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-glass-strong); margin-bottom:12px;">
            <h4 style="font-size:0.85rem; color:var(--accent-gold); margin-bottom:8px;">🚗 1. 차량 기본 정보</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>차량 번호 *</label>
                <input type="text" id="veh-id" value="${v.vehicle_id}" placeholder="예: 77어9999" ${isEdit ? 'readonly style="opacity:0.7;"' : 'required'}>
              </div>
              <div class="form-group">
                <label>차종 및 모델 *</label>
                <input type="text" id="veh-model" value="${v.model}" placeholder="예: 현대 쏠라티 (15인승 대형승합)" required>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>최초 등록일</label>
                <input type="date" id="veh-regdate" value="${v.register_date || ''}">
              </div>
              <div class="form-group">
                <label>누적주행거리 (km) *</label>
                <input type="number" id="veh-mileage" value="${v.current_mileage || 0}" required>
              </div>
            </div>
            <div class="form-group">
              <label>운행 상태 *</label>
              <select id="veh-status">
                <option value="운행가능" ${v.status === '운행가능' ? 'selected' : ''}>운행가능 (정상)</option>
                <option value="정비중" ${v.status === '정비중' ? 'selected' : ''}>정비중 (입고)</option>
                <option value="사고처리중" ${v.status === '사고처리중' ? 'selected' : ''}>사고처리중 (수리)</option>
                <option value="폐차" ${v.status === '폐차' ? 'selected' : ''}>폐차/매각</option>
              </select>
            </div>
          </div>

          <div style="background:rgba(46,204,113,0.08); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-glass); margin-bottom:14px;">
            <h4 style="font-size:0.85rem; color:#2ecc71; margin-bottom:8px;">🛡️ 2. 차량 전용 보험 연동 정보</h4>
            <div class="form-grid">
              <div class="form-group">
                <label>보험회사명 *</label>
                <input type="text" id="ins-company" value="${ins.company || ''}" placeholder="예: KB손해보험 / DB손해보험" required>
              </div>
              <div class="form-group">
                <label>24시 사고/긴급출동 전화 *</label>
                <input type="text" id="ins-phone" value="${ins.claim_phone || '1544-0114'}" placeholder="예: 1544-0114" required>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>보험 증권번호</label>
                <input type="text" id="ins-policy" value="${ins.policy_number || ''}" placeholder="예: POL-2026-9900">
              </div>
              <div class="form-group">
                <label>보험 만료일 *</label>
                <input type="date" id="ins-end" value="${ins.insurance_end || ''}" required>
              </div>
            </div>
            <div class="form-group">
              <label>보장 내용 요약</label>
              <input type="text" id="ins-coverage" value="${ins.coverage || '대인 무제한 / 대물 5억 / 자차 포함'}" placeholder="보장 항목 요약">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn-secondary modal-close-btn" style="width:auto;">취소</button>
            <button type="submit" class="btn-primary" style="width:auto;">${isEdit ? '수정 저장' : '신규 차량 등록 완료'}</button>
          </div>
        </form>
      </div>
    `;
  },

  /**
   * 9. 복지관 차량/하이패스/보험 통합 관리자 패널
   */
  renderVehicleManagementPanel(vehicles, insurances) {
    const calculateDDay = (targetDateStr) => {
      if (!targetDateStr) return '';
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(targetDateStr);
      target.setHours(0,0,0,0);
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      if (diff > 0) return `D-${diff}일`;
      if (diff === 0) return 'D-Day';
      return `만료 D+${Math.abs(diff)}일`;
    };

    const currentUser = AppStore.state.currentUser;
    const isVehicleManager = currentUser && ['차량관리담당자', '사무국장', '관장'].includes(currentUser.position);

    return `
      <div class="glass-panel" style="padding:16px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1rem; font-weight:700; display:flex; align-items:center; gap:6px;">
            <span>🚗</span> 복지관 차량 / 하이패스 / 보험 통합 관리자
          </h3>
          ${isVehicleManager ? `
          <button id="btn-open-add-vehicle-modal" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:auto;">
            + 차량 등록
          </button>
          ` : ''}
        </div>

        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>차량번호 / 모델</th>
                <th>주행거리</th>
                <th>연동 보험사 / 긴급전화</th>
                <th>보험 만료일 (D-Day)</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles.length > 0 ? vehicles.map(v => {
                const ins = insurances.find(i => i.vehicle_id === v.vehicle_id) || {};
                const dday = calculateDDay(ins.insurance_end || v.insurance_end);
                return `
                  <tr>
                    <td>
                      <strong class="gold-gradient-text nobr">${v.vehicle_id}</strong>
                      <div style="font-size:0.75rem; color:var(--text-muted);" class="nobr">${v.model}</div>
                    </td>
                    <td><strong class="nobr">${Number(v.current_mileage).toLocaleString()} km</strong></td>
                    <td>
                      <div class="nobr" style="font-weight:600;">${ins.company || '미등록'}</div>
                      <div class="nobr" style="font-size:0.75rem; color:var(--accent-gold);">📞 ${ins.claim_phone || '미등록'}</div>
                    </td>
                    <td>
                      <strong class="nobr" style="color:var(--status-emerald);">${ins.insurance_end || v.insurance_end || '-'}</strong>
                      <span class="badge nobr" style="margin-left:4px; font-size:0.7rem; background:rgba(46,204,113,0.15); color:#2ecc71;">${dday}</span>
                    </td>
                    <td><span class="badge nobr" style="background:rgba(229,169,60,0.15); color:var(--accent-gold);">${v.status}</span></td>
                    <td>
                      ${isVehicleManager ? `
                      <div style="display:flex; gap:4px;" class="nobr">
                        <button class="btn-edit-vehicle btn-secondary" data-id="${v.vehicle_id}" style="padding:2px 6px; font-size:0.7rem; width:auto;">수정</button>
                        <button class="btn-delete-vehicle btn-secondary" data-id="${v.vehicle_id}" style="padding:2px 6px; font-size:0.7rem; width:auto; color:var(--status-rose);">삭제</button>
                      </div>
                      ` : '<span style="color:var(--text-muted); font-size:0.75rem;">권한 없음</span>'}
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">
                    🚗 등록된 차량이 없습니다. ${isVehicleManager ? '상단의 [+ 차량 등록] 버튼을 클릭하여 첫 차량을 등록하세요.' : ''}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * 운행 시간/차량 변경 협의 모달 렌더러
   */
  renderTimeNegotiationModal(priorReq, targetVehicleId, driveDate, startTime, endTime, vehicles) {
    const altVehiclesOptions = (vehicles || [])
      .filter(v => v.vehicle_id !== targetVehicleId)
      .map(v => `<option value="${v.vehicle_id}">🚘 ${v.vehicle_id} (${v.model})</option>`)
      .join('');

    return `
      <div class="modal-body glass-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-glass); padding-bottom:8px;">
          <h3 style="font-size:1.1rem; color:var(--accent-gold);">💬 운행 시간 / 차량 변경 협의 요청</h3>
          <button class="modal-close-btn" style="color:var(--text-muted);">✕</button>
        </div>

        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:12px; border-radius:var(--radius-sm); margin-bottom:16px; font-size:0.85rem;">
          <div style="font-weight:700; color:#FCA5A5; margin-bottom:4px;">⚠️ 선신청 우선권(확정) 등록 안내</div>
          <div>선택하신 시간대(<strong>${startTime}~${endTime}</strong>)는 <strong>${priorReq.applicant_name}</strong> 님이 먼저 신청하여 <strong>우선권(확정)</strong>을 보유 중입니다.</div>
          <div style="margin-top:6px; color:var(--text-muted); font-size:0.8rem;">기존 예약자와 시간대 조정 및 다른 차량 사용에 대한 협의 요청을 작성하실 수 있습니다.</div>
        </div>

        <form id="negotiation-submit-form">
          <input type="hidden" name="target_vehicle_id" value="${targetVehicleId}">
          <input type="hidden" name="drive_date" value="${driveDate}">

          <div class="form-group">
            <label>우선권 보유 예약자 정보</label>
            <input type="text" class="form-control" value="${priorReq.applicant_name} (${priorReq.team || '-'}) | ${priorReq.start_time}~${priorReq.end_time}" readonly>
          </div>

          <div class="form-group">
            <label>희망 변경/조정 시간대 (선택)</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <input type="time" name="suggested_start" class="form-control" value="${endTime}">
              <input type="time" name="suggested_end" class="form-control" value="18:00">
            </div>
          </div>

          ${altVehiclesOptions ? `
          <div class="form-group">
            <label>대체 사용 제안 차량 (선택)</label>
            <select name="suggested_vehicle" class="form-control">
              <option value="">-- 현재 차량 유지 --</option>
              ${altVehiclesOptions}
            </select>
          </div>
          ` : ''}

          <div class="form-group">
            <label>협의 제안 메시지 *</label>
            <textarea name="message" class="form-control" rows="3" placeholder="예: 안녕하세요 김복지님, 10시~11시 사이 긴급 업무 수송으로 인해 시간대를 13시 이후로 변경 부탁드립니다." required></textarea>
          </div>

          <button type="submit" class="btn-primary" style="background:linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color:#FFF;">
            💬 협의 요청 메시지 전송
          </button>
        </form>
      </div>
    `;
  },

  /**
   * 첨부 이미지 벤치마킹: 상단 둥근 캡슐 칩 스크롤 바
   */
  renderQuickChipsBar() {
    return `
      <div class="quick-chips-container">
        <button class="chip-btn" id="chip-btn-report">
          <span>📧</span> 내 차 리포트
        </button>
        <button class="chip-btn" id="chip-btn-request">
          <span>🚗</span> 운행 신청
        </button>
        <button class="chip-btn" id="chip-btn-drivelog">
          <span>✏️</span> 일지 작성
        </button>
        <button class="chip-btn" id="chip-btn-fuel">
          <span>⛽</span> 주유 입력
        </button>
        <button class="chip-btn" id="chip-btn-stats">
          <span>📊</span> 월별 통계
        </button>
      </div>
    `;
  },

  /**
   * 첨부 이미지 벤치마킹: 4종 퀵 서비스 그리드 (정비소 예약 / 운행 퀵 메뉴)
   */
  renderServiceQuickGrid() {
    return `
      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-main);">차량 퀵 서비스 메뉴</h4>
        <span style="font-size:0.75rem; color:var(--text-muted);">전체보기 ›</span>
      </div>
      <div class="service-quick-grid">
        <div class="service-card" id="quick-service-request">
          <span class="service-discount-tag" style="background:var(--status-rose);">실시간</span>
          <div class="service-icon-box" style="background:rgba(239, 68, 68, 0.15); color:#EF4444;">🚘</div>
          <div class="service-title">운행 신청</div>
        </div>

        <div class="service-card" id="quick-service-drivelog">
          <span class="service-discount-tag" style="background:var(--status-emerald);">기록작성</span>
          <div class="service-icon-box" style="background:rgba(16, 185, 129, 0.15); color:#10B981;">📑</div>
          <div class="service-title">운행 일지</div>
        </div>

        <div class="service-card" id="quick-service-fuel">
          <span class="service-discount-tag" style="background:var(--accent-gold); color:#000;">차계부</span>
          <div class="service-icon-box" style="background:rgba(229, 169, 60, 0.15); color:var(--accent-gold);">⛽</div>
          <div class="service-title">주유 입력</div>
        </div>

        <div class="service-card" id="quick-service-accident">
          <span class="service-discount-tag" style="background:#6366F1;">긴급24h</span>
          <div class="service-icon-box" style="background:rgba(99, 102, 241, 0.15); color:#6366F1;">🚨</div>
          <div class="service-title">사고 경위서</div>
        </div>
      </div>
    `;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AppComponents;
}
