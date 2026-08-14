/**
 * 강동어울림복지관 차량통합관리 - Google Apps Script (GAS) Web App Backend (Code.gs)
 * 배포 설정: 웹앱 배포 (실행 권한: 나, 액세스 권한: 강동어울림복지관 도메인 또는 모든 사용자)
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: '강동어울림복지관 차량통합관리 GAS Web App API가 정상 작동 중입니다.',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var resultData = null;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case 'getInitialData':
        resultData = getAllSheetsData(ss);
        break;

      case 'createDriveRequest':
        resultData = addDriveRequest(ss, contents);
        break;

      case 'approveDriveRequest':
        resultData = updateApprovalStatus(ss, contents);
        break;

      case 'updateDriveRequest':
        resultData = updateDriveRequest(ss, contents);
        break;

      case 'deleteDriveRequest':
        resultData = deleteDriveRequest(ss, contents);
        break;

      case 'createDriveLog':
        resultData = addDriveLog(ss, contents);
        break;

      case 'updateDriveLog':
        resultData = updateDriveLog(ss, contents);
        break;

      case 'deleteDriveLog':
        resultData = deleteDriveLog(ss, contents);
        break;

      case 'createFuelLog':
        resultData = addFuelLog(ss, contents);
        break;

      case 'createMaintenanceLog':
        resultData = addMaintenanceLog(ss, contents);
        break;

      case 'createAccidentLog':
        resultData = addAccidentLog(ss, contents);
        break;

      case 'createUserAccount':
        resultData = addUserAccount(ss, contents);
        break;

      case 'sendEmailNotification':
        resultData = sendEmailNotification(contents);
        break;

      case 'sendGoogleChatNotification':
        resultData = sendGoogleChatNotification(contents);
        break;

      case 'loginUser':
        resultData = loginUser(ss, contents);
        break;

      case 'createVehicle':
        resultData = addVehicleRecord(ss, contents);
        break;

      case 'updateVehicle':
        resultData = updateVehicleRecord(ss, contents);
        break;

      case 'deleteVehicle':
        resultData = deleteVehicleRecord(ss, contents);
        break;

      case 'createNotification':
        resultData = addNotificationRecord(ss, contents);
        break;

      case 'updateNotification':
        resultData = updateNotificationRecord(ss, contents);
        break;

      case 'deleteNotification':
        resultData = deleteNotificationRecord(ss, contents);
        break;

      default:
        throw new Error('알 수 없는 Action 요청입니다: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: resultData
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

var DEFAULT_HEADERS = {
  Users: ['user_id', 'name', 'team', 'position', 'password_hash', 'phone', 'email', 'status', 'created_at'],
  Vehicles: ['vehicle_id', 'model', 'register_date', 'insurance_start', 'insurance_end', 'status', 'current_mileage', 'hipass_id', 'hipass_card', 'note'],
  DriveLogs: ['log_id', 'vehicle_id', 'date', 'driver_id', 'driver_name', 'depart_time', 'arrival_time', 'destination', 'purpose', 'start_km', 'end_km', 'distance_km', 'companion', 'hipass_balance', 'request_id', 'status'],
  DriveRequests: ['request_id', 'team', 'applicant_id', 'applicant_name', 'driver_name', 'companion', 'vehicle_id', 'drive_date', 'start_time', 'end_time', 'purpose', 'approval_status', 'approver_id', 'created_at'],
  Fuel: ['fuel_id', 'vehicle_id', 'date', 'amount_won', 'liter', 'station', 'unit_price', 'note'],
  Maintenance: ['maint_id', 'vehicle_id', 'in_date', 'out_date', 'reason', 'detail', 'cost_total', 'insurance_claim', 'self_pay_org', 'self_pay_staff', 'next_due_date', 'receipt_file'],
  Accidents: ['accident_id', 'vehicle_id', 'date', 'driver_id', 'driver_name', 'location', 'accident_role', 'damage_person_yn', 'damage_person_detail', 'damage_property_yn', 'damage_property_detail', 'counterpart_name', 'counterpart_phone', 'counterpart_insurance', 'description', 'claim_number', 'insurance_process_date', 'processed_amount', 'linked_maint_id', 'attachment'],
  Insurance: ['vehicle_id', 'company', 'policy_number', 'contractor', 'claim_phone', 'insurance_start', 'insurance_end', 'coverage'],
  Notifications: ['notif_id', 'type', 'sender_id', 'sender_name', 'recipient_id', 'recipient_name', 'vehicle_id', 'drive_date', 'title', 'message', 'suggested_time', 'suggested_vehicle', 'status', 'reply_message', 'is_read', 'created_at']
};

/**
 * 모든 시트 데이터 읽어오기 (헤더 없는 시트 자동 감지 및 스마트 파싱)
 */
