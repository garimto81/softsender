function init(){
  google.script.run.withSuccessHandler(info=>{
    state.tz = info?.tz || 'Asia/Seoul';
    document.getElementById('footerInfo').textContent =
      `기본 CUE: ${info?.cueId}  |  기본 TYPE: ${info?.typeId}  |  TZ=${state.tz}`;
    setStatus('준비됨');
  }).getBootstrap();

  loadIdsFromLocal();
  reloadSheets();

  document.getElementById('btnSaveIds').onclick = saveIds;
  document.getElementById('btnClearIds').onclick = clearIds;

  document.getElementById('tabPU').onclick   = ()=>setMode(CONSTANTS.MODES.PU);
  document.getElementById('tabELIM').onclick = ()=>setMode(CONSTANTS.MODES.ELIM);
  document.getElementById('tabL3').onclick   = ()=>setMode(CONSTANTS.MODES.L3);
  document.getElementById('tabLB').onclick   = ()=>setMode(CONSTANTS.MODES.LEADERBOARD);
  document.getElementById('btnSend').onclick = send;

  // 배치 추가 버튼
  document.getElementById('btnAddToBatch').addEventListener('click', addToBatch);

  // 배치 전체 삭제
  document.getElementById('btnClearBatch').addEventListener('click', () => {
    if (state.batch.length === 0) return;

    if (confirm(`${state.batch.length}개 항목을 모두 삭제하시겠습니까?`)) {
      state.batch = [];
      renderBatchList();
      updateBatchPreview();
      updateSendButton();
      toast('배치 초기화됨', true);
    }
  });

  // 키보드 단축키: Ctrl+B
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      if (state.batch.length > 0 || document.getElementById('btnAddToBatch').style.display !== 'none') {
        addToBatch();
      }
    }
  });

  document.getElementById('selRoomTable').addEventListener('change', fillSeats);
  document.getElementById('selSeat').addEventListener('change', applyPickFromSeat);

  // 디바운싱된 미리보기 갱신
  const debouncedRebuild = debounce(() => {
    rebuildPreview();
    rebuildFileName();
  }, CONSTANTS.DEBOUNCE_DELAY);

  const stackAmt = document.getElementById('stackAmt');
  stackAmt.addEventListener('input', ()=>{ formatInputWithComma(stackAmt); computeBB(); debouncedRebuild(); });
  const bigBlind = document.getElementById('bigBlind');
  bigBlind.addEventListener('input', ()=>{ formatInputWithComma(bigBlind); computeBB(); debouncedRebuild(); });

  // ELIM 모드: 상금 여부에 따라 입력란 표시/숨김
  document.getElementById('selPrize').addEventListener('change', (e) => {
    const prizeDetails = document.getElementById('prizeDetails');
    prizeDetails.style.display = e.target.value === 'prize' ? CONSTANTS.DISPLAY.BLOCK : CONSTANTS.DISPLAY.NONE;
    rebuildPreview();
  });

  // ELIM 모드: 순위/상금 입력 시 미리보기 갱신
  document.getElementById('prizePlace').addEventListener('input', debouncedRebuild);
  document.getElementById('prizeAmount').addEventListener('input', debouncedRebuild);

  setMode(CONSTANTS.MODES.ELIM);
}

window.addEventListener('load', init);
