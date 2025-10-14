function toast(msg, ok=true){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='show'+(ok?'':' err');
  setTimeout(()=>t.className='', CONSTANTS.TOAST_DURATION);
}
function setStatus(s){ document.getElementById('status').textContent=s; }

/* ===== Sheet ID 저장/초기화 ===== */
function loadIdsFromLocal(){
  const cue = localStorage.getItem(LS_KEYS.CUE) || '';
  const type= localStorage.getItem(LS_KEYS.TYPE) || '';
  if (cue) document.getElementById('cueId').value = cue;
  if (type) document.getElementById('typeId').value = type;
  state.cueId = cue;
  state.typeId= type;
  renderIdsHint();
}
function saveIds(){
  const cue = document.getElementById('cueId').value.trim();
  const type= document.getElementById('typeId').value.trim();
  if (cue) localStorage.setItem(LS_KEYS.CUE, cue); else localStorage.removeItem(LS_KEYS.CUE);
  if (type) localStorage.setItem(LS_KEYS.TYPE, type); else localStorage.removeItem(LS_KEYS.TYPE);
  state.cueId = cue; state.typeId = type;
  renderIdsHint();
  toast('ID 저장 완료');
  reloadSheets();
}

// 자동 저장 함수 (입력 필드 변경 시)
function autoSaveIds(){
  const cue = document.getElementById('cueId').value.trim();
  const type= document.getElementById('typeId').value.trim();

  // 입력값이 있으면 localStorage에 저장
  if (cue) localStorage.setItem(LS_KEYS.CUE, cue); else localStorage.removeItem(LS_KEYS.CUE);
  if (type) localStorage.setItem(LS_KEYS.TYPE, type); else localStorage.removeItem(LS_KEYS.TYPE);

  state.cueId = cue;
  state.typeId = type;
  renderIdsHint();
}
function clearIds(){
  localStorage.removeItem(LS_KEYS.CUE);
  localStorage.removeItem(LS_KEYS.TYPE);
  state.cueId=''; state.typeId='';
  document.getElementById('cueId').value='';
  document.getElementById('typeId').value='';
  renderIdsHint();
  toast('ID 초기화 완료(기본값 사용)');
  reloadSheets();
}
function renderIdsHint(){
  const c = state.cueId ? `CUE=${state.cueId}` : 'CUE=기본값';
  const t = state.typeId? `TYPE=${state.typeId}`: 'TYPE=기본값';
  document.getElementById('idsHint').textContent = `현재 사용 중: ${c} | ${t}`;
}

