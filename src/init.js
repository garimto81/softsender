// 전역 변수: setInterval ID 저장 (중복 방지)
let keepAliveInterval = null;
let isInitialized = false;

function init(){
  // 중복 초기화 방지
  if (isInitialized) {
    console.warn('⚠️ init() 이미 실행됨 - 중복 호출 차단');
    return;
  }
  isInitialized = true;

  // 로딩 오버레이 표시
  showLoading('🔧 초기화 중...', '서버 연결 중...');

  // 서버에서 부트스트랩 정보 로드 (사용자별 저장된 Sheet ID 포함)
  google.script.run.withSuccessHandler(info=>{
    updateLoading('✅ 서버 연결 완료', `사용자: ${info?.userEmail || 'Anonymous'}`);

    state.tz = info?.tz || 'Asia/Seoul';

    // 서버에서 로드한 Sheet ID를 입력 필드에 설정
    const serverCueId = info?.cueId || '';
    const serverTypeId = info?.typeId || '';

    updateLoading('📥 설정 로드 중...', `CUE ID: ${serverCueId ? '사용자 설정' : '기본값'}\nTYPE ID: ${serverTypeId ? '사용자 설정' : '기본값'}`);

    if (serverCueId) {
      document.getElementById('cueId').value = serverCueId;
      localStorage.setItem(LS_KEYS.CUE, serverCueId);
    }
    if (serverTypeId) {
      document.getElementById('typeId').value = serverTypeId;
      localStorage.setItem(LS_KEYS.TYPE, serverTypeId);
    }

    state.cueId = serverCueId;
    state.typeId = serverTypeId;
    renderIdsHint();

    document.getElementById('footerInfo').textContent =
      `로그인: ${info?.userEmail || 'Anonymous'}  |  기본 CUE: ${info?.defaultCueId?.substring(0, 8)}...  |  TZ=${state.tz}`;

    updateLoading('📊 데이터 로드 중...', '시간 옵션 & 플레이어 정보 로딩...');

    // Sheet ID 로드 후 데이터 로드
    reloadSheets();
  }).withFailureHandler(err => {
    hideLoading();
    toast('❌ 초기화 실패: ' + (err?.message || err), false);
    setStatus('에러');
  }).getBootstrap();

  // localStorage에서 임시 로드 (서버 응답 전 빠른 표시용)
  loadIdsFromLocal();

  document.getElementById('btnSaveIds').onclick = saveIds;
  document.getElementById('btnClearIds').onclick = clearIds;

  // Sheet ID 입력 필드 자동 저장 (debounce 적용)
  const debouncedAutoSave = debounce(autoSaveIds, 1000); // 1초 대기 후 저장
  document.getElementById('cueId').addEventListener('input', debouncedAutoSave);
  document.getElementById('typeId').addEventListener('input', debouncedAutoSave);

  document.getElementById('tabPU').onclick   = ()=>setMode(CONSTANTS.MODES.PU);
  document.getElementById('tabL3').onclick   = ()=>setMode(CONSTANTS.MODES.L3);
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

  setMode(CONSTANTS.MODES.PU);

  // Priority 1: Session Keep-Alive (Cold Start 제거)
  startSessionKeepAlive();
}

// 세션 유지 함수 (4분마다 더미 호출)
function startSessionKeepAlive() {
  // 기존 interval 정리 (중복 방지)
  if (keepAliveInterval) {
    console.log('🧹 [Keep-Alive] 기존 interval 정리');
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  console.log('🔄 [Keep-Alive] 세션 유지 시작');

  keepAliveInterval = setInterval(() => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`🔄 [Keep-Alive] 세션 유지 중... (${timestamp})`);

    google.script.run
      .withSuccessHandler(() => {
        console.log(`✅ [Keep-Alive] 세션 유지 성공 (${timestamp})`);
      })
      .withFailureHandler((err) => {
        console.warn(`⚠️ [Keep-Alive] 세션 유지 실패: ${err}`);
      })
      .getBootstrap(); // 가벼운 함수 호출
  }, 4 * 60 * 1000); // 4분마다 (Google 5분 타임아웃 전)
}

// 페이지 종료 시 리소스 정리
window.addEventListener('beforeunload', () => {
  if (keepAliveInterval) {
    console.log('🧹 [Clean-Up] Keep-Alive interval 정리');
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
});

window.addEventListener('load', init);