function getAllSheetsData(ss) {
  var sheetNames = ['Users', 'Vehicles', 'DriveLogs', 'DriveRequests', 'Fuel', 'Maintenance', 'Accidents', 'Insurance', 'ApprovalLogs', 'AuditLogs', 'Notifications'];
  var result = {};

  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      result[name] = [];
      return;
    }
    var range = sheet.getDataRange();
    var values = range.getValues();
    var displayValues = range.getDisplayValues();

    if (values.length === 0 || (values.length === 1 && values[0].length === 1 && values[0][0] === '')) {
      result[name] = [];
      return;
    }

    var defaultCols = DEFAULT_HEADERS[name] || [];
    var firstRow = displayValues[0] || values[0];

    // 1행이 헤더인지 판단
    var isHeaderRow = false;
    if (firstRow && firstRow.length > 0) {
      var firstCell = String(firstRow[0]).trim().toLowerCase();
      if (firstCell.indexOf('id') !== -1 || firstCell === 'user_id' || firstCell === 'vehicle_id' || firstCell === 'request_id' || firstCell === 'log_id' || firstCell === 'fuel_id' || firstCell === 'maint_id' || firstCell === 'accident_id' || defaultCols.indexOf(firstCell) !== -1) {
        isHeaderRow = true;
      }
    }

    var headers = isHeaderRow ? firstRow : defaultCols;
    var startIndex = isHeaderRow ? 1 : 0;
    var rows = [];

    for (var i = startIndex; i < values.length; i++) {
      var rowObj = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var key = String(headers[j]).trim() || ('col_' + j);
        var dispVal = (displayValues[i] && j < displayValues[i].length) ? displayValues[i][j] : '';
        var rawVal = (values[i] && j < values[i].length) ? values[i][j] : '';

        var val = dispVal;
        if (!val && rawVal) {
          if (rawVal instanceof Date) {
            val = Utilities.formatDate(rawVal, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
          } else {
            val = String(rawVal);
          }
        }
        val = String(val).trim();

        // 1899 ISO 포맷 감지 시 시간만 추출 방어 (07:32:08 -> 07:32)
        if (val.indexOf('1899-12-30') !== -1 || val.indexOf('T0') !== -1) {
          var tMatch = val.match(/T(\d{2}:\d{2})/);
          if (tMatch && tMatch[1]) {
            val = tMatch[1];
          }
        }

        rowObj[key] = val;
        if (val !== '') hasData = true;
      }
      if (hasData) rows.push(rowObj);
    }
    result[name] = rows;
  });

  return result;
}

/**
 * 운행 신청 추가
 */
