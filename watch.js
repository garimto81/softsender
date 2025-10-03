#!/usr/bin/env node

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

console.log('👀 Starting file watcher...');

// Watch src directory
const watcher = chokidar.watch('src/**/*', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

let buildTimeout = null;
let isBuilding = false;

function triggerBuild(filePath) {
  // Debounce builds (wait 300ms after last change)
  clearTimeout(buildTimeout);

  buildTimeout = setTimeout(() => {
    if (isBuilding) {
      console.log('⏳ Build already in progress, queuing...');
      return;
    }

    isBuilding = true;
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\n🔄 Change detected: ${relativePath}`);
    console.log('🏗️  Rebuilding...');

    exec('node build.js', (error, stdout, stderr) => {
      isBuilding = false;

      if (error) {
        console.error('❌ Build error:', error.message);
        if (stderr) console.error(stderr);
        return;
      }

      console.log(stdout);
      console.log('✨ Watching for changes... (Ctrl+C to stop)\n');
    });
  }, 300);
}

watcher
  .on('add', filePath => {
    console.log(`📄 File added: ${path.relative(process.cwd(), filePath)}`);
    triggerBuild(filePath);
  })
  .on('change', filePath => {
    triggerBuild(filePath);
  })
  .on('unlink', filePath => {
    console.log(`🗑️  File removed: ${path.relative(process.cwd(), filePath)}`);
    triggerBuild(filePath);
  })
  .on('error', error => {
    console.error('❌ Watcher error:', error);
  });

// Initial build
console.log('🏗️  Running initial build...\n');
exec('node build.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Initial build error:', error.message);
    if (stderr) console.error(stderr);
    process.exit(1);
  }

  console.log(stdout);
  console.log('✨ Watching for changes... (Ctrl+C to stop)\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  watcher.close();
  process.exit(0);
});
