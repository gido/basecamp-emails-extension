# Basecamp Email Search Extension

A browser extension that adds a convenient email search modal to Basecamp project pages, allowing you to quickly find and copy team members' email addresses with just one click.

![Extension Demo](https://img.shields.io/badge/Browser-Firefox%20%7C%20Chrome-blue)
![Version](https://img.shields.io/badge/Version-1.0.2-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🔍 **Real-time Search**: Instant search results as you type (name, email, or title)
- 📧 **One-click Copy**: Click any result to copy email address to clipboard
- 📸 **Profile Photos**: 24px circular avatars for easy team member identification
- 🎨 **Native Basecamp Styling**: Seamlessly integrated using Basecamp's jump menu design
- 🎯 **Smart Integration**: Button appears only on project homepages next to "Set up people"
- 🔒 **Secure Authentication**: Uses your existing Basecamp session, no additional login
- ⚡ **Fast Performance**: Debounced search with local caching, 60% smaller CSS bundle
- ⌨️ **Keyboard Support**: ESC key to close, click outside to dismiss
- 🌐 **Cross-browser**: Full support for Firefox and Chrome (Manifest V3)

## 📦 Installation

### Prerequisites
- **Node.js** (v20 or higher)
- **npm** or **yarn**

### Quick Setup

1. **Clone and build**:
   ```bash
   git clone <repository-url>
   cd basecamp-emails-extension
   npm install
   npm run build
   ```

### Browser Installation

#### Firefox (Recommended)
1. **Open Firefox** and navigate to `about:debugging`
2. **Click "This Firefox"** in the left sidebar
3. **Click "Load Temporary Add-on..."**
4. **Navigate to the `dist` folder** and select `manifest.json`
5. **Visit any Basecamp page** - the extension widget will appear automatically

#### Chrome/Edge
1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top-right corner)
3. **Click "Load unpacked"**
4. **Select the entire `dist` folder**
5. **Visit any Basecamp page** - the extension widget will appear automatically

### Verification
- Navigate to any Basecamp project homepage (e.g., `https://3.basecamp.com/your-account/projects/123456/`)
- Look for the "📧 See Emails" button next to "Set up people"
- If it doesn't appear, check the browser console (F12) for errors

## 🚀 Usage

### Basic Search
1. **Navigate** to a Basecamp project homepage
2. **Find the button** - The "📧 See Emails" button appears next to "Set up people"
3. **Click to open** - Modal opens with all team members loaded automatically
4. **Start typing** - Search by name, email, or job title in the search field
5. **View results** - Team members matching your query appear instantly
6. **Copy email** - Click any result to copy the email address to clipboard
7. **Success feedback** - "Copied to clipboard!" message confirms the action

### Search Examples
- **By name**: "marc", "gilles", "susana" 
- **By email domain**: "antistatique", "gmail"
- **By title**: "developer", "manager", "designer"
- **Partial matches**: "mar" finds "Marc Friederich"

### Modal Controls  
- **Close modal**: Click the "×" button or click outside the modal
- **Clear search**: Delete text to show all team members again
- **Keyboard shortcuts**: Press ESC to close modal

### Keyboard Shortcuts
- **ESC**: Close the modal
- **Click outside**: Close the modal by clicking the dark overlay

## 🛠️ Development  

### Available Scripts

```bash
# Development
npm run build           # Build extension for production
npm run dev            # Build with watch mode for development
npm run lint           # Check code quality with ESLint  
npm test              # Run unit tests

# Publishing & Releases
npm run package:store   # Create zip for Chrome Web Store (current version)
npm run prepare-release # Bump version + create versioned release zip
npm run version:patch   # Bump patch version (1.0.0 → 1.0.1)
npm run version:minor   # Bump minor version (1.0.0 → 1.1.0)  
npm run version:major   # Bump major version (1.0.0 → 2.0.0)

# Legacy packaging (separate Chrome/Firefox zips)
npm run package        # Build and create both Chrome/Firefox packages
npm run package:chrome # Create Chrome-specific package
npm run package:firefox # Create Firefox-specific package
```

### Publishing Workflow

#### Chrome Web Store Submission
```bash
# Quick package for immediate submission
npm run package:store
# → Creates: basecamp-email-extension.zip (ready for Chrome Web Store)
```

#### Versioned Releases
```bash  
# Create new release with automatic version bump
npm run prepare-release
# → Bumps version: 1.0.1 → 1.0.2
# → Syncs package.json ↔ manifest.json versions  
# → Creates: releases/basecamp-email-extension-v1.0.2.zip
```

### Project Structure

```
basecamp-emails-extension/
├── src/
│   ├── content/
│   │   └── main.js          # Main content script with search logic
│   ├── assets/
│   │   ├── styles.css       # Minimal custom styles (1.79 KiB)
│   │   ├── icon-16.png      # Extension icon (16x16)
│   │   ├── icon-48.png      # Extension icon (48x48)  
│   │   └── icon-128.png     # Extension icon (128x128)
│   ├── popup/
│   │   └── popup.html       # Extension popup with Basecamp styling
│   └── manifest.json        # Extension manifest (v3)
├── scripts/
│   └── sync-manifest-version.js  # Version sync utility
├── releases/                # Versioned release packages
├── dist/                    # Built extension files  
├── webpack.config.js        # Webpack build configuration
├── package.json            # Dependencies and scripts
└── README.md              # This documentation
```

### Architecture

The extension consists of:

1. **Content Script** (`main.js`): Injected into Basecamp project pages
   - Detects Basecamp project homepages
   - Creates and manages the "See Emails" button and modal
   - Handles API requests to Basecamp
   - Manages clipboard operations and modal interactions

2. **Manifest** (`manifest.json`): Extension configuration
   - Defines permissions and content script injection
   - Configures icons and metadata
   - Sets up browser compatibility

3. **Styles** (`styles.css`): Modal and button appearance  
   - Modern modal overlay design
   - Responsive layout and typography
   - Smooth animations and transitions

## ⚙️ How It Works

### Technical Overview

The extension leverages Basecamp's internal API to provide email search functionality:

1. **Page Detection**: Monitors for `*.basecamp.com` project pages
2. **Button Injection**: Adds "See Emails" button to project-avatars section
3. **URL Analysis**: Extracts account ID and project ID from current URL
   ```
   https://3.basecamp.com/[ACCOUNT_ID]/projects/[PROJECT_ID]/
   https://app.basecamp.com/[ACCOUNT_ID]/projects/[PROJECT_ID]/
   ```
4. **Authentication**: Retrieves CSRF token from page meta tags
5. **API Integration**: Queries Basecamp's autocompletables endpoint
6. **Modal Display**: Shows all team members in a searchable modal
7. **Data Processing**: Filters and displays user information locally
8. **Clipboard Integration**: Uses modern Clipboard API for one-click copying

### API Details

**Endpoint**: `https://{3|app}.basecamp.com/{account_id}/autocompletables/buckets/{project_id}/people`

> The extension works on both the legacy `3.basecamp.com` domain and the new `app.basecamp.com` domain. The request is always sent to the current page's origin.

**Parameters**:
- `mentionable=true` - Include mentionable users (excludes groups automatically)

**Headers**:
```javascript
{
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest', 
  'X-CSRF-Token': '[extracted-from-page]',
  'X-Fetch-Type': 'native'
}
```

**Response Format**:
```javascript
[
  {
    "type": "person",
    "name": "John Doe", 
    "email_address": "john@example.org",
    "title": "🚀",
    "avatar_url": "...",
    "company_name": "Acme SA"
  }
]
```

### Security Features

- **Session-based Authentication**: No additional login required
- **CSRF Protection**: Uses proper CSRF tokens for all requests  
- **Same-origin Requests**: Only communicates with Basecamp servers
- **No Data Storage**: Doesn't persist or transmit personal information
- **Local Processing**: All search and filtering happens client-side

## 🐛 Troubleshooting

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Button not appearing** | "See Emails" button missing | Verify you're on a project homepage (not bucket/message page)<br/>Check browser console (F12) for errors<br/>Reload extension in browser settings |
| **Modal not opening** | Button present but modal doesn't open | Check browser console for JavaScript errors<br/>Reload the page |
| **No search results** | "Loading..." never completes | Verify you're on a project page with team members<br/>Check Network tab for failed API calls |
| **"No email" displayed** | Names show but emails are blank | API may not return emails due to privacy settings<br/>Try different users or contact admin |
| **CSRF token errors** | Console shows authentication errors | Refresh the Basecamp page<br/>Clear browser cache and cookies |
| **Clipboard not working** | No "copied" feedback | Check browser clipboard permissions<br/>Try manually selecting and copying |

### Debug Steps

1. **Open Developer Tools** (F12)  
2. **Check Console tab** for JavaScript errors
3. **Monitor Network tab** for API requests to `/autocompletables/`
4. **Verify extension is loaded** in browser settings
5. **Test on different Basecamp project pages** (ensure you're on project homepages)

### Browser Compatibility

- ✅ **Firefox 91+**: Full support (recommended)
- ✅ **Chrome 88+**: Full support  
- ✅ **Edge 88+**: Should work (untested)
- ❌ **Safari**: Not supported (different extension system)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/basecamp-emails-extension.git
   cd basecamp-emails-extension
   npm install
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-amazing-feature
   ```

### Code Guidelines

- **ES6+ JavaScript**: Use modern JavaScript features
- **ESLint compliance**: Run `npm run lint` before committing
- **Small commits**: Make focused, atomic changes
- **Clear messages**: Write descriptive commit messages
- **Test thoroughly**: Test on both Firefox and Chrome

### Pull Request Process

1. **Update documentation** for any new features
2. **Test your changes** on both browsers
3. **Run linting**: `npm run lint`
4. **Create PR** with clear description and screenshots
5. **Respond to feedback** during code review

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the full license text.

## 🙏 Acknowledgments

- **Basecamp team** for providing the autocompletables API
- **Browser extension communities** for development resources
- **Contributors and testers** who helped improve this extension

---

**Made with ❤️ for Basecamp users who need quick access to team member emails**

*If you find this extension helpful, please consider starring the repository!*