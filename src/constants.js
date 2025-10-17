// 상수 정의
const CONSTANTS = {
  TOAST_DURATION: 1800,
  DEFAULT_SEAT_INDEX: 1,
  DEBOUNCE_DELAY: 300,
  MODES: {
    PU: 'PU',
    ELIM: 'ELIM',
    L3: 'L3'
  },
  DISPLAY: {
    GRID: 'grid',
    BLOCK: 'block',
    NONE: 'none'
  }
};

// localStorage 키 (Sheet ID 백업용)
const LS_KEYS = {
  CUE: 'SCS_CUE_ID',
  TYPE: 'SCS_TYPE_ID'
};

const state = {
  mode: CONSTANTS.MODES.PU,
  tz: 'Asia/Seoul',
  typeRows: [],
  byRoom: {},
  byRoomTable: {},
  tableList: [],     // Room+Table 통합 목록
  timeCenter: '',
  cueId: '',
  typeId: '',
  batch: []          // 배치 전송용 배열
};
