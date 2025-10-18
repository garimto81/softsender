/* ===== 배치 빌더 (스마트 통합) ===== */

// 스마트 전송 버튼 업데이트
function updateSendButton() {
  const btnSend = document.getElementById('btnSend');
  const btnAddToBatch = document.getElementById('btnAddToBatch');
  const batchSection = document.getElementById('batchSection');

  if (state.batch.length > 0) {
    // 배치 모드
    btnSend.innerHTML = `📤 배치 전송 (${state.batch.length}건)`;
    batchSection.style.display = 'block';
  } else {
    // 단일 모드
    btnSend.innerHTML = '전송';
    batchSection.style.display = 'none';
  }

  // 배치 추가 버튼 항상 표시
  btnAddToBatch.style.display = 'block';
}

// 배치에 추가
function addToBatch() {
  const preview = document.getElementById('preview').value.trim();

  if (!preview) {
    toast('미리보기가 비어있습니다. 먼저 플레이어를 선택하고 정보를 입력하세요.', false);
    return;
  }

  const player = getSelectedPlayer();
  const mode = state.mode;

  state.batch.push({
    mode,
    player: player?.player || 'Unknown',
    seat: player?.seat || '',
    nat: player?.nat || '',
    keyPlayer: player?.keyPlayer || false,
    content: preview
  });

  renderBatchList();
  updateBatchPreview();
  updateSendButton();
  toast(`✅ 배치에 추가됨 (${state.batch.length}건)`, true);

  moveToNextSeat();
}

// 배치 리스트 렌더링
function renderBatchList() {
  const list = document.getElementById('batchList');

  if (state.batch.length === 0) {
    list.innerHTML = '';
    document.getElementById('batchCount').textContent = '0';
    return;
  }

  list.innerHTML = '';

  state.batch.forEach((item, idx) => {
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--panel); padding:14px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; min-height:44px;';

    const keyPlayerIcon = item.keyPlayer ? ' ⭐' : '';

    div.innerHTML = `
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:0.95em;">
          ${idx + 1}. ${item.seat} ${item.player}${keyPlayerIcon}
          <span style="color:var(--accent); margin-left:8px; font-size:0.85em;">[${item.mode}]</span>
        </div>
        <div class="muted" style="font-size:0.8em; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${item.content.replace(/\n/g, ' · ').substring(0, 60)}...
        </div>
      </div>
      <button class="btn ghost" data-idx="${idx}" style="padding:10px 16px; height:auto; font-size:0.85em; margin-left:10px; flex-shrink:0;">
        삭제
      </button>
    `;

    div.querySelector('button').addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      state.batch.splice(idx, 1);
      renderBatchList();
      updateBatchPreview();
      updateSendButton();
      toast('항목 삭제됨', true);
    });

    list.appendChild(div);
  });

  document.getElementById('batchCount').textContent = state.batch.length;
}

// 다음 좌석으로 자동 이동
function moveToNextSeat() {
  const key = document.getElementById('selRoomTable').value;
  const seat = document.getElementById('selSeat').value;
  const arr = state.byRoomTable[key] || [];

  const seats = [...new Set(arr.map(r => normSeat(r.seat)))]
    .sort((a,b) => Number(a.replace('#','')) - Number(b.replace('#','')));

  const currentIndex = seats.indexOf(seat);

  if (currentIndex >= 0 && currentIndex < seats.length - 1) {
    const nextSeat = seats[currentIndex + 1];
    document.getElementById('selSeat').value = nextSeat;
    applyPickFromSeat();
    rebuildPreview();
    rebuildFileName();
  } else {
    if (seats.length > 0) {
      document.getElementById('selSeat').value = seats[0];
      applyPickFromSeat();
      rebuildPreview();
      rebuildFileName();
    }
  }
}

