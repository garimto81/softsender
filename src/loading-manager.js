/* ===== 통합 로딩 관리자 (Unified Loading Manager) ===== */

/**
 * 로딩 상태 관리 및 사용자 실수 방지
 *
 * 기능:
 * 1. 전역 로딩 상태 추적
 * 2. 중복 요청 방지 (한 번에 하나의 작업만)
 * 3. UI 비활성화 (버튼, 입력 필드 등)
 * 4. 진행 상황 표시
 * 5. 에러 처리 및 복구
 */

const LoadingManager = {
  // 상태
  isLoading: false,
  currentOperation: null,
  disabledElements: [],

  /**
   * 로딩 시작
   * @param {string} operation - 작업 이름 (예: 'INIT', 'SEND', 'SAVE_IDS')
   * @param {string} message - 로딩 메시지
   * @param {string} details - 상세 정보 (선택)
   */
  start(operation, message, details = '') {
    // 중복 요청 방지
    if (this.isLoading) {
      console.warn(`⚠️ [LoadingManager] 작업 중복 차단: ${this.currentOperation} → ${operation}`);
      return false;
    }

    this.isLoading = true;
    this.currentOperation = operation;

    // 로딩 오버레이 표시
    showLoading(message, details);

    // UI 비활성화
    this.disableUI();

    // 상태 업데이트
    setStatus('작업 중…');

    console.log(`🔄 [LoadingManager] 시작: ${operation}`);
    return true;
  },

  /**
   * 로딩 진행 상황 업데이트
   * @param {string} message - 업데이트 메시지
   * @param {string} details - 상세 정보 (선택)
   */
  update(message, details = '') {
    if (!this.isLoading) {
      console.warn('⚠️ [LoadingManager] 로딩 중이 아닌데 update 호출됨');
      return;
    }

    updateLoading(message, details);
    console.log(`📊 [LoadingManager] 진행: ${message}`);
  },

  /**
   * 로딩 종료 (성공)
   * @param {string} message - 완료 메시지 (선택)
   */
  success(message = '') {
    if (!this.isLoading) {
      console.warn('⚠️ [LoadingManager] 로딩 중이 아닌데 success 호출됨');
      return;
    }

    console.log(`✅ [LoadingManager] 성공: ${this.currentOperation}`);

    // 짧은 딜레이 후 종료 (사용자가 완료 메시지 확인 가능)
    setTimeout(() => {
      hideLoading();
      this.enableUI();
      setStatus('준비됨');

      if (message) {
        toast(message, true);
      }

      this.reset();
    }, 300);
  },

  /**
   * 로딩 종료 (에러)
   * @param {string} errorMsg - 에러 메시지
   * @param {boolean} showToast - 토스트 표시 여부 (기본: true)
   */
  error(errorMsg, showToast = true) {
    if (!this.isLoading) {
      console.warn('⚠️ [LoadingManager] 로딩 중이 아닌데 error 호출됨');
      return;
    }

    console.error(`❌ [LoadingManager] 에러: ${this.currentOperation} - ${errorMsg}`);

    hideLoading();
    this.enableUI();
    setStatus('에러');

    if (showToast) {
      toast(`❌ ${errorMsg}`, false);
    }

    this.reset();
  },

  /**
   * 상태 초기화
   */
  reset() {
    this.isLoading = false;
    this.currentOperation = null;
  },

  /**
   * UI 비활성화 (버튼, 입력 필드 등)
   */
  disableUI() {
    // 비활성화할 요소 선택
    const selectors = [
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.disabled) {
          el.disabled = true;
          this.disabledElements.push(el);
        }
      });
    });

    console.log(`🔒 [LoadingManager] UI 비활성화: ${this.disabledElements.length}개 요소`);
  },

  /**
   * UI 활성화
   */
  enableUI() {
    this.disabledElements.forEach(el => {
      el.disabled = false;
    });

    console.log(`🔓 [LoadingManager] UI 활성화: ${this.disabledElements.length}개 요소`);
    this.disabledElements = [];
  },

  /**
   * 로딩 중인지 확인
   * @returns {boolean}
   */
  isActive() {
    return this.isLoading;
  },

  /**
   * 현재 작업 가져오기
   * @returns {string|null}
   */
  getCurrentOperation() {
    return this.currentOperation;
  }
};

/**
 * 래퍼 함수: google.script.run 호출 시 자동 로딩 처리
 *
 * @param {string} operation - 작업 이름
 * @param {string} loadingMessage - 로딩 메시지
 * @param {Function} serverFunction - 서버 함수 (google.script.run.xxx)
 * @param {Object} callbacks - 콜백 함수들
 *   - onSuccess: 성공 시 콜백
 *   - onError: 에러 시 콜백 (선택)
 *   - onComplete: 완료 시 콜백 (선택)
 * @param {Array} args - 서버 함수 인자들
 *
 * @example
 * withLoading('SAVE_IDS', 'ID 저장 중...',
 *   google.script.run.saveUserPreference,
 *   {
 *     onSuccess: (res) => {
 *       if (res.ok) {
 *         LoadingManager.success('저장 완료');
 *       } else {
 *         LoadingManager.error(res.error);
 *       }
 *     }
 *   },
 *   [cueId, typeId]
 * );
 */
function withLoading(operation, loadingMessage, serverFunction, callbacks, args = []) {
  // 중복 요청 차단
  if (!LoadingManager.start(operation, loadingMessage)) {
    toast('⚠️ 이전 작업이 진행 중입니다. 완료 후 다시 시도하세요.', false);
    return;
  }

  // 서버 호출
  const runner = google.script.run
    .withSuccessHandler(res => {
      if (callbacks.onSuccess) {
        callbacks.onSuccess(res);
      }
      if (callbacks.onComplete) {
        callbacks.onComplete(res);
      }
    })
    .withFailureHandler(err => {
      const errorMsg = err?.message || err || 'unknown';

      if (callbacks.onError) {
        callbacks.onError(errorMsg);
      } else {
        LoadingManager.error(`서버 오류: ${errorMsg}`);
      }

      if (callbacks.onComplete) {
        callbacks.onComplete(null, errorMsg);
      }
    });

  // 함수 호출
  const funcName = serverFunction.toString().match(/\.(\w+)$/)?.[1] || 'unknown';
  runner[funcName](...args);
}

/**
 * 작업 중 사용자 실수 방지 (페이지 이탈 경고)
 */
window.addEventListener('beforeunload', (e) => {
  if (LoadingManager.isActive()) {
    e.preventDefault();
    e.returnValue = '작업이 진행 중입니다. 페이지를 나가시겠습니까?';
    return e.returnValue;
  }
});
