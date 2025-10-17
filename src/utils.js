function toast(msg, ok=true){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='show'+(ok?'':' err');
  setTimeout(()=>t.className='', CONSTANTS.TOAST_DURATION);
}
function setStatus(s){ document.getElementById('status').textContent=s; }

/* ===== 로딩 오버레이 관리 ===== */
function showLoading(message, details){
  const overlay = document.getElementById('loadingOverlay');
  const msgEl = document.getElementById('loadingMessage');
  const detailsEl = document.getElementById('loadingDetails');

  msgEl.textContent = message || '로딩 중...';
  detailsEl.textContent = details || '';
  overlay.style.display = 'flex';
}

function updateLoading(message, details){
  const msgEl = document.getElementById('loadingMessage');
  const detailsEl = document.getElementById('loadingDetails');

  if (message) msgEl.textContent = message;
  if (details) detailsEl.textContent = details;
}

function hideLoading(){
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'none';
}

/* ===== Sheet ID 저장/초기화 (Properties Service 사용) ===== */
function loadIdsFromLocal(){
  // 서버에서 사용자별 저장된 ID 로드 (localStorage는 백업용)
  const localCue = localStorage.getItem(LS_KEYS.CUE) || '';
  const localType = localStorage.getItem(LS_KEYS.TYPE) || '';

  // 임시로 로컬 값 표시 (서버 응답 전)
  if (localCue) document.getElementById('cueId').value = localCue;
  if (localType) document.getElementById('typeId').value = localType;
  state.cueId = localCue;
  state.typeId = localType;
  renderIdsHint();
}

function saveIds(){
  const cue = document.getElementById('cueId').value.trim();
  const type = document.getElementById('typeId').value.trim();

  // 로딩 시작
  if (!LoadingManager.start('SAVE_IDS', 'Sheet ID 저장 중...', '서버에 영구 저장합니다...')) {
    return;
  }

  // 서버에 저장 (영구 저장)
  google.script.run
    .withSuccessHandler(res => {
      if (res?.ok) {
        // localStorage에도 백업 저장
        if (cue) localStorage.setItem(LS_KEYS.CUE, cue); else localStorage.removeItem(LS_KEYS.CUE);
        if (type) localStorage.setItem(LS_KEYS.TYPE, type); else localStorage.removeItem(LS_KEYS.TYPE);

        state.cueId = cue;
        state.typeId = type;
        renderIdsHint();
        LoadingManager.success('✅ ID 저장 완료 (서버에 영구 저장됨)');

        // 저장 후 시트 재로드
        setTimeout(() => reloadSheets(), 500);
      } else {
        LoadingManager.error('저장 실패: ' + (res?.error || 'unknown'));
      }
    })
    .withFailureHandler(err => {
      LoadingManager.error('서버 오류: ' + (err?.message || err));
    })
    .saveUserPreference(cue, type);
}

// 자동 저장 함수 (입력 필드 변경 시)
function autoSaveIds(){
  const cue = document.getElementById('cueId').value.trim();
  const type = document.getElementById('typeId').value.trim();

  // localStorage에 임시 저장
  if (cue) localStorage.setItem(LS_KEYS.CUE, cue); else localStorage.removeItem(LS_KEYS.CUE);
  if (type) localStorage.setItem(LS_KEYS.TYPE, type); else localStorage.removeItem(LS_KEYS.TYPE);

  state.cueId = cue;
  state.typeId = type;
  renderIdsHint();

  // 서버에도 자동 저장 (비동기)
  google.script.run
    .withSuccessHandler(() => {
      // 조용히 성공 (토스트 메시지 없음)
    })
    .saveUserPreference(cue, type);
}