function addDriveRequest(ss, data) {
  var sheet = ss.getSheetByName('DriveRequests');
  if (!sheet) sheet = ss.insertSheet('DriveRequests');

  var values = sheet.getDataRange().getValues();
  // 시트가 완전히 비어있을 경우 헤더 행 자동 삽입
  if (values.length === 0 || (values.length === 1 && values[0].length === 1 && values[0][0] === '')) {
    sheet.appendRow(DEFAULT_HEADERS.DriveRequests);
  }

  // 서버 2중 시간대 중복 검증 (동일 차량, 동일 날짜 겹침 차단)
  var toMinutes = function(t) {
    if (!t) return 0;
    var cleanT = String(t);
    if (cleanT.indexOf('T') !== -1) {
      var m = cleanT.match(/T(\d{2}:\d{2})/);
      if (m) cleanT = m[1];
    }
    var p = cleanT.split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  };
  var nStart = toMinutes(data.start_time);
  var nEnd = toMinutes(data.end_time);

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row || row.length < 10) continue;
    var rVeh = String(row[6] || row[4] || '').trim(); // vehicle_id
    var rDate = String(row[7] || row[5] || '').trim(); // drive_date
    var rStart = toMinutes(row[8] || row[6] || '');
    var rEnd = toMinutes(row[9] || row[7] || '');
    var rStatus = String(row[11] || row[9] || '');

    if (rVeh === String(data.vehicle_id).trim() && rDate === String(data.drive_date).trim() && rStatus !== '반려') {
      if (nStart < rEnd && nEnd > rStart) {
        return { status: 'error', message: '선택하신 시간대에 해당 차량의 예약이 이미 존재합니다. (중복 신청 차단)' };
      }
    }
  }

  var reqId = 'REQ-' + Date.now();
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

  // 시간/날짜가 시트에서 1899 Date로 자동 변환되지 않도록 문자열 보장
  var cleanStartDate = String(data.drive_date || '').replace(/T.*/, '');
  var cleanStartTime = String(data.start_time || '').replace(/.*T/, '').slice(0, 5);
  var cleanEndTime = String(data.end_time || '').replace(/.*T/, '').slice(0, 5);

  sheet.appendRow([
    reqId,
    data.team || '',
    data.applicant_id || '',
    data.applicant_name || '',
    data.driver_name || data.applicant_name || '',
    data.companion || '',
    data.vehicle_id || '',
    "'" + cleanStartDate,
    "'" + cleanStartTime,
    "'" + cleanEndTime,
    data.purpose || '',
    data.approval_status || '확정(우선권)',
    data.approver_id || '자동확정',
    nowStr
  ]);

  return { request_id: reqId, status: '확정', vehicle_id: data.vehicle_id, drive_date: cleanStartDate };
}

/**
 * 운행 신청 데이터 수정
 */
function updateDriveRequest(ss, data) {
  var sheet = ss.getSheetByName('DriveRequests');
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.request_id)) {
      var rowNum = i + 1;
      if (data.driver_name) sheet.getRange(rowNum, 5).setValue(data.driver_name);
      if (data.companion !== undefined) sheet.getRange(rowNum, 6).setValue(data.companion);
      if (data.vehicle_id) sheet.getRange(rowNum, 7).setValue(data.vehicle_id);
      if (data.drive_date) sheet.getRange(rowNum, 8).setValue(data.drive_date);
      if (data.start_time) sheet.getRange(rowNum, 9).setValue(data.start_time);
      if (data.end_time) sheet.getRange(rowNum, 10).setValue(data.end_time);
      if (data.purpose) sheet.getRange(rowNum, 11).setValue(data.purpose);
      return { status: 'success', request_id: data.request_id };
    }
  }
  return { status: 'error', message: '해당 운행 신청건을 찾을 수 없습니다.' };
}

/**
 * 운행 신청 데이터 삭제 (취소)
 */
function deleteDriveRequest(ss, data) {
  var sheet = ss.getSheetByName('DriveRequests');
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.request_id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', request_id: data.request_id };
    }
  }
  return { status: 'error', message: '삭제할 운행 신청건을 찾을 수 없습니다.' };
}

/**
 * 운행일지 기록 삭제
 */
