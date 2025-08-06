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