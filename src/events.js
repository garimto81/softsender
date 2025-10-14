// 모드 변경
function setMode(m){
  state.mode = m;
  document.getElementById('tabPU').classList.toggle('active', m===CONSTANTS.MODES.PU);
  document.getElementById('tabL3').classList.toggle('active', m===CONSTANTS.MODES.L3);

  document.getElementById('panelPU').style.display   = (m===CONSTANTS.MODES.PU)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;
  document.getElementById('panelL3').style.display   = (m===CONSTANTS.MODES.L3)?CONSTANTS.DISPLAY.BLOCK:CONSTANTS.DISPLAY.NONE;

  // 배치 작업 중 모드 변경 시 피드백
  if (state.batch.length > 0) {
    const modeNames = {
      PU: '스택 업데이트',
      L3: '프로필 자막'
    };
    toast(`⚠️ 모드 변경: ${modeNames[m]}`, true);
  }

  rebuildPreview();
  rebuildFileName();
  updateSendButton();  // 모드 변경 시 버튼 상태 업데이트
}