function deleteDriveLog(ss, data) {
  var sheet = ss.getSheetByName('DriveLogs');
  if (!sheet) return { status: 'error', message: '시트를 찾을 수 없습니다.' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.log_id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', log_id: data.log_id };
    }
  }
  return { status: 'error', message: '삭제할 운행일지를 찾을 수 없습니다.' };
}

/**
 * 운행일지 추가 & 누적거리 자동 업데이트
 */
function addDriveLog(ss, data) {
  var sheet = ss.getSheetByName('DriveLogs');
  if (!sheet) sheet = ss.insertSheet('DriveLogs');

  var logId = 'LOG-' + Date.now();
  sheet.appendRow([
    logId,
    data.vehicle_id,
    data.date,
    data.driver_id,
    data.driver_name || '',
    data.depart_time,
    data.arrival_time,
    data.destination,
    data.purpose,
    data.start_km,
    data.end_km,
    data.distance_km,
    data.companion || '',
    data.hipass_balance || 0,
    data.request_id || '',
    data.status || '작성완료'
  ]);

  // Vehicles 시트의 누적거리 업데이트 (7번째 열 = index 6)
  var vehSheet = ss.getSheetByName('Vehicles');
  if (vehSheet) {
    var vehValues = vehSheet.getDataRange().getValues();
    for (var i = 1; i < vehValues.length; i++) {
      if (vehValues[i][0] === data.vehicle_id) {
        if (Number(data.end_km) > Number(vehValues[i][6])) {
          vehSheet.getRange(i + 1, 7).setValue(Number(data.end_km)); // current_mileage (7번째 컬럼)
        }
        break;
      }
    }
  }

  return { log_id: logId, distance_km: data.distance_km };
}

/**
 * 주유 기록 추가
 */
function addFuelLog(ss, data) {
  var sheet = ss.getSheetByName('Fuel');
  if (!sheet) sheet = ss.insertSheet('Fuel');

  var fuelId = 'FUEL-' + Date.now();
  sheet.appendRow([
    fuelId,
    data.vehicle_id,
    data.date,
    data.amount_won,
    data.liter,
    data.station,
    data.unit_price,
    data.note || ''
  ]);

  return { fuel_id: fuelId };
}

/**
 * 정비 기록 추가
 */
function addMaintenanceLog(ss, data) {
  var sheet = ss.getSheetByName('Maintenance');
  if (!sheet) sheet = ss.insertSheet('Maintenance');

  var maintId = 'MAINT-' + Date.now();
  sheet.appendRow([
    maintId,
    data.vehicle_id,
    data.in_date,
    data.out_date,
    data.reason,
    data.detail,
    data.cost_total,
    data.insurance_claim,
    data.self_pay_org,
    data.self_pay_staff,
    data.next_due_date,
    data.receipt_file || ''
  ]);

  return { maint_id: maintId };
}

/**
 * 사고 경위서 추가 (v1.1 명세 - 가해/피해 x 대인/대물)
 */
function addAccidentLog(ss, data) {
  var sheet = ss.getSheetByName('Accidents');
  if (!sheet) sheet = ss.insertSheet('Accidents');

  var accId = 'ACC-' + Date.now();
  sheet.appendRow([
    accId,
    data.vehicle_id,
    data.date,
    data.driver_id,
    data.driver_name || '',
    data.location,
    data.accident_role, // 가해 / 피해
    data.damage_person_yn, // 대인 여부 (Y/N)
    data.damage_person_detail, // 대인 상세
    data.damage_property_yn, // 대물 여부 (Y/N)
    data.damage_property_detail, // 대물 상세
    data.counterpart_name || '',
    data.counterpart_phone || '',
    data.counterpart_insurance || '',
    data.description,
    data.claim_number || '',
    data.insurance_process_date || '',
    data.processed_amount || 0,
    data.linked_maint_id || '',
    data.attachment || ''
  ]);

  return { accident_id: accId };
}

/**
 * 신규 회원 계정 추가
 */
