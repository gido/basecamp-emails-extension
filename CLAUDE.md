# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension (Firefox & Chrome compatible) that adds a small interface to Basecamp for searching email addresses of all team users. The extension leverages Basecamp's existing autocompletables API to fetch user data.

## Development Setup

Since this project is in its initial state, the following steps will likely be needed:

### Initial Project Setup
- Initialize package.json with web extension dependencies
- Set up manifest.json (manifest v3 for Chrome, compatible with Firefox)
- Create source directory structure for content scripts and UI
- Configure build tools for cross-browser compatibility
- Set up TypeScript configuration for better development experience

### Extension Structure
```
src/
├── manifest.json          # Extension manifest (v3)
├── content/              # Content scripts injected into Basecamp pages
│   ├── main.js           # Main content script
│   └── ui.js             # UI components for search interface
├── popup/                # Extension popup (optional)
└── assets/               # CSS, icons, etc.
```

## Core Functionality

### Basecamp API Integration
The extension uses Basecamp's autocompletables API:
- **Endpoint**: `https://3.basecamp.com/{account_id}/autocompletables/buckets/{bucket_id}/people`
- **Parameters**: `?include_groups=true&mentionable=true&people_scope=team_users`
- **Authentication**: Uses current user's session cookies automatically
- **Headers**: Requires proper CSRF token and referrer headers

### Key Technical Requirements
- **Cross-browser compatibility**: Works on both Firefox and Chrome
- **Content script injection**: Adds search interface to Basecamp pages
- **Cookie-based auth**: Leverages existing user session, no additional login
- **CSRF handling**: Must extract and use CSRF tokens from page
- **Dynamic bucket detection**: Extract account_id and bucket_id from current URL

### Development Commands
Once the project is set up, common commands will include:
- Build: `npm run build` - Build extension for production
- Development: `npm run dev` - Build with watch mode for development
- Package: `npm run package` - Create .zip files for store submission
- Testing: `npm test` - Run unit tests
- Linting: `npm run lint` - Check code quality

### Publishing & Release Commands
The project includes automated versioning and packaging:
- `npm run package:store` - Create zip for Chrome Web Store (current version)
- `npm run prepare-release` - Bump version + create versioned release zip
- `npm run version:patch` - Bump patch version (1.0.0 → 1.0.1) 
- `npm run version:minor` - Bump minor version (1.0.0 → 1.1.0)
- `npm run version:major` - Bump major version (1.0.0 → 2.0.0)

Version sync utility (`scripts/sync-manifest-version.js`) ensures package.json and manifest.json versions stay synchronized.

## Implementation Details

### URL Pattern Detection
The extension should activate on Basecamp URLs matching:
- `https://*.basecamp.com/*` or `https://3.basecamp.com/*`

### Data Extraction from Current Page
- **Account ID**: Extract from URL path (e.g., `/3096442/`)
- **Bucket ID**: Extract from URL path (e.g., `/buckets/35640917/`)
- **CSRF Token**: Extract from `<meta name="csrf-token">` or cookies
- **Session Cookies**: Automatically included in same-origin requests

### API Request Headers (Essential)
```javascript
{
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'X-CSRF-Token': '[extracted-csrf-token]',
  'X-Fetch-Type': 'native'
}
```

### Response Data Structure
The API returns user objects with properties like:
- `id`: User ID
- `name`: Display name
- `email`: Email address (primary goal)
- `avatar_url`: Profile picture
- `title`: Job title/role

## Architecture Considerations

### Content Script Strategy
- Inject a small search widget into Basecamp pages
- Position it non-intrusively (corner, sidebar, or floating)
- Use shadow DOM to avoid CSS conflicts with Basecamp
- Debounce search queries to avoid API spam

### State Management
- Cache user data temporarily to reduce API calls
- Store search history in local storage (optional)
- Handle authentication state changes gracefully

### Error Handling
- Graceful degradation when API is unavailable
- Handle CSRF token expiration
- Provide user feedback for network errors

## Recent Developments (Latest Session)

### 🎨 UI/UX Overhaul - Native Basecamp Styling
The extension has been completely redesigned to use Basecamp's native jump menu styling instead of custom modal components:

**Key Changes:**
- **Replaced custom modal** with Basecamp's `modal-sheet` and `jump-menu` classes
- **Single-row layout** matching Basecamp's original design (name + email on same line)
- **Removed custom HTML elements** (`bc-*` tags) in favor of standard HTML
- **60% CSS reduction** (3.24 KiB → 1.79 KiB) by removing unused styles

### 📸 Avatar Integration
Added dynamic profile photo support:
- **24px circular avatars** using `avatar_url` from API response
- **Smart fallbacks** to colored project icons when no avatar available
- **Custom CSS classes** (`basecamp-email-avatar`) to avoid conflicts
- **Proper alignment** with flexbox centering and padding overrides
- **Performance optimizations** with lazy loading and accessibility features

### 🧹 Code Quality Improvements
Major cleanup and optimization efforts:
- **Removed 17 console.log statements** for cleaner production output
- **Eliminated unused CSS classes** (modal headers, old result styling, etc.)
- **Safe CSS overrides** using scoped selectors to avoid breaking Basecamp's styling
- **Fixed click handling** with preventDefault/stopPropagation to prevent modal closing

### 🚀 Technical Architecture
**Current Implementation:**
- Uses Basecamp's existing CSS framework for consistent styling
- Content script creates modal with `basecamp-email-modal-overlay` for positioning
- Results use native `jump-menu__result` and `jump-menu__link` classes
- Custom classes only for extension-specific functionality (avatars, copy feedback)

**Performance Benefits:**
- Smaller bundle size (net reduction of 92 lines of code)
- Leverages Basecamp's optimized CSS instead of duplicating styles
- Faster loading with lazy-loaded avatars
- Reduced DOM manipulation and console output

## Memories
- **UI Redesign Complete**: Extension now uses native Basecamp styling for seamless integration
- **Avatar Support Added**: Dynamic profile photos with smart fallbacks  
- **Major Code Cleanup**: 60% CSS reduction and removed debug logging
- **Production Build System**: Automated versioning and Chrome Web Store packaging
- **Ready for Production**: Clean, optimized codebase pushed to GitHub
- **Publishing Ready**: Version 1.0.2 with complete build/release pipeline
- Remember, sadly you can't use Playwright to load and test extension

### Latest Status (Current Session)
- **Version**: 1.0.2 (automatically synced between package.json and manifest.json)
- **Build System**: Complete with versioned releases and store-ready packages
- **File Structure**: Clean organization with scripts/, releases/, and optimized dist/
- **GitHub Repository**: https://github.com/gido/basecamp-emails-extension.git
- **Package Files**: 
  - `basecamp-email-extension.zip` (18.5 KB) - Chrome Web Store ready
  - `releases/basecamp-email-extension-v1.0.2.zip` - Versioned release