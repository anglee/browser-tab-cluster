# Claude Agent Instructions

Read `README.md` for project overview, structure, and usage documentation.

## Quick Reference

### Build & Test

If `just` is installed:
```bash
just install   # Install dependencies
just build     # Build to dist/
just dev       # Dev server (limited use for extensions)
just clean     # Remove dist/
just rebuild   # Clean + build
```

Otherwise use npm directly:
```bash
npm install    # Install dependencies
npm run build  # Build to dist/
npm run dev    # Dev server (limited use for extensions)
rm -rf dist    # Remove dist/
```

### Key Files
- `src/manager/App.tsx` - Main application component
- `src/components/` - UI components (Toolbar, WindowCard, TabItem)
- `src/services/chromeApi.ts` - Chrome API wrappers
- `src/services/tabOperations.ts` - Business logic (merge, sort, dedupe)
- `src/hooks/` - React hooks for state management
- `public/manifest.json` - Chrome extension manifest
- `public/background.js` - Service worker for keyboard shortcuts

### Architecture Notes
- Uses Chrome Extension Manifest V3
- Entry points: `src/manager/` (full page) and `src/popup/` (toolbar popup)
- Theme state persisted to localStorage
- Real-time updates via Chrome event listeners in `useWindows` hook
- Drag & drop via @dnd-kit library
- Icons via @ant-design/icons

### Build Output
The `vite.config.ts` has a custom plugin to fix HTML paths after build. Output structure:
```
dist/
├── manifest.json
├── icons/
├── manager/index.html, manager.js
├── popup/index.html, popup.js
└── assets/
```

### Testing Changes
After making changes, run `npm run build` and reload the extension at `chrome://extensions`.