/* 인덱싱 */
function indexTypeRows(rows){
  state.byRoom={}; state.byRoomTable={}; state.tableList=[];
  rows.forEach(r=>{
    (state.byRoom[r.room] ||= []).push(r);
    const key = r.room + '|' + r.tno;
    (state.byRoomTable[key] ||= []).push(r);
  });

  // Room+Table 통합 목록 생성
  Object.keys(state.byRoomTable).forEach(key => {
    const [room, tno] = key.split('|');
    const tname = state.byRoomTable[key][0]?.tname || '';
    state.tableList.push({
      key,
      label: tname ? `${room} - ${tname} (Table ${tno})` : `${room} - Table ${tno}`,
      room,
      tno
    });
  });

  // 정렬: Room → Table No.
  state.tableList.sort((a,b) => {
    if (a.room !== b.room) return a.room.localeCompare(b.room);
    return Number(a.tno) - Number(b.tno);
  });
}
function normSeat(s){
  const t = String(s||'').trim();
  if(!t) return '';
  const n = t.replace(/\s/g,'').replace(/^#?/,'');
  return '#'+n;
}

/* 플레이어 조회 헬퍼 함수 */
function findPlayerBySeat(key, seat) {
  if (!key || !seat) return null;
  const arr = state.byRoomTable[key] || [];
  return arr.find(r => normSeat(r.seat) === normSeat(seat));
}

/* ===== UI 채우기 ===== */
function fillRoomTables(){
  const sel = document.getElementById('selRoomTable');
  sel.innerHTML = '<option value="">-</option>';

  const fragment = document.createDocumentFragment();
  state.tableList.forEach(t => {
    const o = document.createElement('option');
    o.value = t.key;
    o.textContent = t.label;
    fragment.appendChild(o);
  });
  sel.appendChild(fragment);

  if (sel.options.length > 1) sel.selectedIndex = CONSTANTS.DEFAULT_SEAT_INDEX;
  fillSeats();
}

function fillSeats(){
  const key = document.getElementById('selRoomTable').value;
  const selSeat = document.getElementById('selSeat');
  const prevSeat = selSeat.value;

  selSeat.innerHTML = '<option value="">좌석 선택</option>';

  if (!key) return;

  const arr = state.byRoomTable[key] || [];

  // Seat 드롭다운: "#1 - John Doe ⭐" 형식 (KeyPlayer 표시)
  const seats = [...new Set(arr.map(r => normSeat(r.seat)))]
    .sort((a,b) => Number(a.replace('#','')) - Number(b.replace('#','')));

  const fragment = document.createDocumentFragment();
  seats.forEach(s => {
    const player = findPlayerBySeat(key, s);
    const o = document.createElement('option');
    o.value = s;

    // 디버깅: KeyPlayer 필드 확인
    if (player) {
      console.log(`🎯 좌석 ${s}:`, {
        player: player.player,
        keyPlayer: player.keyPlayer,
        rawData: player
      });
    }

    // KeyPlayer인 경우 ⭐ 표시 추가
    const keyPlayerIcon = player?.keyPlayer ? ' ⭐' : '';
    o.textContent = `${s} - ${player?.player || ''}${keyPlayerIcon}`;

    fragment.appendChild(o);
  });
  selSeat.appendChild(fragment);

  const idx = seats.indexOf(prevSeat);
  selSeat.selectedIndex = idx >= 0 ? idx + CONSTANTS.DEFAULT_SEAT_INDEX : (seats.length > 0 ? CONSTANTS.DEFAULT_SEAT_INDEX : 0);

  applyPickFromSeat();
  if(state.mode===CONSTANTS.MODES.LEADERBOARD) buildLeaderboardList();
  rebuildFileName();
}

function applyPickFromSeat(){
  const key = document.getElementById('selRoomTable').value;
  const seat = document.getElementById('selSeat').value;
  const pick = findPlayerBySeat(key, seat);

  if (pick){
    document.getElementById('countryCode').value = pick.nat || '';
  }
  rebuildPreview();
  rebuildFileName();
}

/* 시간 옵션 */
function fillTimes(list, center){
  const sel = document.getElementById('selTime');
  sel.innerHTML = '<option value="">(미선택: 현재시각)</option>';

  const fragment = document.createDocumentFragment();
  list.forEach(v=>{
    const o=document.createElement('option');
    o.value=v; o.textContent = (v===center)? `${v}  ← 현재` : v;
    fragment.appendChild(o);
  });
  sel.appendChild(fragment);
}

/* 파일명 */
function hhmmFromTimeStr(t){ return (t||'').replace(':',''); }
function rebuildFileName(){
  const mode   = state.mode;
  const key    = document.getElementById('selRoomTable').value;
  const tno    = key ? key.split('|')[1] : '';
  const picked = document.getElementById('selTime').value;
  const hhmm   = hhmmFromTimeStr( picked || (state.timeCenter||'').slice(0,5) );

  let nameForMode;
  let modeData = {};

  if (mode === CONSTANTS.MODES.LEADERBOARD) {
    nameForMode = document.getElementById('lbTableLabel').value || ('Table'+tno);
  } else {
    const player = getSelectedPlayer();
    nameForMode = player ? player.player : 'Player';

    // PU 모드: 칩수 + BB
    if (mode === CONSTANTS.MODES.PU) {
      const chipCount = parseIntClean(document.getElementById('stackAmt').value);
      const bb = document.getElementById('stackBB').value;
      modeData = { chipCount, bb };
    }

    // ELIM 모드: 순위 + 상금
    if (mode === CONSTANTS.MODES.ELIM) {
      const hasPrize = document.querySelector('input[name="elimPrize"]:checked')?.value === 'yes';
      const rank = document.getElementById('elimRank')?.value || '';
      const prize = hasPrize ? parseIntClean(document.getElementById('elimAmount')?.value) : '';
      modeData = { rank, prize };
    }

    // L3 모드: 프로필
    if (mode === CONSTANTS.MODES.L3) {
      modeData = { profileType: 'Profile' };
    }
  }

  // BATCH 모드: 개수
  if (state.batch.length > 0) {
    modeData.count = state.batch.length;
  }

  google.script.run.withSuccessHandler(name=>{
    document.getElementById('fileName').value = name;
  }).buildFileName(mode, hhmm, tno, nameForMode, modeData);
}

/* 숫자 유틸 */
function parseIntClean(s){ const n = Number(String(s||'').replace(/[^0-9]/g,'')); return isNaN(n)?0:Math.round(n); }
function comma(n){ return Number(n||0).toLocaleString('en-US'); }

/* 디바운싱 유틸 */
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

/* 입력창 실시간 콤마 포맷 */
function formatInputWithComma(el){
  const v = parseIntClean(el.value);
  el.value = v ? comma(v) : '';
}

/* PU: BB(반올림) */
function computeBB(){
  const amt = parseIntClean(document.getElementById('stackAmt').value);
  const bb  = parseIntClean(document.getElementById('bigBlind').value);
  const res = (amt>0 && bb>0) ? Math.round(amt / bb) : '';
  document.getElementById('stackBB').value = res || '';
  document.getElementById('stackBBView').value = res ? `${res}BB` : '';
}

/* LEADERBOARD */
let lbListListenerAttached = false;
let lbTableLabelListenerAttached = false;

function buildLeaderboardList(){
  const key = document.getElementById('selRoomTable').value;
  if (!key) return;

  const arr = (state.byRoomTable[key]||[]).slice()
                .sort((a,b)=>Number(a.seat.replace('#',''))-Number(b.seat.replace('#','')));
  const list = document.getElementById('lbList');
  list.innerHTML = '';

  arr.forEach((r,i)=>{
    const row = document.createElement('div'); row.className='lb-row';
    row.innerHTML = `
      <input class="lbName" value="${(r.player||'')}" />
      <input class="lbAmt"  placeholder="칩스택(예: 4,190,000)" inputmode="numeric" />
    `;
    list.appendChild(row);
  });

  // 이벤트 위임으로 한 번만 등록
  if (!lbListListenerAttached) {
    list.addEventListener('input', (e) => {
      if (e.target.classList.contains('lbAmt')) {
        formatInputWithComma(e.target);
        rebuildPreview();
      } else if (e.target.classList.contains('lbName')) {
        rebuildPreview();
      }
    });
    lbListListenerAttached = true;
  }

  const tno = key.split('|')[1];
  const tlabel = document.getElementById('lbTableLabel');
  if(!tlabel.value) tlabel.value = 'Table'+tno;

  if (!lbTableLabelListenerAttached) {
    tlabel.addEventListener('input', rebuildFileName);
    lbTableLabelListenerAttached = true;
  }

  rebuildPreview();
  rebuildFileName();
}

function nameToInitialLastUpper(full){
  const parts = String(full||'').trim().split(/\s+/);
  if(parts.length===0 || !parts[0]) return '';
  const initial = (parts[0][0]||'').toUpperCase()+'.';
  const last = parts.slice(1).join(' ').toUpperCase();
  return last ? `${initial} ${last}` : initial;
}

// 숫자 → K/M 표기(블라인드 라벨용)
function formatKM(nStr){
  const n = parseIntClean(nStr);
  const [divisor, suffix] = n >= 1_000_000 ? [1_000_000, 'M'] : [1_000, 'K'];

  const formatted = (n / divisor).toFixed(2)
    .replace(/\.0+$/,'')
    .replace(/(\.\d)0$/,'$1');

  return `${formatted}${suffix}`;
}

/* 선택된 플레이어 정보 가져오기 */
function getSelectedPlayer(){
  const key = document.getElementById('selRoomTable').value;
  const seat = document.getElementById('selSeat').value;
  return findPlayerBySeat(key, seat);
}

/* ===== 데이터 재로드 ===== */
function reloadSheets(){
  setStatus('시트 정보 로딩…');
  google.script.run.withSuccessHandler(res=>{
    if(res?.ok){ state.timeCenter = res.center || ''; fillTimes(res.list||[], res.center||''); rebuildFileName(); }
    else toast('시간 목록 로딩 실패: '+(res?.error||'unknown'), false);
    setStatus('준비됨');
  }).getTimeOptions(state.cueId || null);

  google.script.run.withSuccessHandler(res=>{
    if(res?.ok){
      state.typeRows = res.rows||[];

      // 디버깅: KeyPlayer 데이터 확인
      console.log('📊 Type 탭 데이터 로드 완료:', res.rows?.length, '행');
      const keyPlayers = res.rows?.filter(r => r.keyPlayer) || [];
      console.log('⭐ 키 플레이어 발견:', keyPlayers.length, '명');
      keyPlayers.forEach(p => {
        console.log(`  - ${p.seat} ${p.player} (${p.room} Table ${p.tno})`);
      });

      indexTypeRows(state.typeRows);
      fillRoomTables();
    }
    else toast('Type 탭 로딩 실패: '+(res?.error||'unknown'), false);
  }).getTypeRows(state.typeId || null);
}
