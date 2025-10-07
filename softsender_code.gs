
const CFG = {
  CUE_SHEET_ID: PropertiesService.getScriptProperties().getProperty('CUE_SHEET_ID') || '13LpVWYHaJAMtvc1OiCtkrcAYqavkXWaTg3Vke0R0CUQ',
  CUE_TAB_VIRTUAL: 'virtual',
  TYPE_SHEET_ID: PropertiesService.getScriptProperties().getProperty('TYPE_SHEET_ID') || '1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U',
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
function getBootstrap() {
  return {
    cueId: CFG.CUE_SHEET_ID,
    typeId: CFG.TYPE_SHEET_ID,
    tz: CFG.KST_TZ,
  };
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
      nat:    String(r[iNat]||'').trim(),
    })).filter(r => r.room && r.tno && r.seat);
    return { ok:true, headers, rows, typeId };
  } catch(e) {
    const safeError = e.message || String(e);
    Logger.log('getTypeRows error:', e); // 서버 로그에만 상세 기록
    return { ok:false, error: safeError.substring(0, 100) }; // 에러 메시지 길이 제한
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
function buildFileName(kind, hhmm, tableNo, playerOrLabel) {
  const safe = (s) => {
    const str = String(s || '').trim().substring(0, 100); // 최대 100자
    return str.replace(/[^\w\-#]+/g,'_');
  };
  const modes = ['PU','ELIM','L3','LEADERBOARD','BATCH'];
  const mode = modes.includes(kind) ? kind : 'SC';
  const time = String(hhmm || '').padStart(4,'0');
  const name = (kind==='LEADERBOARD') ? safe(playerOrLabel || ('Table'+(tableNo||''))) : safe(playerOrLabel || 'Player');
  return `${time}_${name}_${mode}`;
}
function updateVirtual(payload) {
  if (!payload || !payload.kind) return { ok:false, error:'BAD_PAYLOAD' };
  try {
    const cueId = String(payload.cueId || CFG.CUE_SHEET_ID).trim();
    const ss = SpreadsheetApp.openById(cueId);
    const sh = ss.getSheetByName(CFG.CUE_TAB_VIRTUAL);
    if (!sh) throw new Error(`SHEET_NOT_FOUND:${CFG.CUE_TAB_VIRTUAL}`);
    const last = sh.getLastRow();
    if (last < 2) throw new Error('EMPTY_VIRTUAL');
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
    const eVal = payload.eFix || CFG.DEFAULT_STATUS_INCOMPLETE;
    const gVal = payload.gFix || CFG.DEFAULT_CONTENT_TYPE;
    const fVal = String(payload.filename||'').trim();
    const jBlock = String(payload.jBlock||'').replace(/\r\n/g,'\n');
    if (!fVal) throw new Error('EMPTY_FILENAME');
    if (!jBlock) throw new Error('EMPTY_JBLOCK');
    const jCell = sh.getRange(row, 10); // J
    let cur = jCell.getValue();
    cur = cur ? String(cur).replace(/\r\n/g,'\n') : '';
    const needsLF = cur && !cur.endsWith('\n') ? '\n' : '';
    const glue = cur ? (needsLF + '\n') : '';
    const next = cur + glue + jBlock;
    sh.getRange(row,5).setValue(eVal);  // E
    sh.getRange(row,6).setValue(fVal);  // F
    sh.getRange(row,7).setValue(gVal);  // G
    jCell.setValue(next);               // J
    return { ok:true, row, time:pickedStr };
  } catch(e) {
    const safeError = e.message || String(e);
    Logger.log('updateVirtual error:', e);
    return { ok:false, error: safeError.substring(0, 100) };
  }
}
