# 빌드 시스템 설치 및 사용 가이드

## ✅ 설치 완료 확인

다음 파일들이 생성되었는지 확인하세요:

```
✅ package.json
✅ build.js
✅ watch.js
✅ .gitignore
✅ README.md
✅ src/page.html
✅ src/styles/ (7개 파일)
✅ src/scripts/ (12개 파일)
✅ src/views/ (2개 파일)
✅ dist/page.html (빌드 완료)
```

## 🚀 사용법

### 1. 개발 시작

```bash
# 파일 감시 모드 (자동 빌드)
npm run dev
```

- src/ 폴더의 파일을 수정하면 자동으로 빌드됩니다
- 빌드 결과는 dist/page.html에 생성됩니다

### 2. 프로덕션 빌드

```bash
# 최적화된 빌드 (압축)
npm run build:prod
```

- CSS/JS 압축으로 파일 크기 38% 감소
- 배포 전 반드시 실행하세요

### 3. 배포

1. `dist/page.html` 파일을 엽니다
2. 전체 내용을 복사합니다 (Ctrl+A, Ctrl+C)
3. Google Apps Script 편집기 열기
4. `page.html` 파일에 붙여넣기
5. 저장 및 배포

## 📊 빌드 결과

### 개발 빌드
- 파일 크기: 46.35 KB
- 빌드 시간: ~17ms
- 포맷: 읽기 쉬운 형식 (디버깅 용이)

### 프로덕션 빌드
- 파일 크기: 28.40 KB (38% 감소)
- 빌드 시간: ~908ms
- 포맷: 압축됨 (최적화)

## 🔧 파일 추가하기

### CSS 파일 추가

1. `src/styles/` 에 새 파일 생성 (예: `my-feature.css`)
2. `build.js` 열기
3. `cssFiles` 배열에 추가:
   ```javascript
   const cssFiles = [
     'styles/tokens.css',
     // ...
     'styles/my-feature.css', // 추가
   ];
   ```

### JavaScript 파일 추가

1. `src/scripts/` 에 새 파일 생성
2. `build.js` 열기
3. `jsFiles` 배열에 **의존성 순서에 맞게** 추가:
   ```javascript
   const jsFiles = [
     'scripts/core/state.js',     // 먼저
     'scripts/services/api.js',
     // ...
     'scripts/modules/my-module.js', // 의존성 이후
     'scripts/main.js',              // 마지막
   ];
   ```

## ⚠️ 주의사항

### 의존성 순서 (매우 중요!)

JavaScript 파일은 반드시 다음 순서로 배치하세요:

1. **Core (상태 관리)**: `state.js` - 가장 먼저
2. **Services**: `api.js`, `storage.js` - 의존성 없음
3. **Utils**: `format.js`, `validation.js` - 의존성 없음
4. **Modules**: 다른 모듈에 의존 가능
5. **Router**: 모든 UI 모듈 의존
6. **Main**: `main.js` - 가장 마지막

### 절대 금지

- ❌ `dist/` 폴더 직접 수정 (빌드 시 덮어씀)
- ❌ ES6 import/export 사용 (Apps Script 미지원)
- ❌ Node.js 모듈 사용 (브라우저 전용)

## 🐛 문제 해결

### 빌드 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 파일을 찾을 수 없음

- `build.js`의 파일 경로 확인
- `src/` 폴더 구조 확인
- 파일 이름 대소문자 확인 (정확히 일치해야 함)

### JavaScript 오류

- 브라우저 콘솔에서 오류 확인
- `build.js`의 `jsFiles` 순서 확인
- 의존성이 먼저 로드되는지 확인

## 📝 개발 팁

### 빠른 테스트

```bash
# 개발 빌드 (빠름)
npm run build

# 브라우저에서 직접 열기
start dist/page.html  # Windows
open dist/page.html   # Mac
```

### 코드 구조

```javascript
// IIFE 패턴 (모듈 캡슐화)
const MyModule = (() => {
  // Private (외부 접근 불가)
  const _private = 'secret';

  // Public API
  return {
    doSomething() {
      console.log(_private);
    }
  };
})();

// 사용
MyModule.doSomething();
```

### 상태 관리

```javascript
// 읽기
const value = AppState.get('key');

// 쓰기
AppState.set('key', value);

// 구독 (변경 감지)
AppState.subscribe('key', (newValue) => {
  console.log('Changed:', newValue);
});
```

## 🎯 다음 단계

1. ✅ 빌드 시스템 설치 완료
2. ⬜ 기존 `page.html` 마이그레이션
3. ⬜ 모듈별 테스트
4. ⬜ E2E 테스트
5. ⬜ Google Apps Script 배포

---

문제가 있으면 [README.md](README.md) 또는 [LLD-Build-System.md](docs/LLD-Build-System.md)를 참고하세요.
