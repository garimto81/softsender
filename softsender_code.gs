const CFG = {
  CUE_SHEET_ID: PropertiesService.getScriptProperties().getProperty('CUE_SHEET_ID') || '13LpVWYHaJAMtvc1OiCtkrcAYqavkXWaTg3Vke0R0CUQ',
  CUE_TAB_VIRTUAL: 'virtual',
  TYPE_SHEET_ID: PropertiesService.getScriptProperties().getProperty('TYPE_SHEET_ID') || '19e7eDjoZRFZooghZJF3XmOZzZcgmqsp9mFAfjvJWhj4',
  TYPE_TAB: 'Type',
  DEFAULT_STATUS_INCOMPLETE: '미완료', // 상수명 명확화 (FIX_E → DEFAULT_STATUS_INCOMPLETE)
  DEFAULT_CONTENT_TYPE: 'SOFT',       // 상수명 명확화 (FIX_G → DEFAULT_CONTENT_TYPE)
  KST_TZ: 'Asia/Seoul',
  TIME_DISPLAY: 'HH:mm',
};
function doGet() {
  return HtmlService.createTemplateFromFile('page')
    .evaluate()
    .setTitle('Soft Content Sender')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT); // 클릭재킹 방지 (보안 강화)
}

// ===== 성능 측정 전용 테스트 함수 =====
function testPerformanceDetailed() {
  Logger.log('📊 [PERF-TEST] 상세 성능 측정 시작');
  Logger.log('='.repeat(60));

  const cueId = CFG.CUE_SHEET_ID;
  const results = {};

  // ===== 1. SpreadsheetApp.openById 측정 =====
  Logger.log('\n📌 [1/8] SpreadsheetApp.openById() 테스트');
  const t1_start = new Date().getTime();
  const ss = SpreadsheetApp.openById(cueId);
  const t1_end = new Date().getTime();
  results.openById = t1_end - t1_start;
  Logger.log(`   ⏱️ 소요시간: ${results.openById}ms`);

  // ===== 2. getSheetByName 측정 =====
  Logger.log('\n📌 [2/8] getSheetByName() 테스트');
  const t2_start = new Date().getTime();
  const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
  const t2_end = new Date().getTime();
  results.getSheetByName = t2_end - t2_start;
  Logger.log(`   ⏱️ 소요시간: ${results.getSheetByName}ms`);

  // ===== 3. getLastRow 측정 =====
  Logger.log('\n📌 [3/8] getLastRow() 테스트');
  const t3_start = new Date().getTime();
  const last = sh.getLastRow();
  const t3_end = new Date().getTime();
  results.getLastRow = t3_end - t3_start;
  Logger.log(`   ⏱️ 소요시간: ${results.getLastRow}ms`);
  Logger.log(`   📊 전체 행 수: ${last}`);

  // ===== 4. B열 전체 읽기 측정 =====
  Logger.log('\n📌 [4/8] B열 전체 읽기 (getDisplayValues) 테스트');
  const t4_start = new Date().getTime();
  const colB = sh.getRange(2, 2, last - 1, 1).getDisplayValues().flat();
  const t4_end = new Date().getTime();
  results.readColumnB = t4_end - t4_start;
  Logger.log(`   ⏱️ 소요시간: ${results.readColumnB}ms`);
  Logger.log(`   📊 읽은 행 수: ${colB.length}`);

  // ===== 5. findIndex (시간 매칭) 측정 =====
  Logger.log('\n📌 [5/8] findIndex() 시간 매칭 테스트');
  const nowHHmm = Utilities.formatDate(new Date(), CFG.KST_TZ, 'HH:mm');
  const t5_start = new Date().getTime();
  const rowIdx0 = colB.findIndex(v => {
    const s = String(v).trim();
    if (/^\d{2}:\d{2}$/.test(s)) return s === nowHHmm;
    const m = s.match(/^(\d{2}:\d{2}):\d{2}$/);
    return m ? (m[1] === nowHHmm) : false;
  });
  const t5_end = new Date().getTime();
  results.findIndex = t5_end - t5_start;
  Logger.log(`   ⏱️ 소요시간: ${results.findIndex}ms`);
  Logger.log(`   📊 매칭된 인덱스: ${rowIdx0}, 행: ${rowIdx0 >= 0 ? 2 + rowIdx0 : 'N/A'}`);

  if (rowIdx0 < 0) {
    Logger.log('⚠️ 시간 매칭 실패 - 테스트 중단');
    return results;
  }

  const row = 2 + rowIdx0;

  // ===== 6. reserveSCNumber 측정 (전체) =====
  Logger.log('\n📌 [6/8] reserveSCNumber() 테스트');
  const t6_start = new Date().getTime();
  const scNumber = reserveSCNumber(cueId, row, ss, sh);  // Sheet 객체 전달
  const t6_end = new Date().getTime();
  results.reserveSCNumber = t6_end - t6_start;
  Logger.log(`   ⏱️ 소요시간: ${results.reserveSCNumber}ms`);
  Logger.log(`   📊 발급된 SC 번호: ${scNumber}`);

  // ===== 7. 단일 셀 읽기 (J열) 측정 =====
  Logger.log('\n📌 [7/8] getRange().getValue() 단일 셀 읽기 테스트');
  const t7_start = new Date().getTime();
  const jCurrent = sh.getRange(row, 10, 1, 1).getValue();
  const t7_end = new Date().getTime();
  results.readSingleCell = t7_end - t7_start;
  Logger.log(`   ⏱️ 소요시간: ${results.readSingleCell}ms`);

  // ===== 8. 개별 setValue x5 측정 =====
  Logger.log('\n📌 [8/8] setValue() x5회 (개별 쓰기) 테스트');
  const testRow = last + 1; // 마지막 행 다음에 테스트

  const t8_1_start = new Date().getTime();
  sh.getRange(testRow, 5, 1, 1).setValue('테스트1');
  const t8_1_end = new Date().getTime();
  results.setValue_1 = t8_1_end - t8_1_start;
  Logger.log(`   ⏱️ [1/5] E열 쓰기: ${results.setValue_1}ms`);

  const t8_2_start = new Date().getTime();
  sh.getRange(testRow, 6, 1, 1).setValue('테스트2');
  const t8_2_end = new Date().getTime();
  results.setValue_2 = t8_2_end - t8_2_start;
  Logger.log(`   ⏱️ [2/5] F열 쓰기: ${results.setValue_2}ms`);

  const t8_3_start = new Date().getTime();
  sh.getRange(testRow, 7, 1, 1).setValue('테스트3');
  const t8_3_end = new Date().getTime();
  results.setValue_3 = t8_3_end - t8_3_start;
  Logger.log(`   ⏱️ [3/5] G열 쓰기: ${results.setValue_3}ms`);

  const t8_4_start = new Date().getTime();
  sh.getRange(testRow, 10, 1, 1).setValue('테스트4');
  const t8_4_end = new Date().getTime();
  results.setValue_4 = t8_4_end - t8_4_start;
  Logger.log(`   ⏱️ [4/5] J열 쓰기: ${results.setValue_4}ms`);

  const t8_5_start = new Date().getTime();
  sh.getRange(testRow, 11, 1, 1).setValue('미완료');  // K열 validation 호환
  const t8_5_end = new Date().getTime();
  results.setValue_5 = t8_5_end - t8_5_start;
  Logger.log(`   ⏱️ [5/5] K열 쓰기: ${results.setValue_5}ms`);

  results.setValueTotal = results.setValue_1 + results.setValue_2 + results.setValue_3 + results.setValue_4 + results.setValue_5;
  Logger.log(`   ⏱️ 개별 쓰기 총합: ${results.setValueTotal}ms`);

  // ===== 9. Batch setValues 측정 (비교용) =====
  Logger.log('\n📌 [BONUS] setValues() 배치 쓰기 테스트');
  const testRow2 = last + 2;
  const t9_start = new Date().getTime();
  sh.getRange(testRow2, 5, 1, 7).setValues([['테스트1', '테스트2', '테스트3', '', '', '테스트4', '미완료']]);  // K열 validation 호환
  const t9_end = new Date().getTime();
  results.setValuesBatch = t9_end - t9_start;
  Logger.log(`   ⏱️ 배치 쓰기 (7개 셀): ${results.setValuesBatch}ms`);
  Logger.log(`   📊 개선율: ${Math.round((results.setValueTotal - results.setValuesBatch) / results.setValueTotal * 100)}%`);

  // ===== 테스트 행 정리 =====
  sh.deleteRows(testRow, 2);
  Logger.log('\n🧹 테스트 행 삭제 완료');

  // ===== 결과 요약 =====
  Logger.log('\n' + '='.repeat(60));
  Logger.log('📊 성능 측정 결과 요약');
  Logger.log('='.repeat(60));
  Logger.log(`1. openById:           ${results.openById}ms`);
  Logger.log(`2. getSheetByName:     ${results.getSheetByName}ms`);
  Logger.log(`3. getLastRow:         ${results.getLastRow}ms`);
  Logger.log(`4. C열 전체 읽기:      ${results.readColumnC}ms ⚠️`);
  Logger.log(`5. findIndex:          ${results.findIndex}ms`);
  Logger.log(`6. reserveSCNumber:    ${results.reserveSCNumber}ms`);
  Logger.log(`7. 단일 셀 읽기:       ${results.readSingleCell}ms`);
  Logger.log(`8. setValue x5 (개별): ${results.setValueTotal}ms ⚠️`);
  Logger.log(`9. setValues (배치):   ${results.setValuesBatch}ms ✅`);
  Logger.log('='.repeat(60));

  const estimatedTotal = results.openById + results.getLastRow + results.readColumnC +
                         results.findIndex + results.reserveSCNumber +
                         results.readSingleCell + results.setValueTotal;
  Logger.log(`📊 예상 총 소요시간: ${estimatedTotal}ms (${(estimatedTotal/1000).toFixed(2)}초)`);

  if (results.setValuesBatch) {
    const optimizedTotal = estimatedTotal - results.setValueTotal + results.setValuesBatch;
    Logger.log(`⚡ 배치 쓰기 적용 시: ${optimizedTotal}ms (${(optimizedTotal/1000).toFixed(2)}초)`);
    Logger.log(`✅ 절감 시간: ${estimatedTotal - optimizedTotal}ms`);
  }

  return results;
}

