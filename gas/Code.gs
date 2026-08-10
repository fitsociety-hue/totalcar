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
    data.vehicle_id || '',
    data.drive_date || '',
    data.start_time || '',
    data.end_time || '',
    data.purpose || '',
    '대기',
    '',
    nowStr
  ]);

  return { request_id: reqId, status: '대기' };
}

/**
 * 운행 신청 승인/반려 업데이트
 */
function updateApprovalStatus(ss, data) {
  var sheet = ss.getSheetByName('DriveRequests');
  if (!sheet) return false;

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.request_id) {
      sheet.getRange(i + 1, 9).setValue(data.status); // approval_status (9번째 컬럼)
      sheet.getRange(i + 1, 10).setValue(data.approver_id || ''); // approver_id
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
    '작성완료'
  ]);

  // Vehicles 시트의 누적거리 업데이트
  var vehSheet = ss.getSheetByName('Vehicles');
  if (vehSheet) {
    var vehValues = vehSheet.getDataRange().getValues();
    for (var i = 1; i < vehValues.length; i++) {
      if (vehValues[i][0] === data.vehicle_id) {
        if (Number(data.end_km) > Number(vehValues[i][7])) {
          vehSheet.getRange(i + 1, 8).setValue(Number(data.end_km)); // current_mileage (8번째 컬럼)
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
    '재직',
    new Date().toISOString().split('T')[0]
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
    return { sent: true };
  } catch (err) {
    Logger.log('Google Chat Error: ' + err.toString());
    return { sent: false, error: err.toString() };
  }
}
