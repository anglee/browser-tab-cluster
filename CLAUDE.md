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
just bump <major|minor|patch>  # Bump version, commit, and tag
just push      # Push commits and tags to remote
just zip       # Build and create zip for Chrome Web Store
```

Otherwise use npm directly:
```bash
npm install              # Install dependencies
npm run build            # Build to dist/
npm run dev              # Dev server (limited use for extensions)
rm -rf dist              # Remove dist/
npm run bump -- patch    # Bump version, commit, and tag
npm run zip              # Create zip (run after build)
```

### Key Files
- `src/manager/App.tsx` - Main application component
- `src/components/` - UI components (Toolbar, WindowCard, TabItem, RecentlyClosedCard, Tooltip, Submenu)
- `src/services/chromeApi.ts` - Chrome API wrappers (windows, tabs, sessions)
- `src/services/tabOperations.ts` - Business logic (merge, sort, dedupe)
- `src/hooks/useWindows.ts` - Windows/tabs state with real-time updates
- `src/hooks/useRecentlyClosed.ts` - Recently closed tabs via sessions API
- `src/hooks/useTheme.ts` - Theme persistence to localStorage
- `src/hooks/useMasonry.ts` - Shortest-column-first layout algorithm
- `src/hooks/useColumnCount.ts` - Responsive column count (1/2/3 based on viewport)
- `public/manifest.json` - Chrome extension manifest
- `public/background.js` - Service worker for keyboard shortcuts
- `scripts/bump.js` - Version bump script (updates package.json and manifest.json, commits, and tags)
- `scripts/zip.js` - Creates zip for Chrome Web Store submission

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
- Click merge button in toolbar to open popover with window list
- Select 2+ windows via checkboxes, then click "Merge Selected"
- If current window (containing Tab Cluster) is selected, it becomes the target
- After merge, Tab Cluster stays focused (doesn't switch to merged window)
- Rationale: Keeps Tab Cluster visible and accessible during workflow

### Masonry Layout
- Uses JavaScript-based "shortest-column-first" algorithm (not CSS columns)
- Each card is placed in whichever column currently has the smallest cumulative height
- Height is estimated using: header height + (tab count × tab row height)
- Responsive: 1 column (<768px), 2 columns (768-1535px), 3 columns (≥1536px)
- Implementation: `useMasonry` hook distributes items, `useColumnCount` tracks responsive breakpoints
- Rationale: Optimal space utilization, predictable card placement

### Keyboard Navigation
- Tab key cycles through window cards (not individual tabs or buttons)
- Arrow keys navigate tabs within a focused window card
- Ctrl+h/j/k/l for vim-style navigation (left/down/up/right)
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

### Recently Closed Tabs
- Limited to 30 tabs maximum (Chrome sessions API returns up to 25 sessions, but closed windows can contain many tabs)
- Chrome sessions API doesn't support deletion, so "Hide" stores session IDs in localStorage
- Hidden IDs are capped at 1000 entries to prevent unbounded growth
- Auto-cleanup removes stale IDs when sessions expire or are restored
- Rationale: Provides expected "delete" UX despite API limitation

### Card Ordering
- Current (focused) window is always sorted first, appearing at top of first column
- Recently Closed card is placed at top of last column in multi-column layouts
- In single-column layout, Recently Closed appears at bottom
- Rationale: Current window is most relevant; Recently Closed is secondary

### Collapsible Cards
- Each card has a collapse toggle button (rightmost in header)
- Collapsed cards show only the header
- Collapse All / Expand All button in toolbar
- "Expand All" shown only when ALL cards are collapsed
- Collapsing doesn't change card positions (layout uses expanded heights)
- Icon animates rotation on collapse/expand
- Rationale: Reduces visual clutter while maintaining spatial consistency

### Keyboard Shortcut Behavior
- Option+M opens Tab Cluster in the currently focused window and pins it
- If Tab Cluster exists in another window, it moves to the focused window
- Rationale: Tab Cluster stays accessible in whichever window user is working

### Tooltips
- CSS-only implementation with 300ms delay using Tailwind
- Uses named groups (`group/tooltip`) to avoid conflicts with parent hover states
- Rationale: Lightweight, no JS overhead, consistent delay

### Search Mode UI
- Hides card action buttons during search (sort, dedupe, close window, restore all, clear all)
- Rationale: These actions don't make sense on filtered results; cleaner UI during search
