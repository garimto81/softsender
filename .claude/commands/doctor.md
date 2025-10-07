# /doctor

문서 전체 진단 + 자동 수정 + 재검증을 **1회 실행으로** 완료

## 개요
```
사용자: /doctor
  ↓
[3초] Layer 1+2+3 병렬 검증
  ↓
[10초] 자동 수정 (파일당 1회 Edit)
  ↓
[1초] 재검증 (Layer 1)
  ↓
[1초] 최종 보고
  ↓
총 15초 완료 ✅
```

## 실행 단계

### 1단계: 3-Layer 병렬 검증 (3초)
```
병렬 실행 (동시에):
├─ Bash: python scripts/validate_structure.py .
├─ Task: doc-logic-validator
└─ Task: doc-semantic-validator

대기 → 모두 완료 시 다음 단계
```

**중요:** Task 2개를 **단일 메시지**로 동시 호출
```python
# ✅ 올바른 방법
<function_calls>
  <invoke name="Task">...</invoke>  # doc-logic-validator
  <invoke name="Task">...</invoke>  # doc-semantic-validator
</function_calls>

# ❌ 나쁜 방법 (순차 실행, 느림)
<function_calls>
  <invoke name="Task">...</invoke>
</function_calls>
... 대기 ...
<function_calls>
  <invoke name="Task">...</invoke>
</function_calls>
```

### 2단계: 이슈 통합 (1초)
```bash
python scripts/merge_issues.py .
```
- 3개 레이어 결과 통합
- 파일별 그룹화
- 우선순위 정렬

### 3단계: 자동 수정 (10초)
```
if auto_fixable > 0:
    Task: doc-auto-fixer
    입력: scripts/issues_merged.json
    출력: 수정된 파일들 + fix_report.json
```

**핵심:** 파일당 1회 Edit로 모든 수정 적용

### 4단계: 재검증 (1초)
```bash
python scripts/validate_structure.py .
```
- Layer 1만 빠르게 재검증
- 자동 수정 결과 확인

### 5단계: 최종 보고 (1초)
```
════════════════════════════════════════════════════════════
📊 문서 건강 진단 완료
════════════════════════════════════════════════════════════

🔍 검증 결과:
  총 결함: 15개 → 3개
  - Layer 1 (구조): 5개 → 0개 ✅
  - Layer 2 (논리): 7개 → 2개 ⚠️
  - Layer 3 (의미): 3개 → 1개 ⚠️

✅ 자동 수정 완료: 12개
  PLAN.md (3곳)
    - Line 1: 버전 v2.3.0 → v2.3.1
    - Line 45: 들여쓰기 수정
    - Line 67: 파일 경로 수정

  PRD.md (5곳)
    - Line 1: 버전 동기화
    - Line 89: 들여쓰기 수정
    ...

  STATUS.md, LLD.md, CHANGELOG.md (4곳)
    ...

📊 문서 건강도: 95/100 (이전 75 → +20)
  - 구조: ✅ 100%
  - 논리: ✅ 95%
  - 의미: ✅ 90%

⚠️ 수동 검토 필요: 3개
  1. PLAN.md:45 - 페르소나 나이(25세) vs 경력(10년) 모순
     → 해결: 나이를 35세로 수정 또는 경력을 5년으로 수정

  2. PRD.md:120 - Phase 1.3 → 2.1 → 1.3 순환 의존성
     → 해결: 의존성 재설계 필요

  3. LLD.md:67 - 간단한 CRUD에 Redis+Kafka 과도
     → 해결: 기술 스택 단순화 고려

════════════════════════════════════════════════════════════
다음 단계:
  1. 수동 검토 항목 수정
  2. /doctor 재실행으로 100점 달성
  3. CHANGELOG에 "문서 정리 v2.3.1" 기록
════════════════════════════════════════════════════════════
```

## 도구 호출 횟수 (반복 없음)
```
Read: 5회 (문서 5개)
Bash: 3회 (validate × 2 + merge × 1)
Task: 3회 (logic + semantic + fixer)
Edit: 5회 (파일당 1회)
───────────────────
총: 16회 (안전 범위)
```

## 성공 기준
- ✅ 총 실행 시간 ≤ 20초
- ✅ 도구 호출 ≤ 20회
- ✅ 반복 없음 (각 도구 최대 2회만)
- ✅ 문서 건강도 ≥ 90점

## 에러 처리

### Layer 검증 실패 시
```
Layer 1 에러 → Layer 2/3 건너뜀
이유: 구조가 깨지면 논리/의미 검증 무의미
```

### 자동 수정 실패 시
```
충돌 발견 → 사용자에게 보고 → 수동 수정 가이드
파일 권한 → 권한 확인 요청
```

### 재검증 실패 시
```
자동 수정 후에도 에러 남음
  ↓
fix_report.json에 남은 에러 기록
  ↓
사용자에게 수동 수정 필요 알림
```

## 언제 사용?

### 프로젝트 시작 시
```
PLAN 작성 → /doctor → 완벽한 PLAN
PRD 작성 → /doctor → PLAN↔PRD 일치 확인
```

### 기능 완료 후
```
체크박스 완료 → 문서 갱신 → /doctor → 버전 동기화
```

### 정기 점검
```
주 1회: /doctor 실행 → 문서 건강도 모니터링
```

### 팀 협업 시
```
PR 전: /doctor → 100점 확인 → PR 생성
```

## 출력 파일
```
scripts/
  ├─ issues_L1.json      (Layer 1 결과)
  ├─ issues_L2.json      (Layer 2 결과)
  ├─ issues_L3.json      (Layer 3 결과)
  ├─ issues_merged.json  (통합 결과)
  └─ fix_report.json     (수정 보고서)
```

## CI/CD 통합 예시
```yaml
# .github/workflows/docs.yml
name: Document Health Check

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run Doctor
        run: |
          # /doctor 수동 실행 흉내
          python scripts/validate_structure.py .
          # 에러 있으면 fail
          if [ $? -ne 0 ]; then
            echo "문서 검증 실패. /doctor 실행 필요"
            exit 1
          fi
```

## 제한사항
- Layer 3 (의미 검증)는 LLM 의존 → False Positive/Negative 가능
- 복잡한 구조 변경은 자동 수정 불가
- 파일 권한/인코딩 문제는 수동 해결 필요

## 완료 기준
이 커맨드 실행 후:
1. ✅ 구조적 에러 0개
2. ✅ 자동 수정 가능한 것 모두 수정됨
3. ✅ 문서 건강도 ≥ 90점
4. ✅ 수동 검토 항목 명확히 리스트업
5. ✅ 사용자가 할 일: 수동 항목만 확인