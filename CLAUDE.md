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

## Design Decisions

Key design decisions and their motivations:

### Search Behavior (mimics Chrome's Cmd+Shift+A)
- First matching tab is highlighted with dashed blue border as "candidate"
- Pressing Enter in search box switches to that first match immediately
- Focus returns to search input when window gains focus or shortcut is pressed
- Existing search text is auto-selected so user can type to replace it

### No Confirmation Dialogs
- Dedupe action executes immediately without confirmation modal
- Rationale: Faster workflow; user can undo by reopening tabs if needed

### Merge Windows Behavior
- When merging, if current window (containing Tab Cluster) is selected, it becomes the target
- Rationale: Keeps Tab Cluster visible after merge operation

### Masonry Layout
- Window cards use CSS columns layout instead of grid
- Rationale: Better space utilization, avoids gaps, similar to TabCluster.io

### Keyboard Navigation
- Tab key cycles through window cards (not individual tabs or buttons)
- Arrow keys navigate tabs within a focused window card
- Toolbar buttons have `tabIndex={-1}` to skip them in tab order
- Rationale: Efficient navigation without excessive tab stops

### Multi-Select Tabs
- Checkboxes appear on hover, stay visible when checked
- Bulk actions button appears only when 2+ tabs selected
- Available actions: Move to New Window, Move to Window, Close All (no Pin All)
- Rationale: Batch operations for power users

### Icons
- Uses @ant-design/icons instead of inline SVGs
- Rationale: Consistent icon style, easier to maintain and swap icons
