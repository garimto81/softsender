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
  Logger.log('🧪 [TEST] reserveSCNumber (2단계 패턴) 테스트 시작');
  const cueId = CFG.CUE_SHEET_ID;
  const ss = SpreadsheetApp.openById(cueId);
  const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
  const lastRow = sh.getLastRow();

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

  // 테스트 행 정리
  sh.deleteRows(testRow1, 3);
  Logger.log('🧪 [CLEANUP] 테스트 행 삭제 완료');

  return {
    num1, num2, num3,
    time1: end1-start1, time2: end2-start2, time3: end3-start3,
    isSequential,
    allReserved
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
// ===== Cache 레이어: Type Rows 캐싱 (5분 TTL) =====
function getCachedTypeRows(typeIdOverride) {
  const typeId = String(typeIdOverride || CFG.TYPE_SHEET_ID).trim();
  const cache = CacheService.getScriptCache();
  const key = 'TYPE_ROWS_' + typeId;

  // 캐시 확인
  const cached = cache.get(key);
  if (cached) {
    Logger.log('✅ Cache HIT - Type Rows');
    return JSON.parse(cached);
  }

  // 캐시 미스 - Sheets에서 로드
  Logger.log('❌ Cache MISS - Loading from Sheets');
  const result = getTypeRows(typeIdOverride);

  if (result.ok) {
    // 5분(300초) 캐싱
    cache.put(key, JSON.stringify(result), 300);
  }

  return result;
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
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return { ok: true, headers: values[0] || [], rows: [], typeId };
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

      // 디버깅: 첫 5개 행의 KeyPlayer 값 상세 출력
      if (idx < 5) {
        Logger.log(`🔍 행 ${idx + 2} [${r[iPlayer]}]: K열 원본="${rawValue}" (타입=${typeof rawValue}), 변환="${keyPlayerValue}", 결과=${isKeyPlayer}`);
      }

      return {
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
    }).filter(r => r.room && r.tno && r.seat);

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
function getTimeOptions(cueIdOverride) {
  try {
    const cueId = String(cueIdOverride || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);
    const last = sh.getLastRow();
    if (last < 2) return { ok: true, list: [], cueId };
    const colC = sh.getRange(2, 3, last - 1, 1).getDisplayValues().flat();
    const nowKST = new Date();
    const center = Utilities.formatDate(nowKST, CFG.KST_TZ, CFG.TIME_DISPLAY); // "HH:mm"
    const toMin = (s) => {
      const m = String(s || '').match(/^(\d{2}):(\d{2})/);
      return m ? (parseInt(m[1],10)*60 + parseInt(m[2],10)) : null;
    };
    const cmin = toMin(center);
    const list = colC
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
// ===== SC 번호 예약 (2단계 패턴: Lock 내 예약) =====
function reserveSCNumber(cueId, targetRow) {
  const lock = LockService.getScriptLock();

  try {
    // 최대 30초 대기 (동시 요청 시 대기)
    const hasLock = lock.tryLock(30000);
    if (!hasLock) {
      Logger.log('❌ [SC-LOCK] Lock 획득 실패 (30초 타임아웃)');
      throw new Error('SC_NUMBER_LOCK_TIMEOUT');
    }

    Logger.log('🔒 [SC-LOCK] Lock 획득 성공');

    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);

    if (!sh) {
      Logger.log('⚠️ [SC-ERROR] Virtual 시트 없음 - 기본값 1 반환');
      return 1;
    }

    const last = sh.getLastRow();
    if (last < 2) {
      Logger.log('⚠️ [SC-EMPTY] 빈 시트 - 기본값 1 반환');

      // ===== F열에 예약 마커 작성 =====
      if (targetRow >= 2) {
        sh.getRange(targetRow, 6, 1, 1).setValue('SC001_RESERVED');
        Logger.log(`✅ [SC-RESERVE] F열 예약: 행 ${targetRow} = "SC001_RESERVED"`);
      }

      return 1;
    }

    // F열(파일명) 전체 읽기
    const colF = sh.getRange(2, 6, last - 1, 1).getValues().flat();

    // SC로 시작하는 번호 추출 (RESERVED 포함)
    const scNumbers = colF
      .map(v => {
        const str = String(v || '').trim();
        const match = str.match(/^SC(\d{3})_/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    // 다음 번호 계산
    const nextNum = scNumbers.length > 0 ? Math.max(...scNumbers) + 1 : 1;
    Logger.log(`📊 [SC-NEXT] 다음 SC 번호: ${nextNum}`);

    // ===== F열에 예약 마커 작성 (Lock 보호 구간) =====
    if (targetRow >= 2) {
      const reserveMarker = `SC${String(nextNum).padStart(3, '0')}_RESERVED`;
      sh.getRange(targetRow, 6, 1, 1).setValue(reserveMarker);
      Logger.log(`✅ [SC-RESERVE] F열 예약: 행 ${targetRow} = "${reserveMarker}"`);
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
  try {
    const startTime = new Date().getTime();
    Logger.log('⏱️ [START] updateVirtual 시작');

    const cueId = String(payload.cueId || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);

    const t1 = new Date().getTime();
    const last = sh.getLastRow();
    Logger.log(`⏱️ [1] getLastRow: ${new Date().getTime() - t1}ms`);
    if (last < 2) throw new Error('EMPTY_VIRTUAL');

    const t2 = new Date().getTime();
    const colC = sh.getRange(2,3,last-1,1).getDisplayValues().flat();
    Logger.log(`⏱️ [2] C열 읽기 (${last-1}행): ${new Date().getTime() - t2}ms`);

    const nowKST = new Date();
    const nowHHmm = Utilities.formatDate(nowKST, CFG.KST_TZ, 'HH:mm');
    const pickedStr = (payload.autoNow ? nowHHmm : (payload.pickedTime||'')).trim();
    if (!/^\d{2}:\d{2}$/.test(pickedStr)) throw new Error('TIME_FORMAT');

    const t3 = new Date().getTime();
    const rowIdx0 = colC.findIndex(v=>{
      const s = String(v).trim();
      if (/^\d{2}:\d{2}$/.test(s)) return s===pickedStr;
      const m = s.match(/^(\d{2}:\d{2}):\d{2}$/);
      return m ? (m[1]===pickedStr) : false;
    });
    Logger.log(`⏱️ [3] 시간 매칭: ${new Date().getTime() - t3}ms`);
    if (rowIdx0 < 0) return { ok:false, error:`NO_MATCH_TIME:${pickedStr}` };
    const row = 2 + rowIdx0;

    // ===== 2단계: SC 번호 예약 (Lock 내) =====
    const t4 = new Date().getTime();
    const scNumber = reserveSCNumber(cueId, row);  // Lock 보호 구간 내 F열 예약
    Logger.log(`⏱️ [4] reserveSCNumber: ${new Date().getTime() - t4}ms`);

    // 파일명 자동 생성 (SC### 접두사 포함)
    const fVal = buildFileName(
      payload.kind,
      payload.hhmm,
      payload.tableNo,
      payload.playerName,
      payload.modeData,
      scNumber
    );

    const t5 = new Date().getTime();
    const eVal = payload.eFix || CFG.DEFAULT_STATUS_INCOMPLETE;
    const gVal = payload.gFix || CFG.DEFAULT_CONTENT_TYPE;
    const jBlock = String(payload.jBlock||'').replace(/\r\n/g,'\n');
    if (!fVal) throw new Error('EMPTY_FILENAME');
    if (!jBlock) throw new Error('EMPTY_JBLOCK');
    Logger.log(`⏱️ [5] 파일명/데이터 준비: ${new Date().getTime() - t5}ms`);

    // ===== Batch API 최적화: E/F/G/J/K만 개별 업데이트 (B/C 완전 배제) =====
    // B/C열은 읽지도 쓰지도 않음

    // J열 기존 내용 읽기 (병합용)
    const t6 = new Date().getTime();
    const jCurrent = sh.getRange(row, 10, 1, 1).getValue();
    Logger.log(`⏱️ [6] J열 읽기: ${new Date().getTime() - t6}ms`);

    const jCurrentStr = jCurrent ? String(jCurrent).replace(/\r\n/g,'\n') : '';
    const needsLF = jCurrentStr && !jCurrentStr.endsWith('\n') ? '\n' : '';
    const glue = jCurrentStr ? (needsLF + '\n') : '';
    const jNew = jCurrentStr + glue + jBlock;

    // K열 값 결정 (모드에 따라 분기)
    let kVal = '소프트 콘텐츠'; // 기본값
    if (payload.kind === 'PU') {
      kVal = "소프트 콘텐츠\n'플레이어 업데이트'";
    } else if (payload.kind === 'L3') {
      kVal = "소프트 콘텐츠\n'플레이어 소개'";
    }

    // E/F/G/J/K 개별 업데이트 (B/C는 건드리지 않음)
    const t7 = new Date().getTime();
    sh.getRange(row, 5, 1, 1).setValue(eVal);   // E열
    Logger.log(`⏱️ [7-1] E열 쓰기: ${new Date().getTime() - t7}ms`);

    // ===== 2단계: 최종 파일명 덮어쓰기 (RESERVED 마커 교체) =====
    const t8 = new Date().getTime();
    sh.getRange(row, 6, 1, 1).setValue(fVal);   // F열: 예약 마커 → 최종 파일명
    Logger.log(`⏱️ [7-2] F열 최종 쓰기: ${new Date().getTime() - t8}ms`);

    const t9 = new Date().getTime();
    sh.getRange(row, 7, 1, 1).setValue(gVal);   // G열
    Logger.log(`⏱️ [7-3] G열 쓰기: ${new Date().getTime() - t9}ms`);

    const t10 = new Date().getTime();
    sh.getRange(row, 10, 1, 1).setValue(jNew);  // J열
    Logger.log(`⏱️ [7-4] J열 쓰기: ${new Date().getTime() - t10}ms`);

    const t11 = new Date().getTime();
    sh.getRange(row, 11, 1, 1).setValue(kVal);  // K열
    Logger.log(`⏱️ [7-5] K열 쓰기: ${new Date().getTime() - t11}ms`);

    const totalTime = new Date().getTime() - startTime;
    Logger.log(`⏱️ [END] updateVirtual 완료 - 총 소요시간: ${totalTime}ms`);

    return { ok:true, row, time:pickedStr, filename: fVal, scNumber };
  } catch(e) {

    const safeError = e.message || String(e);
    Logger.log('updateVirtual error:', e);
    return { ok:false, error: safeError.substring(0, 100) };
  }
}
