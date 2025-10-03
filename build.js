#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier');
const { minify: minifyJS } = require('terser');

class HTMLBuilder {
  constructor(options = {}) {
    this.srcDir = path.resolve(__dirname, 'src');
    this.distDir = path.resolve(__dirname, 'dist');
    this.minify = options.minify || false;
  }

  async build() {
    console.log('🚀 Starting build process...');
    const startTime = Date.now();

    try {
      // Ensure dist directory exists
      if (!fs.existsSync(this.distDir)) {
        fs.mkdirSync(this.distDir, { recursive: true });
      }

      // Read template
      const templatePath = path.join(this.srcDir, 'page.html');
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }
      let template = fs.readFileSync(templatePath, 'utf8');

      // Bundle CSS
      console.log('📦 Bundling CSS...');
      const css = await this.bundleCSS();
      template = template.replace('<!-- INJECT:CSS -->', `<style>\n${css}\n</style>`);

      // Bundle JavaScript
      console.log('📦 Bundling JavaScript...');
      const js = await this.bundleJS();
      template = template.replace('<!-- INJECT:JS -->', `<script>\n${js}\n</script>`);

      // Bundle Views
      console.log('📦 Bundling Views...');
      const views = await this.bundleViews();
      template = template.replace('<!-- INJECT:VIEWS -->', views);

      // Minify if requested
      if (this.minify) {
        console.log('🗜️  Minifying HTML...');
        template = minifyHTML(template, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
          removeAttributeQuotes: false,
          removeEmptyAttributes: false
        });
      }

      // Write output
      const outputPath = path.join(this.distDir, 'page.html');
      fs.writeFileSync(outputPath, template, 'utf8');

      const elapsed = Date.now() - startTime;
      const size = (fs.statSync(outputPath).size / 1024).toFixed(2);
      console.log(`✅ Build complete in ${elapsed}ms`);
      console.log(`📄 Output: ${outputPath} (${size} KB)`);
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async bundleCSS() {
    const cssFiles = [
      'styles/tokens.css',
      'styles/reset.css',
      'styles/global.css',
      'styles/table-selection.css',
      'styles/work-screen.css',
      'styles/components.css',
      'styles/responsive.css'
    ];

    let combined = '';
    for (const file of cssFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combined += `\n/* ${file} */\n${content}\n`;
      } else {
        console.warn(`⚠️  CSS file not found: ${file}`);
      }
    }

    if (this.minify) {
      const minified = new CleanCSS({
        level: 2,
        compatibility: 'ie11'
      }).minify(combined);

      if (minified.errors.length > 0) {
        throw new Error(`CSS minification errors: ${minified.errors.join(', ')}`);
      }
      return minified.styles;
    }

    return combined;
  }

  async bundleJS() {
    // Order matters - dependencies must come first
    const jsFiles = [
      'scripts/core/state.js',          // Must be first - no dependencies
      'scripts/services/api.js',        // Depends on nothing
      'scripts/services/storage.js',    // Depends on nothing
      'scripts/utils/format.js',        // Depends on nothing
      'scripts/utils/validation.js',    // Depends on nothing
      'scripts/modules/table-data.js',  // Depends on state, api, storage
      'scripts/modules/table-ui.js',    // Depends on table-data, format
      'scripts/modules/player-ui.js',   // Depends on state, format, validation
      'scripts/modules/mode-ui.js',     // Depends on state
      'scripts/modules/send-ui.js',     // Depends on state, api, format
      'scripts/core/router.js',         // Depends on state, all UIs
      'scripts/main.js'                 // Last - initializes everything
    ];

    let combined = '';
    for (const file of jsFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combined += `\n// ${file}\n${content}\n`;
      } else {
        console.warn(`⚠️  JS file not found: ${file}`);
      }
    }

    if (this.minify) {
      const minified = await minifyJS(combined, {
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true
        },
        mangle: {
          toplevel: false,
          reserved: ['AppState', 'API', 'Storage', 'Router']
        },
        format: {
          comments: false
        }
      });

      if (minified.error) {
        throw new Error(`JS minification error: ${minified.error}`);
      }
      return minified.code;
    }

    return combined;
  }

  async bundleViews() {
    const viewFiles = [
      'views/table-selection.html',
      'views/work-screen.html'
    ];

    let combined = '';
    for (const file of viewFiles) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combined += `\n<!-- ${file} -->\n${content}\n`;
      } else {
        console.warn(`⚠️  View file not found: ${file}`);
      }
    }

    return combined;
  }
}

// CLI execution
const args = process.argv.slice(2);
const minify = args.includes('--minify') || args.includes('-m');

const builder = new HTMLBuilder({ minify });
builder.build();