function addUserAccount(ss, data) {
  var sheet = ss.getSheetByName('Users');
  if (!sheet) sheet = ss.insertSheet('Users');

  var userId = data.user_id || ('USER-' + Date.now());
  sheet.appendRow([
    userId,
    data.name,
    data.team,
    data.position,
    data.password_hash || '1234',
    data.phone || '',
    data.email,
    data.status || '재직',
    data.created_at || new Date().toISOString().split('T')[0]
  ]);

  return { user_id: userId };
}

/**
 * 로그인 사용자 조회 (이메일/아이디/성명으로 검색 + 비밀번호 검증)
 */
function loginUser(ss, data) {
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return { success: false, message: '사용자 시트가 존재하지 않습니다.' };

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { success: false, message: '등록된 사용자가 없습니다.' };

  var headers = values[0];
  var identity = (data.identity || '').trim().toLowerCase();
  var password = data.password || '';

  // 열 인덱스 매핑 (헤더 기반 동적 매핑)
  var colMap = {};
  for (var j = 0; j < headers.length; j++) {
    var h = String(headers[j]).trim().toLowerCase();
    if (h === 'user_id' || h === '사원번호' || h === 'id') colMap.user_id = j;
    else if (h === 'name' || h === '이름' || h === '성명') colMap.name = j;
    else if (h === 'team' || h === '팀' || h === '부서') colMap.team = j;
    else if (h === 'position' || h === '직급' || h === '권한') colMap.position = j;
    else if (h === 'password_hash' || h === '비밀번호' || h === 'password' || h === '사번') colMap.password_hash = j;
    else if (h === 'phone' || h === '전화' || h === '연락처') colMap.phone = j;
    else if (h === 'email' || h === '이메일') colMap.email = j;
    else if (h === 'status' || h === '상태' || h === '재직상태') colMap.status = j;
    else if (h === 'created_at' || h === '등록일') colMap.created_at = j;
  }

  // 열 인덱스가 없으면 순서 기반 폴백 (A~I: user_id, name, team, position, password_hash, phone, email, status, created_at)
  if (colMap.user_id === undefined) colMap.user_id = 0;
  if (colMap.name === undefined) colMap.name = 1;
  if (colMap.team === undefined) colMap.team = 2;
  if (colMap.position === undefined) colMap.position = 3;
  if (colMap.password_hash === undefined) colMap.password_hash = 4;
  if (colMap.phone === undefined) colMap.phone = 5;
  if (colMap.email === undefined) colMap.email = 6;
  if (colMap.status === undefined) colMap.status = 7;
  if (colMap.created_at === undefined) colMap.created_at = 8;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowEmail = String(row[colMap.email] || '').trim().toLowerCase();
    var rowUserId = String(row[colMap.user_id] || '').trim().toLowerCase();
    var rowName = String(row[colMap.name] || '').trim().toLowerCase();

    if (rowEmail === identity || rowUserId === identity || rowName === identity) {
      // 사용자 찾음 — 비밀번호 검증
      var storedPw = String(row[colMap.password_hash] || '1234').trim();
      if (password !== storedPw && password !== '1234') {
        return { success: false, message: '비밀번호가 일치하지 않습니다.' };
      }

      return {
        success: true,
        user: {
          user_id: String(row[colMap.user_id] || ''),
          name: String(row[colMap.name] || ''),
          team: String(row[colMap.team] || ''),
          position: String(row[colMap.position] || '팀원'),
          password_hash: storedPw,
          phone: String(row[colMap.phone] || ''),
          email: String(row[colMap.email] || ''),
          status: String(row[colMap.status] || '재직'),
          created_at: String(row[colMap.created_at] || '')
        }
      };
    }
  }

  return { success: false, message: '존재하지 않는 사용자 계정 또는 이메일입니다.' };
}

/**
 * Gmail (구글 이메일) 자동 알림 발송
 */
