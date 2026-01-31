# Chrome Tab Cluster Extension

A Chrome browser extension for managing tabs and windows, similar to TabCluster.io. Focuses on local tab/window management without cloud syncing.

## Features

- **Search/filter tabs** - Real-time filtering by title or URL
- **Close tabs/windows** - Close individual tabs or entire windows
- **Drag & drop reorder** - Reorder tabs within a window
- **Drag & drop between windows** - Move tabs from one window to another
- **Merge windows** - Combine 2+ selected windows into one
- **Sort tabs** - Organize tabs by domain or title
- **Deduplicate tabs** - Find and remove duplicate tabs with confirmation
- **Light/Dark theme** - Toggle theme with persistence

## Tech Stack

- **React 18** - UI components with hooks
- **TypeScript** - Type safety
- **Vite** - Build tool with HMR
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag and drop
- **Chrome Extension Manifest V3**

## Project Structure

```
├── public/
│   ├── manifest.json      # Chrome extension manifest
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

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

This outputs to `dist/` folder.

### Development Mode

```bash
npm run dev
```

Note: For extension development, you'll need to build and reload the extension in Chrome after changes.

## Loading the Extension

1. Run `npm run build`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder

## Usage

1. Click the extension icon in Chrome toolbar
2. Click "Open Tab Cluster" to open the full manager page
3. Use the toolbar buttons to:
   - Search tabs by typing in the search box
   - Select windows with checkboxes, then click merge icon to combine them
   - Click dedupe icon to find and remove duplicate tabs
   - Click sort icon to sort all windows by domain
   - Click sun/moon icon to toggle light/dark theme

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
