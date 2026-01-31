# Chrome Tab Cluster Extension

A Chrome browser extension for managing tabs and windows, similar to TabCluster.io. Focuses on local tab/window management without cloud syncing.

## Features

- **Search/filter tabs** - Real-time filtering by title or URL with Enter to switch to first match
- **Close tabs/windows** - Close individual tabs or entire windows
- **Drag & drop reorder** - Reorder tabs within a window
- **Drag & drop between windows** - Move tabs from one window to another
- **Merge windows** - Combine 2+ selected windows into one
- **Sort tabs** - Organize tabs by domain or title
- **Deduplicate tabs** - Instantly remove duplicate tabs
- **Pin/Unpin tabs** - Pin indicator and toggle via context menu
- **Multi-select tabs** - Checkbox selection with bulk actions (move, close)
- **Keyboard navigation** - Tab through windows, arrow keys for tabs, Enter to activate
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
│   │   ├── DragOverlay.tsx
│   │   └── DuplicatesModal.tsx
│   ├── hooks/
│   │   ├── useWindows.ts  # Chrome windows API wrapper
│   │   ├── useSearch.ts   # Search/filter logic
│   │   └── useTheme.ts    # Theme toggle with persistence
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
```

Otherwise use npm directly:
```bash
npm install    # Install dependencies
npm run build  # Build to dist/
npm run dev    # Dev server
rm -rf dist    # Remove dist/
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
   - Select windows with checkboxes, then click merge icon to combine them
   - Click dedupe icon to remove duplicate tabs
   - Click sort icon to sort all windows by domain
   - Click sun/moon icon to toggle light/dark theme

### Keyboard Navigation

- **Tab** - Move focus between window cards
- **Arrow Up/Down** - Navigate tabs within a focused window
- **Enter** - Activate focused tab or window
- **Option+M / Alt+M** - Open Tab Cluster or focus search (selects existing text)

### Multi-Select Tabs

1. Hover over tabs to reveal checkboxes
2. Select 2+ tabs to show bulk actions button
3. Available actions: Move to New Window, Move to Window, Close All

## Keyboard Shortcut

The default shortcut to open Tab Cluster is **Option+M** (Mac) / **Alt+M** (Windows/Linux).

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

## Permissions

The extension requires:
- `tabs` - Access to tab information
- `windows` - Access to window management
- `<all_urls>` - For favicon access