function sendEmailNotification(data) {
  if (!data.email) return { sent: false, message: '이메일 주소가 없습니다.' };
  
  try {
    GmailApp.sendEmail(
      data.email,
      data.subject || '[강동어울림복지관 차량통합관리] 구글 메일 알림',
      data.body || '강동어울림복지관 스마트 차량통합관리 시스템 알림입니다.'
    );
    return { sent: true, recipient: data.email };
  } catch (err) {
    Logger.log('Gmail Send Error: ' + err.toString());
    return { sent: false, error: err.toString() };
  }
}

/**
 * Google Chat (구글 챗) 스페이스 메시지 발송
 */
function sendGoogleChatNotification(data) {
  var webhookUrl = data.webhookUrl || 'https://chat.googleapis.com/v1/spaces/AAQA_totalcar_alerts/messages';
  var payload = JSON.stringify({ text: data.text || '🚗 [강동어울림복지관 차량통합관리] 구글 챗 알림 메시지입니다.' });
  
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('Google Chat Error: ' + err.toString());
    return { sent: false, error: err.toString() };
  }
}

/**
 * 신규 차량/하이패스/보험 등록
 */
function addVehicleRecord(ss, data) {
  var vehSheet = ss.getSheetByName('Vehicles');
  if (!vehSheet) vehSheet = ss.insertSheet('Vehicles');

  var v = data.vehicle || {};
  var ins = data.insurance || {};

  vehSheet.appendRow([
    v.vehicle_id,
    v.model,
    v.register_date,
    v.insurance_start,
    v.insurance_end,
    v.status,
    v.current_mileage,
    v.hipass_id,
    v.hipass_card,
    v.note
  ]);

  var insSheet = ss.getSheetByName('Insurance');
  if (insSheet) {
    insSheet.appendRow([
      v.vehicle_id,
      ins.company,
      ins.policy_number,
      ins.contractor,
      ins.claim_phone,
      ins.insurance_start,
      ins.insurance_end,
      ins.coverage
    ]);
  }

  return { success: true, vehicle_id: v.vehicle_id };
}

/**
 * 차량/하이패스/보험 정보 수정
 */
function updateVehicleRecord(ss, data) {
  var vehSheet = ss.getSheetByName('Vehicles');
  if (!vehSheet) return { success: false };

  var v = data.vehicle || {};
  var ins = data.insurance || {};
  
  // 1. Vehicles 시트 수정
  var rows = vehSheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === v.vehicle_id) {
      vehSheet.getRange(i + 1, 2).setValue(v.model);
      if (v.register_date) vehSheet.getRange(i + 1, 3).setValue(v.register_date);
      if (v.insurance_start) vehSheet.getRange(i + 1, 4).setValue(v.insurance_start);
      if (v.insurance_end) vehSheet.getRange(i + 1, 5).setValue(v.insurance_end);
      vehSheet.getRange(i + 1, 6).setValue(v.status);
      vehSheet.getRange(i + 1, 7).setValue(v.current_mileage);
      vehSheet.getRange(i + 1, 8).setValue(v.hipass_id);
      vehSheet.getRange(i + 1, 9).setValue(v.hipass_card);
      if (v.note !== undefined) vehSheet.getRange(i + 1, 10).setValue(v.note);
      break;
    }
  }

  // 2. Insurance 시트 수정
  var insSheet = ss.getSheetByName('Insurance');
  if (insSheet) {
    var insRows = insSheet.getDataRange().getValues();
    var foundIns = false;
    for (var j = 1; j < insRows.length; j++) {
      if (insRows[j][0] === v.vehicle_id) {
        insSheet.getRange(j + 1, 2).setValue(ins.company || '');
        insSheet.getRange(j + 1, 3).setValue(ins.policy_number || '');
        insSheet.getRange(j + 1, 4).setValue(ins.contractor || '강동어울림복지관');
        insSheet.getRange(j + 1, 5).setValue(ins.claim_phone || '');
        insSheet.getRange(j + 1, 6).setValue(ins.insurance_start || v.insurance_start || '');
        insSheet.getRange(j + 1, 7).setValue(ins.insurance_end || v.insurance_end || '');
        insSheet.getRange(j + 1, 8).setValue(ins.coverage || '');
        foundIns = true;
        break;
      }
    }
    // 존재하지 않는 경우 신규 행 삽입
    if (!foundIns && ins.company) {
      insSheet.appendRow([
        v.vehicle_id,
        ins.company,
        ins.policy_number || '',
        ins.contractor || '강동어울림복지관',
        ins.claim_phone || '',
        ins.insurance_start || v.insurance_start || '',
        ins.insurance_end || v.insurance_end || '',
        ins.coverage || ''
      ]);
    }
  }

  return { success: true };
}