// 배치 전송
function sendBatch() {
  if (state.batch.length === 0) {
    toast('배치가 비어있습니다.', false);
    return;
  }

  const jBlock = state.batch.map(item => item.content).join('\n\n');

  const autoNow = document.getElementById('chkAuto').checked;
  const picked = document.getElementById('selTime').value;

  // PC 로컬 시간 사용 (autoNow일 때)
  let timeStr, hhmm;
  if (autoNow) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
    hhmm = `${hours}${minutes}`;
  } else {
    timeStr = picked;
    hhmm = hhmmFromTimeStr(timeStr);
  }

  const key = document.getElementById('selRoomTable').value;
  const tno = key ? key.split('|')[1] : '';

  // 배치 파일명 생성 데이터
  const modeData = { count: state.batch.length };

  const payload = {
    autoNow,
    pickedTime: picked,
    tz: state.tz,
    kind: 'BATCH',
    eFix: '수정 중',
    gFix: 'SOFT',
    playerName: 'Batch',
    tableNo: tno,
    hhmm,
    modeData,
    jBlock,
    cueId: state.cueId || undefined
  };

  // 로딩 시작
  if (!LoadingManager.start('SEND_BATCH', '배치 전송 중...', `${state.batch.length}건 데이터를 전송합니다...`)) {
    return;
  }

  google.script.run
    .withSuccessHandler(res => {
      if (!res?.ok) {
        LoadingManager.error('전송 실패: ' + (res?.error || 'unknown'));
        return;
      }

      LoadingManager.success(`✅ ${res.filename} - 행 ${res.row}(${res.time}) 저장 완료 (${state.batch.length}건, SC${String(res.scNumber).padStart(3, '0')})`);

      state.batch = [];
      renderBatchList();
      updateBatchPreview();
      updateSendButton();
    })
    .withFailureHandler(err => {
      LoadingManager.error('서버 오류: ' + (err?.message || err));
    })
    .updateVirtual(payload);
}

/* 스마트 전송 (단일/배치 자동 감지) */
function send(){
  // 배치 모드인지 확인
  if (state.batch.length > 0) {
    sendBatch();
    return;
  }

  // 단일 전송
  sendSingle();
}

// 단일 전송
function sendSingle() {
  const autoNow = document.getElementById('chkAuto').checked;
  const picked  = document.getElementById('selTime').value;
  const jBlock  = generateCurrentPreview(); // 배치 미리보기 제외

  if(!jBlock){ toast('미리보기 내용이 비었습니다.', false); return; }
  if(state.mode===CONSTANTS.MODES.PU){
    if(!parseIntClean(document.getElementById('stackAmt').value) || !parseIntClean(document.getElementById('bigBlind').value)){
      toast('칩스택/빅블을 입력하세요.', false); return;
    }
  }

  // 파일명 생성에 필요한 데이터 수집
  const player = getSelectedPlayer();
  const key = document.getElementById('selRoomTable').value;
  const tno = key ? key.split('|')[1] : '';

  // PC 로컬 시간 사용 (autoNow일 때)
  let timeStr, hhmm;
  if (autoNow) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
    hhmm = `${hours}${minutes}`;
  } else {
    timeStr = picked;
    hhmm = hhmmFromTimeStr(timeStr);
  }

  let modeData = {};
  if (state.mode === CONSTANTS.MODES.PU) {
    const chipCount = parseIntClean(document.getElementById('stackAmt').value);
    const bb = document.getElementById('stackBB').value;
    modeData = { chipCount, bb };
  } else if (state.mode === CONSTANTS.MODES.ELIM) {
    modeData = {};
  } else if (state.mode === CONSTANTS.MODES.L3) {
    modeData = { profileType: 'Profile' };
  }

  // ===== Optimistic UI 적용: 즉시 피드백 =====
  const payload = {
    autoNow,
    pickedTime: picked,
    tz: state.tz,
    kind: state.mode,
    eFix: '수정 중',
    gFix: 'SOFT',
    playerName: player ? player.player : 'Player',
    tableNo: tno,
    hhmm,
    modeData,
    jBlock,
    cueId: state.cueId || undefined
  };

  // 로딩 시작
  if (!LoadingManager.start('SEND_SINGLE', '단일 전송 중...', `${payload.playerName} 데이터를 전송합니다...`)) {
    return;
  }

  google.script.run.withSuccessHandler(res=>{
    if(!res?.ok){
      LoadingManager.error('전송 실패: '+(res?.error||'unknown'));
      return;
    }
    LoadingManager.success(`✅ ${res.filename} - 행 ${res.row}(${res.time}) 저장 완료 (SC${String(res.scNumber).padStart(3, '0')})`);
  }).withFailureHandler(err=>{
    LoadingManager.error('서버 오류: '+(err?.message||err));
  }).updateVirtual(payload);
}
