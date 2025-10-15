// ===== Optimistic UI: IndexedDB 동기화 큐 =====
// 목적: 즉시 UI 피드백 + 백그라운드 Sheets 동기화

const SYNC_DB_NAME = 'SoftSenderQueue';
const SYNC_DB_VERSION = 1;
const SYNC_STORE_NAME = 'queue';

// IndexedDB 초기화
async function initSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const store = db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ IndexedDB 동기화 큐 생성 완료');
      }
    };
  });
}

// 동기화 큐에 추가
async function addToSyncQueue(item) {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => {
      console.log(`✅ 큐 추가: ID=${item.id}, 상태=${item.status}`);
      resolve(item.id);
    };
    request.onerror = () => reject(request.error);
  });
}

// 동기화 큐 업데이트
async function updateSyncQueue(id, status, result = null) {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.status = status;
        item.result = result;
        item.updatedAt = Date.now();

        const putRequest = store.put(item);
        putRequest.onsuccess = () => {
          console.log(`✅ 큐 업데이트: ID=${id}, 상태=${status}`);
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error(`Item not found: ${id}`));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// 동기화 큐 조회 (단일)
async function getSyncQueueItem(id) {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 동기화 큐 전체 조회
async function getAllSyncQueue() {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 실패한 항목 조회
async function getFailedSyncItems() {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('failed');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 동기화 큐 삭제
async function removeSyncQueueItem(id) {
  const db = await initSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`✅ 큐 삭제: ID=${id}`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// 오래된 항목 정리 (24시간 이상)
async function cleanupOldSyncQueue() {
  const items = await getAllSyncQueue();
  const now = Date.now();
  const cutoff = 24 * 60 * 60 * 1000; // 24시간

  for (const item of items) {
    if (item.status === 'success' && (now - item.timestamp > cutoff)) {
      await removeSyncQueueItem(item.id);
    }
  }

  console.log('✅ 동기화 큐 정리 완료');
}

// 앱 시작 시 초기화
(async function() {
  try {
    await initSyncDB();
    await cleanupOldSyncQueue();
    console.log('✅ 동기화 시스템 초기화 완료');
  } catch(e) {
    console.error('❌ 동기화 시스템 초기화 실패:', e);
  }
})();
