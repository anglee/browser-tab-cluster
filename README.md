# Chrome Tab Cluster Extension

A Chrome browser extension for managing tabs and windows, similar to TabCluster.io. Focuses on local tab/window management without cloud syncing.

## Features

- **Search/filter tabs** - Real-time filtering by title or URL with Enter to switch to first match
- **Recently closed tabs** - View and restore recently closed tabs with multiple restore options
- **Close tabs/windows** - Close individual tabs or entire windows
- **Drag & drop reorder** - Reorder tabs within a window
- **Drag & drop between windows** - Move tabs from one window to another
- **Merge windows** - Click merge icon to open popover, select windows, and combine them
- **Sort tabs** - Organize tabs by domain or title
- **Deduplicate tabs** - Instantly remove duplicate tabs
- **Pin/Unpin tabs** - Pin indicator and toggle via context menu
- **Multi-select tabs** - Checkbox selection with bulk actions (move, close)
- **Keyboard navigation** - Tab through windows, arrow keys for tabs, Enter to activate
- **Click window name** - Click window name in card header to switch to that window
- **Collapsible cards** - Collapse/expand individual cards or all at once
- **Light/Dark theme** - Toggle theme with persistence

## Tech Stack

- **React 18** - UI components with hooks
- **TypeScript** - Type safety
- **Vite** - Build tool with HMR
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag and drop
- **@ant-design/icons** - Icon components
- **Chrome Extension Manifest V3**

## Project Structure

```
├── public/
│   ├── manifest.json      # Chrome extension manifest
│   ├── background.js      # Service worker for shortcuts
│   └── icons/             # Extension icons
├── src/
│   ├── components/        # React components
│   │   ├── Toolbar.tsx    # Top toolbar with actions
│   │   ├── WindowCard.tsx # Window container
│   │   ├── TabItem.tsx    # Individual tab row
│   │   ├── RecentlyClosedCard.tsx # Recently closed tabs card
│   │   ├── ClosedTabItem.tsx      # Individual closed tab row
│   │   ├── Tooltip.tsx    # CSS-only tooltip component
│   │   ├── Submenu.tsx    # Reusable submenu component
│   │   ├── DragOverlay.tsx
│   │   └── DuplicatesModal.tsx
│   ├── hooks/
│   │   ├── useWindows.ts  # Chrome windows API wrapper
│   │   ├── useRecentlyClosed.ts # Chrome sessions API wrapper
│   │   ├── useSearch.ts   # Search/filter logic
│   │   ├── useTheme.ts    # Theme toggle with persistence
│   │   ├── useMasonry.ts  # Shortest-column-first layout algorithm
│   │   └── useColumnCount.ts # Responsive column count
│   ├── services/
│   │   ├── chromeApi.ts   # Chrome API abstractions
│   │   └── tabOperations.ts # Tab manipulation functions
│   ├── types/
│   │   └── index.ts       # TypeScript interfaces
│   ├── manager/           # Main tab cluster page
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   └── popup/             # Extension popup
│       ├── Popup.tsx
│       ├── main.tsx
│       └── index.html
├── scripts/
│   ├── bump.js           # Version bump script
│   └── zip.js            # Chrome Web Store zip script
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Development

### Prerequisites

- Node.js 18+
- npm
- (Optional) [just](https://github.com/casey/just) - command runner

### Setup & Build

If `just` is installed:
```bash
just install   # Install dependencies
just build     # Build to dist/
just dev       # Dev server
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
npm run dev              # Dev server
rm -rf dist              # Remove dist/
npm run bump -- patch    # Bump version, commit, and tag
npm run zip              # Create zip (run after build)
```

Note: For extension development, you'll need to build and reload the extension in Chrome after changes.

## Loading the Extension

1. Run `npm run build`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder

## Usage

1. Click the extension icon in Chrome toolbar, then "Open Tab Cluster"
2. Or use the keyboard shortcut: **Option+M** (Mac) / **Alt+M** (Windows/Linux)
3. Use the toolbar buttons to:
   - Search tabs by typing in the search box (Enter switches to first match)
   - Click merge icon to select windows and combine them
   - Click dedupe icon to remove duplicate tabs
   - Click sort icon to sort all windows by domain
   - Click collapse/expand icon to collapse or expand all cards
   - Click sun/moon icon to toggle light/dark theme

### Keyboard Navigation

- **Tab** - Move focus between window cards
- **Arrow Up/Down** - Navigate tabs within a focused window
- **Arrow Left/Right** - Navigate between window cards
- **Ctrl+h/j/k/l** - Vim-style navigation (left/down/up/right)
- **Enter** - Activate focused tab or window
- **Escape** - Clear search and focus search input
- **Option+M / Alt+M** - Open Tab Cluster or focus search (selects existing text)

### Multi-Select Tabs

1. Hover over tabs to reveal checkboxes
2. Select 2+ tabs to show bulk actions button
3. Available actions: Move to New Window, Move to Window, Close All

## Keyboard Shortcut

The default shortcut to open Tab Cluster is **Option+M** (Mac) / **Alt+M** (Windows/Linux).

When triggered, the shortcut:
- Opens Tab Cluster in the currently focused window (or moves it there if already open)
- Pins the Tab Cluster tab for quick access
- Focuses the search input with existing text selected

To customize the shortcut:
1. Go to `chrome://extensions/shortcuts`
2. Find "Tab Cluster"
3. Click the pencil icon next to "Open Tab Cluster"
4. Press your desired key combination

## Chrome APIs Used

- `chrome.windows.getAll()` - Get all windows
- `chrome.windows.create()` - Create new window
- `chrome.windows.remove()` - Close window
- `chrome.tabs.query()` - Get tabs
- `chrome.tabs.move()` - Move/reorder tabs
- `chrome.tabs.remove()` - Close tabs
- `chrome.tabs.update()` - Activate tab
- `chrome.tabs.onCreated/onRemoved/onUpdated` - Real-time updates
- `chrome.sessions.getRecentlyClosed()` - Get recently closed tabs
- `chrome.sessions.restore()` - Restore closed tabs
- `chrome.sessions.onChanged` - Recently closed list updates

## Permissions

The extension requires:
- `tabs` - Access to tab information (title, URL, favicon)
- `sessions` - Access to recently closed tabs