// ===== 디버깅용 테스트 함수 =====
function testUpdateVirtual() {
  Logger.log('🧪 [TEST] updateVirtual 성능 테스트 시작');

  const testPayload = {
    cueId: CFG.CUE_SHEET_ID,
    kind: 'PU',
    autoNow: true,
    hhmm: '1050',
    playerName: 'Test Player',
    jBlock: 'TEST PLAYER / US\nCURRENT STACK - 100,000 (50BB)',
    modeData: {
      chipCount: '100000',
      bb: '50'
    }
  };

  Logger.log('🧪 테스트 payload:', JSON.stringify(testPayload));
  const startTotal = new Date().getTime();
  const result = updateVirtual(testPayload);
  const endTotal = new Date().getTime();

  Logger.log(`🧪 [RESULT] 전체 소요시간: ${endTotal - startTotal}ms`);
  Logger.log('🧪 [RESULT] 반환값:', JSON.stringify(result));

  return result;
}

function testReserveSCNumber() {
  Logger.log('🧪 [TEST] reserveSCNumber (하이브리드) 테스트 시작');
  const cueId = CFG.CUE_SHEET_ID;
  const ss = SpreadsheetApp.openById(cueId);
  const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
  const lastRow = sh.getLastRow();

  // 테스트 전 카운터 값 확인
  const props = PropertiesService.getScriptProperties();
  const beforeCounter = parseInt(props.getProperty('SC_COUNTER') || '0', 10);
  Logger.log(`📊 [TEST] 테스트 시작 전 카운터: ${beforeCounter}`);

  // 테스트용 행 3개 확보 (마지막 3행)
  const testRow1 = lastRow + 1;
  const testRow2 = lastRow + 2;
  const testRow3 = lastRow + 3;

  // 1회차: 예약
  const start1 = new Date().getTime();
  const num1 = reserveSCNumber(cueId, testRow1);
  const end1 = new Date().getTime();
  const reserved1 = sh.getRange(testRow1, 6, 1, 1).getValue();
  Logger.log(`🧪 [1회차] 소요시간: ${end1 - start1}ms, 번호: ${num1}, F열: "${reserved1}"`);

  // 2회차: 예약
  const start2 = new Date().getTime();
  const num2 = reserveSCNumber(cueId, testRow2);
  const end2 = new Date().getTime();
  const reserved2 = sh.getRange(testRow2, 6, 1, 1).getValue();
  Logger.log(`🧪 [2회차] 소요시간: ${end2 - start2}ms, 번호: ${num2}, F열: "${reserved2}"`);

  // 3회차: 예약
  const start3 = new Date().getTime();
  const num3 = reserveSCNumber(cueId, testRow3);
  const end3 = new Date().getTime();
  const reserved3 = sh.getRange(testRow3, 6, 1, 1).getValue();
  Logger.log(`🧪 [3회차] 소요시간: ${end3 - start3}ms, 번호: ${num3}, F열: "${reserved3}"`);

  // 테스트 후 카운터 값 확인
  const afterCounter = parseInt(props.getProperty('SC_COUNTER') || '0', 10);
  Logger.log(`📊 [TEST] 테스트 완료 후 카운터: ${afterCounter} (증가량: ${afterCounter - beforeCounter})`);

  Logger.log('🧪 [RESULT] 테스트 완료');
  Logger.log(`🧪 [RESULT] 번호 순차 증가 확인: ${num1} → ${num2} → ${num3}`);

  // 번호가 순차적으로 증가하는지 검증
  const isSequential = (num2 === num1 + 1) && (num3 === num2 + 1);
  Logger.log(`🧪 [RESULT] 순차 증가 검증: ${isSequential ? '✅ 성공' : '❌ 실패'}`);

  // F열 예약 마커 검증
  const hasReserved1 = String(reserved1).startsWith(`SC${String(num1).padStart(3, '0')}_RESERVED`);
  const hasReserved2 = String(reserved2).startsWith(`SC${String(num2).padStart(3, '0')}_RESERVED`);
  const hasReserved3 = String(reserved3).startsWith(`SC${String(num3).padStart(3, '0')}_RESERVED`);
  const allReserved = hasReserved1 && hasReserved2 && hasReserved3;
  Logger.log(`🧪 [RESULT] F열 예약 마커 검증: ${allReserved ? '✅ 성공' : '❌ 실패'}`);

  // Properties 카운터 검증
  const counterMatch = (afterCounter === beforeCounter + 3);
  Logger.log(`🧪 [RESULT] Properties 카운터 검증: ${counterMatch ? '✅ 성공' : '❌ 실패'} (기대: +3, 실제: +${afterCounter - beforeCounter})`);

  // 테스트 행 정리
  sh.deleteRows(testRow1, 3);
  Logger.log('🧪 [CLEANUP] 테스트 행 삭제 완료');

  return {
    num1, num2, num3,
    time1: end1-start1, time2: end2-start2, time3: end3-start3,
    isSequential,
    allReserved,
    counterMatch,
    beforeCounter,
    afterCounter
  };
}

