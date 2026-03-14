# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-03-14

### Added
- Tri-state select all checkbox in card headers with click-to-toggle on count label
- Custom Checkbox component with proper dark mode styling
- Unit tests for `normalizeUrl` function
- "tabs" label added to card header counts and submenu window items

### Changed
- Window card header click now collapses/expands (consistent with recently closed card); window title text switches window
- Bulk actions button uses mist color scheme instead of blue
- Card header tooltips positioned above buttons
- "Close All Tabs" and "Hide Selected" labels now include selected count
- Dark mode text softened: card titles `mist-300`, tab names `mist-400`
- Toolbar stats and card counts use lowercase ("windows", "tabs")

### Fixed
- Window card collapsing unexpectedly after bulk action from menu
- Dedup incorrectly treating hash-routed SPA pages as duplicates
- Checkbox in dark mode now has dark background when unchecked

## [1.2.1] - 2026-03-11

### Fixed
- ESC key not clearing search when no results match
- Arrow key navigation into Recently Closed card when it's the only visible card during search

## [1.2.0] - 2026-02-08

### Added
- Keyboard shortcut hint displayed as styled key badges in search box
- Right arrow navigation from search input to next card
- Documentation link in toolbar

### Fixed
- Version tags now pushed correctly to remote (`git push --follow-tags` requires annotated tags)

## [1.1.0] - 2026-02-04

### Added
- Vim-style keyboard navigation with Ctrl+h/j/k/l (left/down/up/right)
- Version bump script that commits and tags releases
- Chrome Web Store zip packaging script

### Changed
- Reduced extension permissions (removed unnecessary `windows` and `host_permissions`)
- Updated privacy policy to reflect current permissions and data handling

## [1.0.0] - 2026-02-03

Initial release with core tab management features:
- Search and filter tabs by title or URL
- Drag and drop to reorder tabs within and between windows
- Merge multiple windows into one
- Sort tabs by domain
- Deduplicate tabs across windows
- View and restore recently closed tabs
- Multi-select tabs with bulk actions
- Keyboard navigation
- Collapsible window cards with masonry layout
- Light/dark theme support