function clearIds(){
  // 로딩 시작
  if (!LoadingManager.start('CLEAR_IDS', 'Sheet ID 초기화 중...', '기본값으로 되돌립니다...')) {
    return;
  }

  // 서버에서 삭제
  google.script.run
    .withSuccessHandler(res => {
      if (res?.ok) {
        // localStorage도 초기화
        localStorage.removeItem(LS_KEYS.CUE);
        localStorage.removeItem(LS_KEYS.TYPE);

        state.cueId = '';
        state.typeId = '';
        document.getElementById('cueId').value = '';
        document.getElementById('typeId').value = '';
        renderIdsHint();
        LoadingManager.success('✅ ID 초기화 완료 (기본값 사용)');

        // 초기화 후 시트 재로드
        setTimeout(() => reloadSheets(), 500);
      } else {
        LoadingManager.error('초기화 실패: ' + (res?.error || 'unknown'));
      }
    })
    .withFailureHandler(err => {
      LoadingManager.error('서버 오류: ' + (err?.message || err));
    })
    .clearUserPreference();
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
  // "seat 8", "Seat8", "#8", "08" 등 모두 처리
  const n = t.replace(/\s/g,'').replace(/^#?/,'').replace(/^seat/i, '').replace(/^0+/, '');
  return n ? '#'+n : '';
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

  // 키 플레이어 정보를 포함한 테이블 리스트 생성
  const tablesWithKeyPlayerInfo = state.tableList.map(t => {
    const playersAtTable = state.byRoomTable[t.key] || [];
    const hasKeyPlayer = playersAtTable.some(p => p.keyPlayer);
    return {
      ...t,
      hasKeyPlayer,
      keyPlayerIcon: hasKeyPlayer ? ' ⭐' : ''
    };
  });

  // 키 플레이어가 있는 테이블을 최상단에 배치
  const sortedTables = tablesWithKeyPlayerInfo.sort((a, b) => {
    if (a.hasKeyPlayer && !b.hasKeyPlayer) return -1;
    if (!a.hasKeyPlayer && b.hasKeyPlayer) return 1;
    return 0; // 같은 그룹 내에서는 원래 순서 유지
  });

  const fragment = document.createDocumentFragment();
  sortedTables.forEach(t => {
    const o = document.createElement('option');
    o.value = t.key;
    o.textContent = t.label + t.keyPlayerIcon;
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
  console.log(`📋 [fillSeats] 테이블 ${key}: 전체 ${arr.length}명`);
  console.log(`📋 원본 좌석:`, arr.map(r => r.seat));

  const seats = [...new Set(arr.map(r => normSeat(r.seat)))]
    .filter(s => s) // 빈 값 제거
    .sort((a,b) => Number(a.replace('#','')) - Number(b.replace('#','')));

  console.log(`📋 정규화된 좌석 (${seats.length}개):`, seats);

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

    // ELIM 모드: 빈 객체 (필드 없음)
    if (mode === CONSTANTS.MODES.ELIM) {
      modeData = {};
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

/* 선택된 플레이어 정보 가져오기 */
function getSelectedPlayer(){
  const key = document.getElementById('selRoomTable').value;
  const seat = document.getElementById('selSeat').value;
  return findPlayerBySeat(key, seat);
}

/* ===== 데이터 재로드 (Stale-While-Revalidate) ===== */
function reloadSheets(){
  // Step 1: 메모리 캐시가 있으면 즉시 표시 (100ms)
  if (state.typeRows && state.typeRows.length > 0) {
    console.log('🚀 [SWR] 메모리 캐시 즉시 표시:', state.typeRows.length, '행');
    indexTypeRows(state.typeRows);
    fillRoomTables();
    setStatus('준비됨 (백그라운드 갱신 중...)');

    // 캐시된 데이터가 있으면 로딩 오버레이 숨김
    hideLoading();
  } else {
    // 캐시 없으면 로딩 표시
    setStatus('시트 정보 로딩…');
    updateLoading('⏰ 시간 옵션 로드 중...', 'CUE Sheet에서 시간 목록 불러오는 중...');
  }

  // PC 로컬 시간 생성 (HH:mm 형식)
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clientTime = `${hours}:${minutes}`;

  // Step 2: 백그라운드에서 최신 데이터 로드 (시간 옵션)
  google.script.run.withSuccessHandler(res=>{
    if(res?.ok){
      state.timeCenter = res.center || '';
      fillTimes(res.list||[], res.center||'');
      rebuildFileName();

      if (!state.typeRows || state.typeRows.length === 0) {
        updateLoading('✅ 시간 옵션 완료', `${res.list?.length || 0}개 시간 옵션 로드됨`);
      }
    }
    else {
      toast('시간 목록 로딩 실패: '+(res?.error||'unknown'), false);
    }
  }).getTimeOptions(state.cueId || null, clientTime);

  if (!state.typeRows || state.typeRows.length === 0) {
    updateLoading('👥 플레이어 정보 로드 중...', 'TYPE Sheet에서 플레이어 데이터 불러오는 중...');
  }

  // Step 3: 백그라운드에서 최신 데이터 로드 (플레이어 정보 + 버전 체크)
  const previousCount = state.typeRows?.length || 0;
  const hadCache = state.typeRows && state.typeRows.length > 0;

  google.script.run.withSuccessHandler(res=>{
    if(res?.ok){
      const newCount = res.rows?.length || 0;

      state.typeRows = res.rows||[];

      // 디버깅: KeyPlayer 데이터 확인
      console.log('📊 Type 탭 데이터 로드 완료:', res.rows?.length, '행');
      const keyPlayers = res.rows?.filter(r => r.keyPlayer) || [];
      console.log('⭐ 키 플레이어 발견:', keyPlayers.length, '명');
      keyPlayers.forEach(p => {
        console.log(`  - ${p.seat} ${p.player} (${p.room} Table ${p.tno})`);
      });

      // UI 업데이트
      indexTypeRows(state.typeRows);
      fillRoomTables();

      // 데이터 변경 감지
      if (hadCache && newCount !== previousCount) {
        console.log(`🔄 [SWR] 데이터 변경 감지: ${previousCount}행 → ${newCount}행`);
        toast(`📊 플레이어 정보 업데이트됨 (${newCount}명, ⭐ ${keyPlayers.length}명)`, true);
      } else if (hadCache) {
        console.log(`✅ [SWR] 데이터 변경 없음 (${newCount}행)`);
      }

      setStatus('준비됨');
    }
    else {
      toast('Type 탭 로딩 실패: '+(res?.error||'unknown'), false);
      setStatus('에러');
    }

    // 모든 로딩 완료
    if (!hadCache || !state.typeRows || state.typeRows.length === 0) {
      setTimeout(() => {
        hideLoading();
      }, 500);
    }
  }).getCachedTypeRows(state.typeId || null);  // ✅ 버전 체크 + 30분 캐싱
}
