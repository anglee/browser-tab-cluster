# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-08-03

### Added
- Toolbar toggle (history icon) to show/hide the Recently Closed card;
  preference is remembered. While hidden, closed tabs are excluded from
  search results and keyboard navigation, but close-tracking continues
  so the history is intact when re-enabled

## [1.6.0] - 2026-07-23

### Added
- Recently Closed history now extends beyond Chrome's ~25-session limit: tab closes
  are recorded to a local log (up to 1000 entries) and merged with the sessions API.
  Recent entries keep full-fidelity session restore; older ones reopen by URL
- "Show more" in the Recently Closed card reveals older entries 30 at a time;
  search covers the entire merged history
- Recently closed entries from the log support real deletion, and "Clear All"
  now actually clears the history
- "Reload" option in the tab menu

### Changed
- Added the `storage` permission for the local closed-tab log (all data stays
  on-device; no user-facing permission warning)

## [1.5.1] - 2026-03-22

### Changed
- Clicking window card header now switches to that window instead of collapsing/expanding the card

## [1.5.0] - 2026-03-22

### Added
- Replace custom Tooltip and Menu with Ant Design components (ConfigProvider, Dropdown, Menu)
- Group actions button in card header when all tabs of a group are selected (Move to New Window, Move to Window, Merge with Group, Rename Group, Ungroup, Close Group)
- "Rename Group" modal with color picker
- "Move to New Group" modal with name input and color picker
- "Remove from Group" in individual tab context menu (when tab is grouped)
- "Remove from Group(s)" in bulk actions menu (when all selected tabs are grouped)
- "Go to group" dropdown in toolbar to switch to a group's first tab
- Search now matches against tab group names
- Group color bar corners rounded based on group boundaries (first/last in group)
- Group bar tooltip shows select/deselect hint

### Changed
- Bulk actions button now appears when 1+ tabs selected (was 2+)
- Group button replaces bulk actions button when selected tabs exactly match a group
- Submenu window items show tab count right-aligned, matching merge menu layout
- Card header buttons use antd Button for visual consistency
- Tooltip dismissed when dropdown menu opens
- Singularize "tab" in actions tooltip when count is 1
- Skip custom keyboard handler when antd modal is open

### Fixed
- Group match check uses unfiltered window tabs so search doesn't cause false matches
- Group bar click selects only visible (filtered) tabs during search
- Dropdown menu clicks no longer toggle card collapse/expand

## [1.4.0] - 2026-03-22

### Added
- Tab group indicator: colored bar on left edge of grouped tabs with tooltip showing group name
- Click group indicator to toggle-select all tabs in that group
- "Move to Group" submenu in individual tab context menu and bulk actions menu
- "Create New Group" in bulk actions menu with auto-naming ("Tab Group N")
- `tabGroups` permission and real-time updates via Chrome tab group events

### Changed
- Tab group colors use official Chromium palette values with light/dark mode variants

## [1.3.2] - 2026-03-22

### Changed
- Remove parentheses from card header tab count display
- Revert bulk actions button color back to blue
- Enlarge checkbox click zone for better Fitts' law targeting

### Fixed
- Search now covers all recently closed tabs from Chrome's 25 sessions, not just the first 30; display is still capped at 30

## [1.3.1] - 2026-03-14

### Fixed
- Submenu dismissing when mouse crosses gap between menu and submenu

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
