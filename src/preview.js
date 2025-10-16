/* 미리보기(전부 대문자 출력) */
function rebuildPreview(){
  const mode = state.mode;

  // DOM 요소 캐싱
  const els = {
    stackAmt: document.getElementById('stackAmt'),
    stackBB: document.getElementById('stackBB'),
    preview: document.getElementById('preview')
  };

  let body='';

  if(mode===CONSTANTS.MODES.PU){
    computeBB();
    const player = getSelectedPlayer();
    if (!player) { body = ''; }
    else {
      const name = (player.player || '').toUpperCase();
      const country = (player.nat || '').toUpperCase();
      const amt = (els.stackAmt.value||'').toUpperCase();
      const bb = (els.stackBB.value||'').toUpperCase();
      body = `${name} / ${country}\nCURRENT STACK - ${amt} (${bb}BB)`;
    }
  }else if(mode===CONSTANTS.MODES.L3){
    const player = getSelectedPlayer();
    if (!player) { body = ''; }
    else {
      const name = (player.player || '').toUpperCase();
      body = `플레이어 소개\n${name}`;
    }
  }
  els.preview.value = body;
}

// 현재 입력 미리보기 생성
function generateCurrentPreview() {
  const mode = state.mode;
  const els = {
    stackAmt: document.getElementById('stackAmt'),
    stackBB: document.getElementById('stackBB')
  };

  let body = '';

  if (mode === CONSTANTS.MODES.PU) {
    computeBB();
    const player = getSelectedPlayer();
    if (player) {
      const name = (player.player || '').toUpperCase();
      const country = (player.nat || '').toUpperCase();
      const amt = (els.stackAmt.value || '').toUpperCase();
      const bb = (els.stackBB.value || '').toUpperCase();
      body = `${name} / ${country}\nCURRENT STACK - ${amt} (${bb}BB)`;
    }
  } else if (mode === CONSTANTS.MODES.L3) {
    const player = getSelectedPlayer();
    if (player) {
      const name = (player.player || '').toUpperCase();
      const country = (player.nat || '').toUpperCase();
      body = `플레이어 소개\n${name} / ${country}`;
    }
  }

  return body;
}

// 미리보기 통합 업데이트
function updateBatchPreview() {
  const previewEl = document.getElementById('preview');
  const previewLabel = document.getElementById('previewLabel');

  if (state.batch.length > 0) {
    // 배치 모드: 배치 전체 내용 + 현재 입력 표시
    const batchContent = state.batch.map(item => item.content).join('\n\n');
    const currentPreview = generateCurrentPreview();

    previewLabel.textContent = `미리보기 (배치 ${state.batch.length}건 + 현재 입력)`;
    previewEl.value = `=== 배치 전송될 내용 (${state.batch.length}건) ===\n\n${batchContent}\n\n=== 현재 입력 (배치에 추가하려면 [➕ 배치에 추가] 클릭) ===\n\n${currentPreview}`;
  } else {
    // 단일 모드
    previewLabel.textContent = '미리보기';
    rebuildPreview();
  }
}
