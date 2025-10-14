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

  // 배치 추가 버튼은 LEADERBOARD 모드가 아닐 때 항상 표시
  btnAddToBatch.style.display = (state.mode === CONSTANTS.MODES.LEADERBOARD) ? 'none' : 'block';
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

    div.innerHTML = `
      <div style="flex:1; min-width:0;">
        <div style="font-weight:600; font-size:0.95em;">
          ${idx + 1}. ${item.seat} ${item.player}
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
  const timeStr = autoNow ? state.timeCenter.slice(0,5) : picked;
  const hhmm = hhmmFromTimeStr(timeStr);

  const key = document.getElementById('selRoomTable').value;
  const tno = key ? key.split('|')[1] : '';

  // 새 형식으로 파일명 생성: Batch_개수_시간
  const modeData = { count: state.batch.length };

  google.script.run
    .withSuccessHandler(filename => {
      const payload = {
        autoNow,
        pickedTime: picked,
        tz: state.tz,
        kind: 'BATCH',
        eFix: '미완료',
        gFix: 'SOFT',
        filename,
        jBlock,
        cueId: state.cueId || undefined
      };

      setStatus('전송 중…');

      google.script.run
        .withSuccessHandler(res => {
          if (!res?.ok) {
            toast('❌ 전송 실패: ' + (res?.error || 'unknown'), false);
            setStatus('에러');
            return;
          }

          toast(`✅ 배치 전송 완료! ${state.batch.length}건이 행 ${res.row}(${res.time})에 저장되었습니다.`, true);
          setStatus('준비됨');

          state.batch = [];
          renderBatchList();
          updateBatchPreview();
          updateSendButton();
        })
        .withFailureHandler(err => {
          toast('❌ 서버 오류: ' + (err?.message || err), false);
          setStatus('에러');
        })
        .updateVirtual(payload);
    })
    .buildFileName('BATCH', hhmm, tno, 'Batch', modeData);
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
  const filename= document.getElementById('fileName').value.trim();
  const jBlock  = generateCurrentPreview(); // 배치 미리보기 제외

  if(!jBlock){ toast('미리보기 내용이 비었습니다.', false); return; }
  if(!filename){ toast('파일명 비어있음.', false); return; }
  if(state.mode===CONSTANTS.MODES.PU){
    if(!parseIntClean(document.getElementById('stackAmt').value) || !parseIntClean(document.getElementById('bigBlind').value)){
      toast('칩스택/빅블을 입력하세요.', false); return;
    }
  }
  if(state.mode===CONSTANTS.MODES.LEADERBOARD){
    const ok = !!document.getElementById('lbLevel').value.trim()
      && parseIntClean(document.getElementById('lbSB').value)>0
      && parseIntClean(document.getElementById('lbBB').value)>0
      && parseIntClean(document.getElementById('lbAnte').value)>0
      && Array.from(document.querySelectorAll('#lbList .lbAmt')).some(i=>parseIntClean(i.value)>0);
    if(!ok){ toast('레벨/SB/BB/ANTE 및 칩스택을 입력하세요.', false); return; }
  }
  if(state.mode===CONSTANTS.MODES.ELIM){
    const prizeValue = document.getElementById('selPrize').value;
    if(prizeValue === 'prize'){
      const place = document.getElementById('prizePlace').value.trim();
      const amount = document.getElementById('prizeAmount').value.trim();
      if(!place || !amount){
        toast('순위와 상금을 입력하세요.', false); return;
      }
    }
  }

  setStatus('전송 중…');
  google.script.run.withSuccessHandler(res=>{
    if(!res?.ok){ toast('실패: '+(res?.error||'unknown'), false); setStatus('에러'); return; }
    toast(`행 ${res.row}(${res.time}) 갱신 완료`);
    setStatus('준비됨');
  }).withFailureHandler(err=>{
    toast('서버 오류: '+(err?.message||err), false);
    setStatus('에러');
  }).updateVirtual({
    autoNow,
    pickedTime: picked,
    tz: state.tz,
    kind: state.mode,
    eFix: '미완료',
    gFix: 'SOFT',
    filename,
    jBlock,
    cueId: state.cueId || undefined
  });
}