// ===== SC 카운터 초기화 (1회만 실행) =====
function initializeSCCounter() {
  Logger.log('🔧 [SC-INIT] SC 카운터 초기화 시작');

  const cueId = CFG.CUE_SHEET_ID;
  const ss = SpreadsheetApp.openById(cueId);
  const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);

  if (!sh) {
    Logger.log('❌ [SC-INIT] Virtual 시트 없음');
    return { ok: false, error: 'SHEET_NOT_FOUND' };
  }

  const last = sh.getLastRow();
  Logger.log(`📊 [SC-INIT] 전체 행 수: ${last}`);

  if (last < 2) {
    Logger.log('⚠️ [SC-INIT] 빈 시트 - 카운터 0으로 초기화');
    const props = PropertiesService.getScriptProperties();
    props.setProperty('SC_COUNTER', '0');
    props.setProperty('SC_LAST_SYNC', String(new Date().getTime()));
    return { ok: true, counter: 0, message: '빈 시트 - 카운터 0' };
  }

  // ===== F열 전체 스캔 (초기화 시에만) =====
  const t0 = new Date().getTime();
  const colF = sh.getRange(2, 6, last - 1, 1).getValues().flat();
  Logger.log(`⏱️ [SC-INIT] F열 읽기 (${last-1}행): ${new Date().getTime() - t0}ms`);

  // SC 번호 추출
  const t1 = new Date().getTime();
  const scNumbers = colF
    .map(v => {
      const str = String(v || '').trim();
      const match = str.match(/^SC(\d{3})_/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  Logger.log(`⏱️ [SC-INIT] 번호 추출: ${new Date().getTime() - t1}ms, 개수: ${scNumbers.length}`);

  // 최댓값 계산
  const maxNum = scNumbers.length > 0 ? Math.max(...scNumbers) : 0;
  Logger.log(`📊 [SC-INIT] F열 최댓값: ${maxNum}`);

  // Properties에 저장
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SC_COUNTER', String(maxNum));
  props.setProperty('SC_LAST_SYNC', String(new Date().getTime()));

  // E3 셀에 카운터 값 출력
  try {
    sh.getRange(3, 5, 1, 1).setValue(maxNum);
    Logger.log(`✅ [SC-INIT] E3 셀에 카운터 값 출력: ${maxNum}`);
  } catch(e) {
    Logger.log(`⚠️ [SC-INIT] E3 셀 쓰기 실패: ${e.message}`);
  }

  Logger.log(`✅ [SC-INIT] 초기화 완료 - 카운터: ${maxNum}`);

  return {
    ok: true,
    counter: maxNum,
    totalRows: last - 1,
    scCount: scNumbers.length
  };
}

function getBootstrap() {
  // 사용자별 저장된 Sheet ID 로드
  const userPrefs = getUserPreference();
  const userEmail = Session.getEffectiveUser().getEmail();

  return {
    cueId: userPrefs.cueId || CFG.CUE_SHEET_ID,
    typeId: userPrefs.typeId || CFG.TYPE_SHEET_ID,
    tz: CFG.KST_TZ,
    userEmail: userEmail,
    defaultCueId: CFG.CUE_SHEET_ID,
    defaultTypeId: CFG.TYPE_SHEET_ID
  };
}

// 사용자별 Sheet ID 저장
function saveUserPreference(cueId, typeId) {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const props = PropertiesService.getUserProperties();

    if (cueId && cueId.trim()) {
      props.setProperty('LAST_CUE_' + userEmail, cueId.trim());
    }
    if (typeId && typeId.trim()) {
      props.setProperty('LAST_TYPE_' + userEmail, typeId.trim());
    }

    Logger.log(`User preferences saved for ${userEmail}: CUE=${cueId}, TYPE=${typeId}`);
    return { ok: true };
  } catch(e) {
    Logger.log('saveUserPreference error:', e);
    return { ok: false, error: String(e) };
  }
}

// 사용자별 Sheet ID 로드
function getUserPreference() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const props = PropertiesService.getUserProperties();

    const cueId = props.getProperty('LAST_CUE_' + userEmail) || '';
    const typeId = props.getProperty('LAST_TYPE_' + userEmail) || '';

    Logger.log(`User preferences loaded for ${userEmail}: CUE=${cueId}, TYPE=${typeId}`);
    return { cueId, typeId };
  } catch(e) {
    Logger.log('getUserPreference error:', e);
    return { cueId: '', typeId: '' };
  }
}

