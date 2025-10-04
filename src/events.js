// 모드 변경
function setMode(m){
  state.mode = m;
  document.getElementById('tabPU').classList.toggle('active', m===CONSTANTS.MODES.PU);
  document.getElementById('tabELIM').classList.toggle('active', m===CONSTANTS.MODES.ELIM);
  document.getElementById('tabL3').classList.toggle('active', m===CONSTANTS.MODES.L3);
  document.getElementById('tabLB').classList.toggle('active', m===CONSTANTS.MODES.LEADERBOARD);

  document.getElementById('panelPU').style.display   = (m===CONSTANTS.MODES.PU)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelELIM').style.display = (m===CONSTANTS.MODES.ELIM)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelL3').style.display   = (m===CONSTANTS.MODES.L3)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelLB').style.display   = (m===CONSTANTS.MODES.LEADERBOARD)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;

  const showSingle = (m!==CONSTANTS.MODES.LEADERBOARD);
  document.getElementById('singleFields').style.display= showSingle ? CONSTANTS.DISPLAY.GRID : CONSTANTS.DISPLAY.NONE;

  // 배치 작업 중 모드 변경 시 피드백
  if (state.batch.length > 0) {
    const modeNames = {
      PU: '스택 업데이트',
      ELIM: '탈락 정보',
      L3: '프로필 자막',
      LEADERBOARD: '리더보드'
    };
    toast(`⚠️ 모드 변경: ${modeNames[m]}`, true);
  }

  if(m===CONSTANTS.MODES.LEADERBOARD) buildLeaderboardList();
  rebuildPreview();
  rebuildFileName();
  updateSendButton();  // 모드 변경 시 버튼 상태 업데이트
}
