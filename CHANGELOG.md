# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- Removed unused popup.html file and popup directory
- Removed popup action from manifest.json as extension only uses content scripts

## [1.0.5] - 2024-08-08

### Fixed
- Fixed modal positioning bug where modal would become left-aligned when reopening
- Fixed search field behavior to show all team members when input is cleared instead of empty state
- Fixed duplicate button bug during SPA navigation by adding unique class detection

### Added
- Added automatic focus to search input field when modal opens for immediate typing
- Added unique CSS class `basecamp-email-search-button` for reliable button identification

### Changed
- Improved search performance by removing unnecessary 300ms debounce delay for instant local filtering
- Removed "Searching..." loading indicator since search is now instant on cached data

## [1.0.4] - 2024-08-08

### Fixed
- Fixed Firefox security warnings by replacing all innerHTML usage with safe DOM manipulation methods

### Added
- Added source code packaging script for Firefox Add-ons submission
- Added helper functions for secure DOM operations (createSafeElement, clearElement)

### Changed
- Improved build system with automated source code packaging
- Enhanced XSS protection throughout the extension

## [1.0.3] - 2024-08-07

### Added
- Added avatar photos to team member display with 24px circular avatars
- Added production build system with version management
- Added automated icon generation and screenshot preparation scripts
- Added cross-browser packaging scripts for Chrome and Firefox

### Fixed
- Fixed horizontal alignment issues with avatars by overriding Basecamp's padding
- Fixed avatar fallback to colored icons when no photo available

### Changed
- Updated build pipeline with comprehensive npm scripts
- Updated documentation with production deployment instructions

## [1.0.2] - 2024-08-07

### Fixed
- Removed unused CSS classes and reduced stylesheet size by 60%
- Removed unnecessary console.log statements for production readiness

### Changed
- Cleaned up codebase for better maintainability
- Optimized CSS for production deployment

## [1.0.1] - 2024-08-07

### Changed
- Redesigned popup modal to match Basecamp's native jump menu styling
- Replaced custom HTML elements with standard elements using Basecamp CSS classes
- Improved visual consistency with Basecamp's design system

### Fixed
- Fixed modal closing issues when clicking on email addresses
- Fixed copy feedback mechanism for better user experience

## [1.0.0] - 2024-08-07

### Added
- Initial release of Basecamp Email Search extension
- Modal-based email search interface for Basecamp project pages
- Integration with Basecamp's autocompletables API
- Support for both Chrome and Firefox browsers
- Real-time search and filtering of team members
- One-click email copying to clipboard with visual feedback
- Cross-origin request handling with proper CSRF token management
- SPA navigation support for Basecamp's Turbo transitions
- Responsive design matching Basecamp's UI patterns

### Security
- Implemented proper CSRF token extraction and usage
- Added secure cookie-based authentication
- Followed browser extension security best practices