// 사용자별 Sheet ID 초기화
function clearUserPreference() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const props = PropertiesService.getUserProperties();

    props.deleteProperty('LAST_CUE_' + userEmail);
    props.deleteProperty('LAST_TYPE_' + userEmail);

    Logger.log(`User preferences cleared for ${userEmail}`);
    return { ok: true };
  } catch(e) {
    Logger.log('clearUserPreference error:', e);
    return { ok: false, error: String(e) };
  }
}
// ===== 캐시 강제 갱신 함수 =====
function clearAllCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['TYPE_ROWS_', 'COLUMN_B_']); // 모든 캐시 삭제

    // PropertiesService 캐시도 삭제
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), CFG.KST_TZ, 'yyyyMMdd');
    props.deleteProperty(`COLUMN_B_${CFG.CUE_SHEET_ID}_${today}`);

    Logger.log('✅ 모든 캐시 삭제 완료');
    return { ok: true, message: '캐시가 갱신되었습니다. 페이지를 새로고침하세요.' };
  } catch(e) {
    Logger.log('❌ 캐시 삭제 실패:', e);
    return { ok: false, error: String(e) };
  }
}

// ===== Type Rows 실시간 로드 (캐시 제거 - 신규 플레이어 즉시 반영) =====
function getCachedTypeRows(typeIdOverride) {
  // v11.14.1: 캐시 완전 제거 → 항상 최신 데이터 로드
  // 이유: 신규 플레이어 등록 시 즉시 반영 필요
  Logger.log('📊 [TYPE ROWS] 실시간 로드 시작 (캐시 미사용)');
  return getTypeRows(typeIdOverride);
}

