const fs = require('fs');
const path = require('path');

// 빌드 옵션
const isMinify = process.argv.includes('--minify');

// 소스 파일 읽기
function readSource(filename) {
  const filepath = path.join(__dirname, 'src', filename);
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    process.exit(1);
  }
}

// 빌드 함수
function build() {
  console.log('🔨 Building Soft Content Sender...\n');

  // 1. 소스 파일 읽기
  console.log('📖 Reading source files...');
  const template = readSource('template.html');
  const css = readSource('styles.css');
  const constants = readSource('constants.js');
  const utils = readSource('utils.js');
  const preview = readSource('preview.js');
  const batch = readSource('batch.js');
  const events = readSource('events.js');
  const init = readSource('init.js');

  // 2. 템플릿 치환
  console.log('🔧 Merging files...');
  let merged = template
    .replace('<!-- INJECT:CSS -->', `<style>\n${css}\n  </style>`)
    .replace('// INJECT:CONSTANTS', constants)
    .replace('// INJECT:UTILS', utils)
    .replace('// INJECT:PREVIEW', preview)
    .replace('// INJECT:BATCH', batch)
    .replace('// INJECT:EVENTS', events)
    .replace('// INJECT:INIT', init);

  // 3. 최적화 (minify 모드)
  if (isMinify) {
    console.log('⚡ Minifying...');
    // 단순 압축: 여러 공백 → 1개, 빈 줄 제거
    merged = merged
      .replace(/^\s*\/\/.*$/gm, '') // JS 주석 제거
      .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '') // CSS 블록 주석 제거
      .replace(/\n\s*\n/g, '\n') // 연속된 빈 줄 제거
      .replace(/  +/g, ' '); // 여러 공백 → 1개
  }

  // 4. 빌드 정보 주석 추가
  const buildTime = new Date().toISOString();
  const buildMode = isMinify ? 'MINIFIED' : 'NORMAL';
  const buildInfo = `<!--
  Soft Content Sender v10.1
  Build Time: ${buildTime}
  Build Mode: ${buildMode}

  ⚠️  AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
  Edit source files in src/ and run 'npm run build'
-->

`;

  // 5. 최종 파일 생성
  const output = buildInfo + merged;
  const distPath = path.join(__dirname, 'dist', 'page.html');

  fs.writeFileSync(distPath, output, 'utf-8');

  // 6. 결과 출력
  const stats = fs.statSync(distPath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('\n✅ Build complete!');
  console.log(`📦 Output: dist/page.html (${sizeKB} KB)`);
  console.log(`🕐 Time: ${buildTime}`);
  console.log(`🎯 Mode: ${buildMode}\n`);
}

// 빌드 실행
try {
  build();
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
