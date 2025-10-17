// 모드 변경
function setMode(m){
  state.mode = m;
  document.getElementById('tabPU').classList.toggle('active', m===CONSTANTS.MODES.PU);
  document.getElementById('tabELIM').classList.toggle('active', m===CONSTANTS.MODES.ELIM);
  document.getElementById('tabL3').classList.toggle('active', m===CONSTANTS.MODES.L3);

  document.getElementById('panelPU').style.display   = (m===CONSTANTS.MODES.PU)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelELIM').style.display = (m===CONSTANTS.MODES.ELIM)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelL3').style.display   = (m===CONSTANTS.MODES.L3)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;

  // 배치 작업 중 모드 변경 시 피드백
  if (state.batch.length > 0) {
    const modeNames = {
      PU: '플레이어 업데이트',
      ELIM: '플레이어 탈락',
      L3: '플레이어 소개'
    };
    toast(`⚠️ 모드 변경: ${modeNames[m]}`, true);
  }

  rebuildPreview();
  rebuildFileName();
  updateSendButton();  // 모드 변경 시 버튼 상태 업데이트
}
