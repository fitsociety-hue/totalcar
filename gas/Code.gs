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

      case 'createDriveLog':
        resultData = addDriveLog(ss, contents);
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

      case 'createVehicle':
        resultData = addVehicleRecord(ss, contents);
        break;

      case 'updateVehicle':
        resultData = updateVehicleRecord(ss, contents);
        break;

      case 'deleteVehicle':
        resultData = deleteVehicleRecord(ss, contents);
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

/**
 * 모든 시트 데이터 읽어오기
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
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      result[name] = [];
      return;
    }
    var headers = values[0];
    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var rowObj = {};
      for (var j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = values[i][j];
      }
      rows.push(rowObj);
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

  var reqId = 'REQ-' + Date.now();
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');

  sheet.appendRow([
    reqId,
    data.team || '',
    data.applicant_id || '',
    data.applicant_name || '',
    data.vehicle_id || '',
    data.drive_date || '',
    data.start_time || '',
    data.end_time || '',
    data.purpose || '',
    data.approval_status || '확정(우선권)',
    data.approver_id || '자동확정',
    nowStr
  ]);

  return { request_id: reqId, status: '확정' };
}

/**
 * 운행 신청 시간/차량 변경 (시간 협의 수락 시)
 */
function updateDriveRequestTime(ss, data) {
  var sheet = ss.getSheetByName('DriveRequests');
  if (!sheet) return false;

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.request_id) {
      if (data.vehicle_id) sheet.getRange(i + 1, 5).setValue(data.vehicle_id);
      if (data.drive_date) sheet.getRange(i + 1, 6).setValue(data.drive_date);
      if (data.start_time) sheet.getRange(i + 1, 7).setValue(data.start_time);
      if (data.end_time) sheet.getRange(i + 1, 8).setValue(data.end_time);
      if (data.note) sheet.getRange(i + 1, 9).setValue(data.note);
      return true;
    }
  }
  return false;
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
