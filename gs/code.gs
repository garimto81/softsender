/***********************
 * Soft Content Sender — v9
 * - WSOP+ 2자리 국가 코드 통일
 * - 이름 기반 검색 지원
 * - 복수 작업 및 혼합 모드 지원
 * - 표기: 이름 / 국가코드
 ***********************/
const CFG = {
  CUE_SHEET_ID: '13LpVWYHaJAMtvc1OiCtkrcAYqavkXWaTg3Vke0R0CUQ', // 기본값
  CUE_TAB_VIRTUAL: 'virtual',
  TYPE_SHEET_ID: '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',  // 기본값
  TYPE_TAB: 'Type',
  COUNTRY_MAP_TAB: 'CountryMap', // [Code, Name]

  FIX_E: '미완료',
  FIX_G: 'SOFT',

  KST_TZ: 'Asia/Seoul',
  TIME_DISPLAY: 'HH:mm',
};

function doGet() {
  return HtmlService.createTemplateFromFile('page')
    .evaluate()
    .setTitle('Soft Content Sender v12.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTML에 다른 파일 포함하기 위한 함수
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getBootstrap() {
  return {
    cueId: CFG.CUE_SHEET_ID,
    typeId: CFG.TYPE_SHEET_ID,
    tz: CFG.KST_TZ,
  };
}

/* TYPE 읽기 (override 수용) - 이름 검색 지원 */
function getTypeRows(typeIdOverride) {
  try {
    const typeId = String(typeIdOverride || CFG.TYPE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(typeId);
    const sh = ss.getSheetByName(CFG.TYPE_TAB);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.TYPE_TAB}`);
    const values = sh.getDataRange().getValues();
    if (values.length < 2) return { ok: true, headers: values[0] || [], rows: [], typeId };

    const headers = values[0].map(v => String(v).trim());
    const idx = (name) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const iRoom   = idx('Poker Room');
    const iTName  = idx('Table Name');
    const iTNo    = idx('Table No.');
    const iSeat   = idx('Seat No.');
    const iPlayer = idx('Players');
    const iNat    = idx('Nationality');

    if ([iRoom,iTName,iTNo,iSeat,iPlayer,iNat].some(i=>i<0)) throw new Error('BAD_HEADERS');

    const rows = values.slice(1).map(r => ({
      room:   String(r[iRoom]||'').trim(),
      tname:  String(r[iTName]||'').trim(),
      tno:    String(r[iTNo]||'').trim(),
      seat:   String(r[iSeat]||'').trim(),
      player: String(r[iPlayer]||'').trim(),
      nat:    String(r[iNat]||'').trim().toUpperCase().substring(0, 2), // WSOP+ 2자리
    })).filter(r => r.room && r.tno && (r.seat || r.player)); // seat 또는 player 필수

    return { ok:true, headers, rows, typeId };
  } catch(e) {
    return { ok:false, error:String(e) };
  }
}

/* CountryMap 읽기 - WSOP+ 2자리 코드 강제 */
function getCountryMap(typeIdOverride) {
  try {
    const typeId = String(typeIdOverride || CFG.TYPE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(typeId);
    const sh = ss.getSheetByName(CFG.COUNTRY_MAP_TAB);
    if (!sh) return { ok:true, map:{}, typeId, note:'TAB_NOT_FOUND' };

    const values = sh.getDataRange().getValues();
    if (values.length < 2) return { ok:true, map:{}, typeId, note:'EMPTY' };

    // 기대 헤더: Code, Name (대소문자 무시)
    const headers = values[0].map(v => String(v).trim());
    const colCode = headers.findIndex(h => h.toLowerCase()==='code');
    const colName = headers.findIndex(h => h.toLowerCase()==='name');
    if (colCode<0 || colName<0) return { ok:true, map:{}, typeId, note:'BAD_HEADERS' };

    const map = {};
    values.slice(1).forEach(r=>{
      const code = String(r[colCode]||'').trim().toUpperCase().substring(0, 2); // 2자리 강제
      const name = String(r[colName]||'').trim();
      if (code && name) map[code]=name;
    });
    return { ok:true, map, typeId };
  } catch(e) {
    return { ok:false, error:String(e) };
  }
}

/* 시간 드롭다운(±20분) */
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

/* 파일명: HHmm_<name>_<mode> */
function buildFileName(kind, hhmm, tableNo, playerOrLabel) {
  const safe = (s) => String(s || '').trim().replace(/[^\w\-#]+/g,'_');
  const modes = ['PU','ELIM','L3','LEADERBOARD'];
  const mode = modes.includes(kind) ? kind : 'SC';
  const time = String(hhmm || '').padStart(4,'0');
  const name = (kind==='LEADERBOARD') ? safe(playerOrLabel || ('Table'+(tableNo||''))) : safe(playerOrLabel || 'Player');
  return `${time}_${name}_${mode}`;
}

/* 복수 업데이트 - 여러 플레이어 한 행에 동시 처리 */
function updateVirtualBatch(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { ok:false, error:'BAD_PAYLOAD' };
  }

  try {
    // 첫 번째 아이템에서 공통 정보 추출
    const firstItem = items[0];
    const cueId = String(firstItem.cueId || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);

    const last = sh.getLastRow();
    if (last < 2) throw new Error('EMPTY_VIRTUAL');

    // 시간 매칭
    const colC = sh.getRange(2,3,last-1,1).getDisplayValues().flat();
    const nowKST = new Date();
    const nowHHmm = Utilities.formatDate(nowKST, CFG.KST_TZ, 'HH:mm');
    const pickedStr = (firstItem.autoNow ? nowHHmm : (firstItem.pickedTime||'')).trim();
    if (!/^\d{2}:\d{2}$/.test(pickedStr)) throw new Error('TIME_FORMAT');

    const rowIdx0 = colC.findIndex(v=>{
      const s = String(v).trim();
      if (/^\d{2}:\d{2}$/.test(s)) return s===pickedStr;
      const m = s.match(/^(\d{2}:\d{2}):\d{2}$/);
      return m ? (m[1]===pickedStr) : false;
    });
    if (rowIdx0 < 0) return { ok:false, error:`NO_MATCH_TIME:${pickedStr}` };
    const row = 2 + rowIdx0;

    // 모든 플레이어의 jBlock 합치기
    const allBlocks = items.map(item => String(item.jBlock||'').replace(/\r\n/g,'\n')).filter(b=>b);
    if (allBlocks.length === 0) throw new Error('EMPTY_JBLOCK');

    const combinedBlock = allBlocks.join('\n\n'); // 각 플레이어 사이에 빈 줄 추가

    // 공통 값 (모든 아이템이 같은 filename 사용)
    const eVal = firstItem.eFix || CFG.FIX_E;
    const gVal = firstItem.gFix || CFG.FIX_G;
    const fVal = String(firstItem.filename||'').trim();
    if (!fVal) throw new Error('EMPTY_FILENAME');

    // J 컬럼에 한 번에 추가
    const jCell = sh.getRange(row, 10); // J
    let cur = jCell.getValue();
    cur = cur ? String(cur).replace(/\r\n/g,'\n') : '';
    const needsLF = cur && !cur.endsWith('\n') ? '\n' : '';
    const glue = cur ? (needsLF + '\n') : '';
    const next = cur + glue + combinedBlock;

    // 한 번에 세팅
    sh.getRange(row,5).setValue(eVal);  // E
    sh.getRange(row,6).setValue(fVal);  // F
    sh.getRange(row,7).setValue(gVal);  // G
    jCell.setValue(next);               // J

    return {
      ok: true,
      row,
      time: pickedStr,
      successCount: items.length,
      failCount: 0
    };
  } catch(e) {
    return {
      ok: false,
      error: String(e),
      successCount: 0,
      failCount: items.length
    };
  }
}

/* 단일 업데이트 */
function updateVirtual(payload) {
  if (!payload || !payload.kind) return { ok:false, error:'BAD_PAYLOAD' };

  try {
    const cueId = String(payload.cueId || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);

    const last = sh.getLastRow();
    if (last < 2) throw new Error('EMPTY_VIRTUAL');

    // 행 선택
    const colC = sh.getRange(2,3,last-1,1).getDisplayValues().flat();
    const nowKST = new Date();
    const nowHHmm = Utilities.formatDate(nowKST, CFG.KST_TZ, 'HH:mm');
    const pickedStr = (payload.autoNow ? nowHHmm : (payload.pickedTime||'')).trim();
    if (!/^\d{2}:\d{2}$/.test(pickedStr)) throw new Error('TIME_FORMAT');

    const rowIdx0 = colC.findIndex(v=>{
      const s = String(v).trim();
      if (/^\d{2}:\d{2}$/.test(s)) return s===pickedStr;
      const m = s.match(/^(\d{2}:\d{2}):\d{2}$/);
      return m ? (m[1]===pickedStr) : false;
    });
    if (rowIdx0 < 0) return { ok:false, error:`NO_MATCH_TIME:${pickedStr}` };
    const row = 2 + rowIdx0;

    // 값 준비
    const eVal = payload.eFix || CFG.FIX_E;
    const gVal = payload.gFix || CFG.FIX_G;
    const fVal = String(payload.filename||'').trim();
    const jBlock = String(payload.jBlock||'').replace(/\r\n/g,'\n');
    if (!fVal) throw new Error('EMPTY_FILENAME');
    if (!jBlock) throw new Error('EMPTY_JBLOCK');

    // J append
    const jCell = sh.getRange(row, 10); // J
    let cur = jCell.getValue();
    cur = cur ? String(cur).replace(/\r\n/g,'\n') : '';
    const needsLF = cur && !cur.endsWith('\n') ? '\n' : '';
    const glue = cur ? (needsLF + '\n') : '';
    const next = cur + glue + jBlock;

    // 세팅
    sh.getRange(row,5).setValue(eVal);  // E
    sh.getRange(row,6).setValue(fVal);  // F
    sh.getRange(row,7).setValue(gVal);  // G
    jCell.setValue(next);               // J

    return { ok:true, row, time:pickedStr };
  } catch(e) {
    return { ok:false, error:String(e) };
  }
}
