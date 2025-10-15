// ===== Optimistic UI: 즉시 피드백 + 백그라운드 동기화 =====

// 재시도 설정
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 2000; // 2초

// Optimistic UI로 전송 (즉시 피드백)
async function sendWithOptimisticUI(payload) {
  const tempId = Date.now();

  try {
    // 1. 즉시 UI 피드백 (0.1초 이내)
    toast('✅ 전송 중...', true);
    showLoadingOverlay('서버 전송 중...', true);

    // 2. 로컬 큐에 추가
    await addToSyncQueue({
      id: tempId,
      payload: payload,
      status: 'pending',
      timestamp: Date.now(),
      attempts: 0
    });

    // 3. 백그라운드 동기화 시작
    syncToServer(tempId, payload);

    // 4. 즉시 다음 작업 허용 (사용자는 기다리지 않음)
    setTimeout(() => {
      hideLoadingOverlay();
      toast('📤 백그라운드 동기화 중...', true);
    }, 300);

  } catch(e) {
    console.error('❌ Optimistic UI 실패:', e);
    hideLoadingOverlay();
    toast('❌ 전송 실패 - 재시도하세요', false);
  }
}

// 서버 동기화 (비동기)
function syncToServer(id, payload, attempt = 1) {
  console.log(`🔄 서버 동기화 시작: ID=${id}, 시도=${attempt}/${RETRY_MAX_ATTEMPTS}`);

  google.script.run
    .withSuccessHandler(async (res) => {
      if (res.ok) {
        // 성공
        await updateSyncQueue(id, 'success', res);
        console.log(`✅ 동기화 성공: ${res.filename}`);
        toast(`✅ 저장 완료: ${res.filename}`, true);

        // 성공한 항목은 10초 후 삭제
        setTimeout(() => removeSyncQueueItem(id), 10000);
      } else {
        // 서버 에러
        console.error(`⚠️ 서버 에러: ${res.error}`);
        await handleSyncFailure(id, payload, attempt, res.error);
      }
    })
    .withFailureHandler(async (err) => {
      // 네트워크 에러
      console.error(`❌ 네트워크 에러:`, err);
      await handleSyncFailure(id, payload, attempt, String(err));
    })
    .updateVirtual(payload);
}

// 동기화 실패 처리
async function handleSyncFailure(id, payload, attempt, errorMsg) {
  if (attempt < RETRY_MAX_ATTEMPTS) {
    // 재시도
    await updateSyncQueue(id, 'retrying', { attempt, error: errorMsg });

    const delay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1); // 지수 백오프
    console.log(`🔄 ${delay/1000}초 후 재시도 (${attempt + 1}/${RETRY_MAX_ATTEMPTS})`);

    toast(`🔄 재시도 ${attempt}/${RETRY_MAX_ATTEMPTS} 대기 중...`, true);

    setTimeout(() => {
      syncToServer(id, payload, attempt + 1);
    }, delay);
  } else {
    // 최종 실패
    await updateSyncQueue(id, 'failed', {
      attempt,
      error: errorMsg,
      finalError: '최대 재시도 횟수 초과'
    });

    console.error(`❌ 최종 실패: ID=${id}`);
    toast(`❌ 전송 실패 (ID: ${id}) - 수동 재전송 필요`, false);

    // 실패 알림 UI 표시
    showFailedSyncNotification(id, payload);
  }
}

// 실패한 동기화 알림 UI
function showFailedSyncNotification(id, payload) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--error-bg);
    color: var(--error-color);
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 90%;
    text-align: center;
  `;

  notification.innerHTML = `
    <div style="margin-bottom: 8px;">
      ⚠️ 전송 실패 (ID: ${id})
    </div>
    <button onclick="retrySyncManually(${id})" style="
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 8px;
    ">
      🔄 재시도
    </button>
    <button onclick="dismissFailedSync(${id}, this.parentElement.parentElement)" style="
      background: #666;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    ">
      무시
    </button>
  `;

  document.body.appendChild(notification);

  // 30초 후 자동 제거
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 30000);
}

// 수동 재시도
window.retrySyncManually = async function(id) {
  const item = await getSyncQueueItem(id);
  if (item) {
    toast('🔄 재시도 중...', true);
    syncToServer(id, item.payload, 1);
  } else {
    toast('❌ 항목을 찾을 수 없습니다', false);
  }
};

// 실패 알림 무시
window.dismissFailedSync = async function(id, element) {
  await removeSyncQueueItem(id);
  element.remove();
  toast('알림 제거됨', true);
};

// 앱 시작 시 실패한 항목 복구
(async function() {
  try {
    const failedItems = await getFailedSyncItems();
    if (failedItems.length > 0) {
      console.log(`⚠️ 실패한 동기화 ${failedItems.length}건 발견`);

      // 사용자에게 알림
      toast(`⚠️ 실패한 전송 ${failedItems.length}건 - 재시도 가능`, false);

      // 각 실패 항목에 대한 알림 표시
      failedItems.forEach(item => {
        showFailedSyncNotification(item.id, item.payload);
      });
    }
  } catch(e) {
    console.error('❌ 실패 항목 복구 실패:', e);
  }
})();