function getTypeRows(typeIdOverride) {
  try {

    const typeId = String(typeIdOverride || CFG.TYPE_SHEET_ID).trim();
    if (!/^[a-zA-Z0-9_-]{44}$/.test(typeId) && typeId !== CFG.TYPE_SHEET_ID) {
      throw new Error('INVALID_SHEET_ID_FORMAT');
    }
    const ss = SpreadsheetApp.openById(typeId);
    const sh = ss.getSheetByName(CFG.TYPE_TAB);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.TYPE_TAB}`);

    // getLastRow() 사용하여 모든 행 읽기 (빈 셀 무시)
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();

    Logger.log(`📊 Type 탭 크기: ${lastRow}행 x ${lastCol}열`);

    if (lastRow < 2) return { ok: true, headers: [], rows: [], typeId };

    const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = values[0].map(v => String(v).trim());
    const idx = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    // 디버깅: 헤더 출력
    Logger.log('📊 Google Sheets 헤더:', headers);
    Logger.log('📊 전체 컬럼 수:', headers.length);

    // Seats.csv 구조 기반 헤더 매핑
    const iRoom      = idx('PokerRoom');
    const iTName     = idx('TableName');
    const iTableId   = idx('TableId');
    const iTNo       = idx('TableNo');
    const iSeatId    = idx('SeatId');
    const iSeat      = idx('SeatNo');
    const iPlayerId  = idx('PlayerId');
    const iPlayer    = idx('PlayerName');
    const iNat       = idx('Nationality');
    const iChipCount = idx('ChipCount');
    const iKeyPlayer = 10; // K열 고정 (0부터 시작: A=0, B=1, ..., K=10)

    // 디버깅: KeyPlayer 컬럼 확인
    Logger.log('⭐ KeyPlayer 컬럼: K열 (인덱스 10) 고정');
    if (headers.length > iKeyPlayer) {
      Logger.log(`⭐ K열 헤더명: "${headers[iKeyPlayer]}"`);
    } else {
      Logger.log('❌ 경고: K열이 존재하지 않음! (헤더 개수:', headers.length + ')');
    }

    // 필수 컬럼 검증 (기본 필드만)
    if ([iRoom, iTNo, iSeat, iPlayer, iNat].some(i => i < 0)) {
      throw new Error('BAD_HEADERS');
    }

    const rows = values.slice(1).map((r, idx) => {
      const rawValue = r[iKeyPlayer]; // K열 원본값
      const keyPlayerValue = String(rawValue || '').trim().toUpperCase();
      const isKeyPlayer = keyPlayerValue === 'TRUE';

      const row = {
        room:      String(r[iRoom] || '').trim(),
        tname:     String(r[iTName] || '').trim(),
        tableId:   String(r[iTableId] || '').trim(),
        tno:       String(r[iTNo] || '').trim(),
        seatId:    String(r[iSeatId] || '').trim(),
        seat:      String(r[iSeat] || '').trim(),
        playerId:  String(r[iPlayerId] || '').trim(),
        player:    String(r[iPlayer] || '').trim(),
        nat:       String(r[iNat] || '').trim(),
        chipCount: String(r[iChipCount] || '').trim(),
        keyPlayer: isKeyPlayer,
      };

      // 디버깅: 모든 행 출력 (필터 전)
      Logger.log(`📋 행 ${idx + 2}: room="${row.room}", tno="${row.tno}", seat="${row.seat}", player="${row.player}"`);

      return row;
    }).filter((r, idx) => {
      const isValid = r.room && r.tno && r.seat;
      if (!isValid) {
        Logger.log(`❌ 행 ${idx + 2} 필터링됨: room="${r.room}", tno="${r.tno}", seat="${r.seat}", player="${r.player}"`);
      }
      return isValid;
    });

    // 디버깅: KeyPlayer가 true인 행 개수
    const keyPlayerCount = rows.filter(r => r.keyPlayer).length;
    Logger.log(`✅ 최종 결과: 전체 ${rows.length}행 중 KeyPlayer=${keyPlayerCount}개`);

    return { ok: true, headers, rows, typeId };
  } catch(e) {

    const safeError = e.message || String(e);
    Logger.log('getTypeRows error:', e); // 서버 로그에만 상세 기록
    return { ok: false, error: safeError.substring(0, 100) }; // 에러 메시지 길이 제한
  }
}
// ===== Phase 4: B열 캐싱 (CacheService + PropertiesService 하이브리드) =====
function getCachedColumnC(cueId, ss, sh) {
  const cache = CacheService.getScriptCache();
  const today = Utilities.formatDate(new Date(), CFG.KST_TZ, 'yyyyMMdd');
  const cacheKey = `COLUMN_B_${cueId}_${today}`;

  // Step 1: CacheService 확인 (6시간 TTL)
  const cachedFromCache = cache.get(cacheKey);
  if (cachedFromCache) {
    try {
      const parsed = JSON.parse(cachedFromCache);
      Logger.log('✅ [B열 캐시] HIT - CacheService');
      return { ok: true, data: parsed, source: 'cache' };
    } catch(e) {
      Logger.log('⚠️ [B열 캐시] CacheService 파싱 에러');
    }
  }

  // Step 2: PropertiesService 확인 (일일 백업)
  const props = PropertiesService.getScriptProperties();
  const cachedFromProps = props.getProperty(cacheKey);
  if (cachedFromProps) {
    try {
      const parsed = JSON.parse(cachedFromProps);
      Logger.log('✅ [B열 캐시] HIT - PropertiesService (백업)');

      // CacheService에 복원
      cache.put(cacheKey, cachedFromProps, 21600); // 6시간

      return { ok: true, data: parsed, source: 'cache' };
    } catch(e) {
      Logger.log('⚠️ [B열 캐시] PropertiesService 파싱 에러');
    }
  }

  // Step 3: 캐시 미스 - Sheets에서 로드
  Logger.log('❌ [B열 캐시] MISS - Sheets 로딩');
  const last = sh.getLastRow();
  if (last < 2) {
    return { ok: true, data: [], source: 'fresh' };
  }

  const colB = sh.getRange(2, 2, last - 1, 1).getDisplayValues().flat();
  const jsonStr = JSON.stringify(colB);

  // Step 4: CacheService에 저장 (6시간)
  try {
    cache.put(cacheKey, jsonStr, 21600); // 6시간 TTL
    Logger.log(`✅ [B열 캐시] CacheService 저장 완료 (${jsonStr.length} bytes)`);
  } catch(e) {
    Logger.log(`⚠️ [B열 캐시] CacheService 저장 실패: ${e.message}`);
  }

  // Step 5: PropertiesService에 백업 (일일 백업, 100KB 제한)
  if (jsonStr.length < 100000) {
    try {
      props.setProperty(cacheKey, jsonStr);
      Logger.log(`✅ [B열 캐시] PropertiesService 백업 완료 (${jsonStr.length} bytes)`);
    } catch(e) {
      Logger.log(`⚠️ [B열 캐시] PropertiesService 백업 실패: ${e.message}`);
    }
  } else {
    Logger.log(`⚠️ [B열 캐시] 크기 초과 (${jsonStr.length} bytes) - PropertiesService 백업 생략`);
  }

  return { ok: true, data: colB, source: 'fresh' };
}

function getTimeOptions(cueIdOverride, clientTime) {
  try {
    const cueId = String(cueIdOverride || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);

    // Phase 4: B열 캐싱 적용
    const cacheResult = getCachedColumnC(cueId, ss, sh);
    if (!cacheResult.ok) {
      throw new Error('CACHE_ERROR');
    }
    const colB = cacheResult.data;

    // PC 로컬 시간 사용 (클라이언트에서 전달받음)
    const center = clientTime || Utilities.formatDate(new Date(), CFG.KST_TZ, CFG.TIME_DISPLAY);
    const toMin = (s) => {
      const m = String(s || '').match(/^(\d{2}):(\d{2})/);
      return m ? (parseInt(m[1],10)*60 + parseInt(m[2],10)) : null;
    };
    const cmin = toMin(center);
    const list = colB
      .map(v => String(v).trim())
      .filter(v => /^\d{2}:\d{2}/.test(v))
      .filter(v => {
        const m = toMin(v);
        return m !== null && Math.abs(m - cmin) <= 20;
      });
    const uniq = [...new Set(list)];
    uniq.sort((a,b)=>toMin(a)-toMin(b));
    return { ok:true, list:uniq, center, cueId };
  } catch(e) {
    return { ok:false, error:String(e) };
  }
}
// ===== SC 번호 예약 (하이브리드: Properties 카운터 + 주기적 동기화) =====
// Phase 2 최적화: Sheet 객체 재사용 (ss, sh 파라미터 추가)
function reserveSCNumber(cueId, targetRow, ss, sh) {
  const lock = LockService.getScriptLock();

  try {
    // 최대 30초 대기 (동시 요청 시 대기)
    const hasLock = lock.tryLock(30000);
    if (!hasLock) {
      Logger.log('❌ [SC-LOCK] Lock 획득 실패 (30초 타임아웃)');
      throw new Error('SC_NUMBER_LOCK_TIMEOUT');
    }

    Logger.log('🔒 [SC-LOCK] Lock 획득 성공');

    const props = PropertiesService.getScriptProperties();
    const lastSync = parseInt(props.getProperty('SC_LAST_SYNC') || '0', 10);
    const now = new Date().getTime();
    const SYNC_INTERVAL = 2 * 60 * 60 * 1000;  // 2시간 (7200000ms) - Priority 3 최적화

    // ===== 주기적 동기화 (2시간마다 F열 검증) =====
    if (now - lastSync > SYNC_INTERVAL) {
      Logger.log('🔄 [SC-SYNC] 2시간 경과 - F열 동기화 시작');

      // Phase 2: Sheet 객체 재사용 (파라미터로 받은 ss, sh 사용)
      const syncSs = ss || SpreadsheetApp.openById(cueId);
      const syncSh = sh || syncSs.getSheetByName(CFG.CUE_TAB_VIRTUAL);

      if (syncSh) {
        const last = syncSh.getLastRow();

        if (last >= 2) {
          // 마지막 20행만 스캔 (최적화)
          const scanSize = 20;
          const startRow = Math.max(2, last - scanSize + 1);
          const t0 = new Date().getTime();
          const colF = syncSh.getRange(startRow, 6, last - startRow + 1, 1).getValues().flat();
          Logger.log(`⏱️ [SC-SYNC] F열 읽기 (${colF.length}행): ${new Date().getTime() - t0}ms`);

          // SC 번호 추출
          const scNumbers = colF
            .map(v => {
              const str = String(v || '').trim();
              const match = str.match(/^SC(\d{3})_/);
              return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => n > 0);

          const maxFromSheet = scNumbers.length > 0 ? Math.max(...scNumbers) : 0;
          const counterValue = parseInt(props.getProperty('SC_COUNTER') || '0', 10);

          // E3 셀 값 확인 (사용자 수동 수정)
          let e3Value = 0;
          let e3Modified = false;
          try {
            const e3Raw = syncSh.getRange(3, 5, 1, 1).getValue();
            e3Value = parseInt(e3Raw, 10) || 0;

            // E3이 카운터 값과 다르면 사용자가 수정한 것으로 판단
            if (e3Value !== counterValue) {
              e3Modified = true;
              Logger.log(`🔔 [SC-SYNC] E3 셀이 수정됨 감지: ${counterValue} → ${e3Value}`);
            }

            Logger.log(`📊 [SC-SYNC] E3 셀 값: ${e3Value} (수정됨: ${e3Modified})`);
          } catch(e) {
            Logger.log(`⚠️ [SC-SYNC] E3 셀 읽기 실패: ${e.message}`);
          }

          // 동기화 로직: E3 수정 감지 시 E3 값 우선 적용
          let syncedValue;

          if (e3Modified) {
            // 사용자가 E3을 수정한 경우: E3 값 우선 (0 포함)
            syncedValue = e3Value;
            Logger.log(`✅ [SC-SYNC] 사용자 수정 감지 - E3 값 우선 적용: ${syncedValue}`);
          } else {
            // E3이 수정되지 않은 경우: F열 최댓값과 카운터 중 큰 값 사용
            syncedValue = Math.max(maxFromSheet, counterValue);
            Logger.log(`📊 [SC-SYNC] 자동 동기화 - F열/카운터 중 큰 값: ${syncedValue} (F열: ${maxFromSheet}, 카운터: ${counterValue})`);
          }

          if (syncedValue !== counterValue) {
            Logger.log(`⚠️ [SC-SYNC] 카운터 조정: ${counterValue} → ${syncedValue} (F열: ${maxFromSheet}, E3: ${e3Value}, 수정됨: ${e3Modified})`);
          }

          props.setProperty('SC_COUNTER', String(syncedValue));

          // E3 셀도 업데이트 (사용자 수정값 그대로 유지)
          try {
            syncSh.getRange(3, 5, 1, 1).setValue(syncedValue);
            Logger.log(`✅ [SC-SYNC] E3 셀 업데이트: ${syncedValue}`);
          } catch(e) {
            Logger.log(`⚠️ [SC-SYNC] E3 셀 업데이트 실패: ${e.message}`);
          }

          Logger.log(`✅ [SC-SYNC] 동기화 완료: ${syncedValue} (F열: ${maxFromSheet}, 이전 카운터: ${counterValue}, E3: ${e3Value}, 수정됨: ${e3Modified})`);
        }

        props.setProperty('SC_LAST_SYNC', String(now));
      } else {
        Logger.log('⚠️ [SC-SYNC] Virtual 시트 없음 - 동기화 건너뜀');
      }
    }

    // ===== 카운터 증가 (O(1) 성능) =====
    const current = parseInt(props.getProperty('SC_COUNTER') || '0', 10);
    const nextNum = current + 1;
    props.setProperty('SC_COUNTER', String(nextNum));

    Logger.log(`📊 [SC-NEXT] 다음 SC 번호: ${nextNum} (Properties 카운터 기반)`);

    // ===== F열에 예약 마커 작성 + E3 업데이트 (Lock 보호 구간) =====
    if (targetRow >= 2) {
      // Phase 2: Sheet 객체 재사용
      const reserveSh = sh || ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);

      if (reserveSh) {
        const reserveMarker = `SC${String(nextNum).padStart(3, '0')}_RESERVED`;
        reserveSh.getRange(targetRow, 6, 1, 1).setValue(reserveMarker);
        Logger.log(`✅ [SC-RESERVE] F열 예약: 행 ${targetRow} = "${reserveMarker}"`);

        // E3 셀에도 최신 카운터 값 기록
        try {
          reserveSh.getRange(3, 5, 1, 1).setValue(nextNum);
          Logger.log(`✅ [SC-RESERVE] E3 셀 업데이트: ${nextNum}`);
        } catch(e) {
          Logger.log(`⚠️ [SC-RESERVE] E3 셀 업데이트 실패: ${e.message}`);
        }
      }
    } else {
      Logger.log('⚠️ [SC-RESERVE] targetRow 없음 - 예약 생략');
    }

    return nextNum;

  } catch(e) {
    Logger.log('❌ [SC-ERROR] reserveSCNumber error:', e);
    return 1; // 에러 시 기본값 1
  } finally {
    // Lock 해제
    lock.releaseLock();
    Logger.log('🔓 [SC-UNLOCK] Lock 해제');
  }
}
function buildFileName(kind, hhmm, tableNo, playerOrLabel, modeData, scNumber) {
  // 파일명 형식: {HHMM}_SC###_{기존내용}
  // modeData = { chipCount, bb, rank, prize, profileType, count }

  const safe = (s) => {
    const str = String(s || '').trim().substring(0, 100); // 최대 100자
    return str.replace(/[^\w\-#]+/g,'_');
  };

  const timePrefix = String(hhmm || '0000').padStart(4, '0');
  const scPrefix = `SC${String(scNumber || 1).padStart(3, '0')}`;
  const name = safe(playerOrLabel || 'Player');

  // PU 모드: {HHMM}_SC###_이름_PU_칩수_BB
  if (kind === 'PU') {
    const chipCount = modeData?.chipCount || '';
    const bb = modeData?.bb || '';

    if (bb) {
      return `${timePrefix}_${scPrefix}_${name}_PU_${chipCount}_${bb}BB`;
    }
    return `${timePrefix}_${scPrefix}_${name}_PU_${chipCount}`;
  }

  // ELIM 모드: {HHMM}_SC###_이름_ELIM
  if (kind === 'ELIM') {
    return `${timePrefix}_${scPrefix}_${name}_ELIM`;
  }

  // L3 모드: {HHMM}_SC###_이름_L3_Profile
  if (kind === 'L3') {
    const profileType = modeData?.profileType || 'Profile';
    return `${timePrefix}_${scPrefix}_${name}_L3_${profileType}`;
  }

  // BATCH 모드: {HHMM}_SC###_Batch_개수
  if (kind === 'BATCH') {
    const count = modeData?.count || '';
    return `${timePrefix}_${scPrefix}_Batch_${count}`;
  }

  // 기본 (SC)
  return `${timePrefix}_${scPrefix}_${name}_SC`;
}
function updateVirtual(payload) {
  if (!payload || !payload.kind) return { ok:false, error:'BAD_PAYLOAD' };

  // 진행 상태 로그 배열 (프론트엔드 전달용)
  const progressLogs = [];
  const addLog = (step, message, duration) => {
    const log = { step, message, duration };
    progressLogs.push(log);
    Logger.log(`${step} ${message}${duration ? ` (${duration}ms)` : ''}`);
  };

  // ===== 🔒 Lock 획득: Race Condition 방지 =====
  const lock = LockService.getScriptLock();

  try {
    // Lock 대기 (최대 30초)
    const hasLock = lock.tryLock(30000);
    if (!hasLock) {
      Logger.log('❌ [UPDATE-LOCK] Lock 획득 실패 (30초 타임아웃)');
      throw new Error('LOCK_TIMEOUT: 다른 사용자 처리 중입니다. 잠시 후 다시 시도하세요.');
    }

    Logger.log('🔒 [UPDATE-LOCK] Lock 획득 성공 - Race Condition 방지 활성화');

    const startTime = new Date().getTime();
    addLog('⏱️', '[START] 전송 시작', null);

    const cueId = String(payload.cueId || CFG.CUE_SHEET_ID).trim();

    // Step 1: Sheet 연결
    addLog('🔌', '[1/7] Google Sheets 연결 중...', null);
    const t0 = new Date().getTime();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);
    addLog('✅', '연결 완료', new Date().getTime() - t0);

    // Step 2: B열 + C열 실시간 읽기 (캐시 미사용 - Staleness 방지)
    addLog('📊', '[2/7] 시간/테이블 데이터 로드 중... (실시간)', null);
    const t1 = new Date().getTime();
    const last = sh.getLastRow();
    if (last < 2) throw new Error('EMPTY_VIRTUAL');

    // B열 (시간) + C열 (테이블 정보) 동시 로드
    const rangeBC = sh.getRange(2, 2, last - 1, 2).getDisplayValues(); // B:C 열
    const colB = rangeBC.map(r => r[0]); // B열
    const colC = rangeBC.map(r => r[1]); // C열
    Logger.log(`✅ [B/C열 실시간] ${colB.length}개 행 로드 (캐시 미사용 - 항상 최신 데이터)`);
    addLog('✅', `${colB.length}개 행 로드 완료 (실시간)`, new Date().getTime() - t1);

    // Step 3: 시간 + 테이블 매칭 (PC 로컬 시간 사용)
    addLog('🔍', '[3/7] 시간/테이블 매칭 중...', null);
    const t2 = new Date().getTime();
    // payload.hhmm을 HH:mm 형식으로 변환 (예: "1433" → "14:33")
    let pickedStr;
    if (payload.autoNow) {
      const hhmmStr = String(payload.hhmm || '');
      if (hhmmStr.length === 4) {
        pickedStr = `${hhmmStr.substring(0,2)}:${hhmmStr.substring(2,4)}`;
      } else {
        throw new Error('INVALID_HHMM_FORMAT');
      }
    } else {
      pickedStr = (payload.pickedTime || '').trim();
    }
    if (!/^\d{2}:\d{2}$/.test(pickedStr)) throw new Error('TIME_FORMAT');

    // 테이블 번호 추출 (payload에서)
    const tableNo = payload.tableNo ? String(payload.tableNo).trim() : '';

    // 시간 + 테이블 번호로 매칭
    const rowIdx0 = colB.findIndex((time, idx) => {
      const s = String(time).trim();
      let timeMatch = false;
      if (/^\d{2}:\d{2}$/.test(s)) {
        timeMatch = s === pickedStr;
      } else {
        const m = s.match(/^(\d{2}:\d{2}):\d{2}$/);
        timeMatch = m ? (m[1] === pickedStr) : false;
      }

      // 테이블 번호가 있으면 C열도 확인
      if (timeMatch && tableNo) {
        const tableInfo = String(colC[idx] || '').trim();
        const tableMatch = tableInfo.includes(tableNo);
        Logger.log(`🔍 [매칭] 행 ${idx + 2}: 시간="${s}" (${timeMatch ? '✅' : '❌'}), 테이블="${tableInfo}" → "${tableNo}" (${tableMatch ? '✅' : '❌'})`);
        return tableMatch;
      }

      return timeMatch;
    });

    if (rowIdx0 < 0) {
      const errorMsg = tableNo
        ? `NO_MATCH_TIME_TABLE:${pickedStr}_Table${tableNo}`
        : `NO_MATCH_TIME:${pickedStr}`;
      return { ok:false, error: errorMsg, logs: progressLogs };
    }

    const row = 2 + rowIdx0;
    const matchedTable = colC[rowIdx0] || 'N/A';
    const matchMsg = tableNo
      ? `시간 "${pickedStr}" + 테이블 "${matchedTable}" 매칭 완료 (행 ${row})`
      : `시간 "${pickedStr}" 매칭 완료 (행 ${row})`;
    addLog('✅', matchMsg, new Date().getTime() - t2);

    // Step 4: 매칭된 행의 J열만 읽기 (1행 x 1열)
    addLog('📥', '[4/7] J열 데이터 로드 중...', null);
    const t3 = new Date().getTime();
    const jCurrent = sh.getRange(row, 10, 1, 1).getValue();
    addLog('✅', 'J열 로드 완료', new Date().getTime() - t3);

    // 파일명용 시간값 추출
    const matchedTimeStr = String(colB[rowIdx0] || '').trim();
    const hhmmMatch = matchedTimeStr.match(/^(\d{2}):(\d{2})/);
    const hhmmForFile = hhmmMatch ? `${hhmmMatch[1]}${hhmmMatch[2]}` : '0000';

    // Step 5: SC 번호 발급
    addLog('🔢', '[5/7] SC 번호 발급 중...', null);
    const t4 = new Date().getTime();
    const scNumber = reserveSCNumber(cueId, row, ss, sh);
    addLog('✅', `SC${String(scNumber).padStart(3, '0')} 발급 완료`, new Date().getTime() - t4);

    // Step 6: 데이터 준비
    addLog('📝', '[6/7] 전송 데이터 준비 중...', null);
    const t5 = new Date().getTime();
    const fVal = buildFileName(
      payload.kind,
      hhmmForFile,
      payload.tableNo,
      payload.playerName,
      payload.modeData,
      scNumber
    );

    const eVal = payload.eFix || CFG.DEFAULT_STATUS_INCOMPLETE;
    const gVal = payload.gFix || CFG.DEFAULT_CONTENT_TYPE;
    const jBlock = String(payload.jBlock||'').replace(/\r\n/g,'\n');
    if (!fVal) throw new Error('EMPTY_FILENAME');
    if (!jBlock) throw new Error('EMPTY_JBLOCK');

    const jCurrentStr = jCurrent ? String(jCurrent).replace(/\r\n/g,'\n') : '';
    const needsLF = jCurrentStr && !jCurrentStr.endsWith('\n') ? '\n' : '';
    const glue = jCurrentStr ? (needsLF + '\n') : '';
    const jNew = jCurrentStr + glue + jBlock;

    // K열: 소프트 콘텐츠 종류 (PRD 요구사항: 2줄 형식)
    let kVal;
    if (payload.kind === 'PU') {
      kVal = "소프트 콘텐츠\n'플레이어 업데이트'";
    } else if (payload.kind === 'ELIM') {
      kVal = "소프트 콘텐츠\n'플레이어 탈락'";
    } else if (payload.kind === 'L3') {
      kVal = "소프트 콘텐츠\n'플레이어 소개'";
    } else {
      kVal = "소프트 콘텐츠\n'기타'";
    }
    addLog('✅', '데이터 준비 완료', new Date().getTime() - t5);

    // Step 7: Batch 쓰기
    addLog('💾', '[7/7] Google Sheets 업데이트 중...', null);
    const t7 = new Date().getTime();
    const batchData = [
      [eVal, fVal, gVal, '', '', jNew, kVal]
      // E(5), F(6), G(7), H(8), I(9), J(10), K(11)
    ];
    sh.getRange(row, 5, 1, 7).setValues(batchData);
    addLog('✅', '7개 셀 업데이트 완료', new Date().getTime() - t7);

    const totalTime = new Date().getTime() - startTime;
    addLog('🎉', `[완료] 전송 성공 (총 ${(totalTime/1000).toFixed(1)}초)`, totalTime);

    return {
      ok: true,
      row,
      time: pickedStr,
      filename: fVal,
      scNumber,
      logs: progressLogs,
      totalTime
    };
  } catch(e) {
    const safeError = e.message || String(e);
    Logger.log('❌ updateVirtual error:', e);
    addLog('❌', `에러 발생: ${safeError}`, null);
    return {
      ok: false,
      error: safeError.substring(0, 100),
      logs: progressLogs
    };
  } finally {
    // ===== 🔓 Lock 해제 =====
    lock.releaseLock();
    Logger.log('🔓 [UPDATE-UNLOCK] Lock 해제 완료');
  }
}
