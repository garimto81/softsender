# Changelog

## [14.0.0] - 2025-10-03

### 🚀 Major Release - Build System & Two-Panel UI

#### Added
- **Node.js Build System**
  - Modular development with automated bundling
  - Single HTML file output for Apps Script deployment
  - CSS/JS minification (38% size reduction: 46KB → 28KB)
  - File watch mode for development
  - Dependency-aware bundling

- **Two-Panel UI Architecture**
  - Table selection screen with card-based recent tables
  - Left panel: 3×3 player grid (fixed layout)
  - Right panel: Dynamic input cards (selected players only)
  - Immediate transition on table selection (no start button)

- **Modular Source Structure**
  - 7 CSS modules (tokens, reset, global, components, responsive, etc.)
  - 12 JavaScript modules (state management, services, UI modules)
  - 2 HTML view templates
  - Complete separation of concerns

- **Development Tools**
  - `npm run dev`: Auto-rebuild on file changes
  - `npm run build`: Development build (readable)
  - `npm run build:prod`: Production build (minified)
  - `npm run clean`: Clean build artifacts

- **Documentation**
  - [README.md](README.md): Project overview and quick start
  - [SETUP.md](SETUP.md): Installation and usage guide
  - [LLD-Build-System.md](docs/LLD-Build-System.md): Build system architecture
  - [PRD-Two-Panel-UI.md](docs/PRD-Two-Panel-UI.md): Product requirements (v3.0)
  - [LLD-Two-Panel-UI.md](docs/LLD-Two-Panel-UI.md): Technical design

#### Changed
- Migrated from monolithic HTML to modular architecture
- Improved mobile UX with responsive two-panel layout
- Enhanced table selection with recent tables and room grouping
- Optimized bundle size through minification

#### Technical Details
- **Build Performance**: 17ms (dev) / 908ms (prod)
- **File Size**: 28.40 KB (minified) vs 46.35 KB (readable)
- **Module Count**: 22 source files → 1 output file
- **Dependencies**: chokidar, clean-css, terser, html-minifier

#### Migration Path
1. Install: `npm install`
2. Develop: `npm run dev` (auto-rebuild)
3. Build: `npm run build:prod` (optimized)
4. Deploy: Copy `dist/page.html` to Apps Script

---

## Previous Versions

### [13.x] - Legacy
- Monolithic HTML architecture
- Single file development
- Manual optimization