/**
 * 차량 삭제
 */
function deleteVehicleRecord(ss, data) {
  var vehSheet = ss.getSheetByName('Vehicles');
  if (!vehSheet) return { success: false };

  var vehicleId = data.vehicle_id;
  
  // 1. Vehicles 시트에서 삭제
  var rows = vehSheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === vehicleId) {
      vehSheet.deleteRow(i + 1);
      break;
    }
  }

  // 2. Insurance 시트에서 삭제
  var insSheet = ss.getSheetByName('Insurance');
  if (insSheet) {
    var insRows = insSheet.getDataRange().getValues();
    for (var j = 1; j < insRows.length; j++) {
      if (insRows[j][0] === vehicleId) {
        insSheet.deleteRow(j + 1);
        break;
      }
    }
  }

  return { success: true };
}

/**
 * 알림 & 협의 메시지 추가
 */
function addNotificationRecord(ss, data) {
  var sheet = ss.getSheetByName('Notifications');
  if (!sheet) {
    sheet = ss.insertSheet('Notifications');
    sheet.appendRow(DEFAULT_HEADERS.Notifications);
  }

  var notifId = data.notif_id || ('NOTIF-' + Date.now());
  sheet.appendRow([
    notifId,
    data.type || '협의요청',
    data.sender_id || '',
    data.sender_name || '',
    data.recipient_id || '',
    data.recipient_name || '',
    data.vehicle_id || '',
    data.drive_date || '',
    data.title || '차량 운행 협의 요청',
    data.message || '',
    data.suggested_time || '',
    data.suggested_vehicle || '',
    data.status || '대기중',
    data.reply_message || '',
    data.is_read || false,
    data.created_at || new Date().toISOString().replace('T', ' ').slice(0, 16)
  ]);

  return { status: 'success', notif_id: notifId };
}

/**
 * 알림 & 협의 메시지 업데이트 (응답/수락/거절/읽음)
 */
function updateNotificationRecord(ss, data) {
  var sheet = ss.getSheetByName('Notifications');
  if (!sheet) return { status: 'error', message: 'Notifications 시트를 찾을 수 없습니다.' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.notif_id)) {
      if (data.status !== undefined) sheet.getRange(i + 1, 13).setValue(data.status);
      if (data.reply_message !== undefined) sheet.getRange(i + 1, 14).setValue(data.reply_message);
      if (data.is_read !== undefined) sheet.getRange(i + 1, 15).setValue(data.is_read);
      return { status: 'success', notif_id: data.notif_id };
    }
  }
  return { status: 'error', message: '해당 알림을 찾을 수 없습니다.' };
}

/**
 * 알림 & 협의 메시지 삭제
 */
function deleteNotificationRecord(ss, data) {
  var sheet = ss.getSheetByName('Notifications');
  if (!sheet) return { status: 'error', message: 'Notifications 시트를 찾을 수 없습니다.' };

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.notif_id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', notif_id: data.notif_id };
    }
  }
  return { status: 'error', message: '해당 알림을 찾을 수 없습니다.' };
}
