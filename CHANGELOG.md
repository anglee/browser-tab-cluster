# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
