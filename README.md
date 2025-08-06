# Basecamp Email Search Extension

A browser extension that adds a powerful email search interface to Basecamp, allowing you to quickly find and copy team members' email addresses with just a few keystrokes.

![Extension Demo](https://img.shields.io/badge/Browser-Firefox%20%7C%20Chrome-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🔍 **Real-time Search**: Instant search results as you type (name, email, or title)
- 📧 **One-click Copy**: Click any result to copy email address to clipboard
- 🎯 **Smart Integration**: Floating widget that doesn't interfere with Basecamp UI
- 🔒 **Secure Authentication**: Uses your existing Basecamp session, no additional login
- ✨ **Clean Interface**: Minimalist design with show/hide toggle
- ⚡ **Fast Performance**: Debounced search with local caching
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
- Navigate to any Basecamp project (e.g., `https://3.basecamp.com/your-account/`)
- Look for the floating "📧 Email Search" widget
- If it doesn't appear, check the browser console (F12) for errors

## 🚀 Usage

### Basic Search
1. **Navigate** to any Basecamp project page
2. **Find the widget** - The "📧 Email Search" widget appears as a floating panel
3. **Start typing** - Search by name, email, or job title  
4. **View results** - Team members matching your query appear instantly
5. **Copy email** - Click any result to copy the email address to clipboard
6. **Success feedback** - "Copied to clipboard!" message confirms the action

### Search Examples
- **By name**: "marc", "gilles", "susana" 
- **By email domain**: "antistatique", "gmail"
- **By title**: "developer", "manager", "designer"
- **Partial matches**: "mar" finds "Marc Friederich"

### Widget Controls  
- **Toggle visibility**: Click the "−" button to minimize/expand
- **Clear search**: Delete text or search for new terms
- **Reposition**: Widget stays in a fixed position (bottom-right by default)

### Keyboard Shortcuts
- **Type anywhere**: Start typing to focus the search field automatically
- **Escape**: Clear search or minimize widget

## 🛠️ Development  

### Available Scripts

```bash
# Development
npm run build           # Build extension for production
npm run lint           # Check code quality with ESLint  
npm test              # Run unit tests (if available)

# Debugging
npm run build:dev     # Build with source maps for debugging
```

### Project Structure

```
basecamp-emails-extension/
├── src/
│   ├── content/
│   │   └── main.js          # Main content script with search logic
│   ├── assets/
│   │   ├── styles.css       # Widget styles and animations  
│   │   ├── icon-16.png      # Extension icon (16x16)
│   │   ├── icon-48.png      # Extension icon (48x48)  
│   │   └── icon-128.png     # Extension icon (128x128)
│   ├── popup/
│   │   └── popup.html       # Extension popup (optional)
│   └── manifest.json        # Extension manifest (v3)
├── dist/                    # Built extension files  
├── webpack.config.js        # Webpack build configuration
├── package.json            # Dependencies and scripts
└── README.md              # This documentation
```

### Architecture

The extension consists of:

1. **Content Script** (`main.js`): Injected into Basecamp pages
   - Detects Basecamp pages
   - Creates and manages the search widget  
   - Handles API requests to Basecamp
   - Manages clipboard operations

2. **Manifest** (`manifest.json`): Extension configuration
   - Defines permissions and content script injection
   - Configures icons and metadata
   - Sets up browser compatibility

3. **Styles** (`styles.css`): Widget appearance  
   - Floating panel design
   - Responsive layout
   - Animation and transitions

## ⚙️ How It Works

### Technical Overview

The extension leverages Basecamp's internal API to provide email search functionality:

1. **Page Detection**: Monitors for `*.basecamp.com` domains
2. **URL Analysis**: Extracts account ID and bucket ID from current URL
   ```
   https://3.basecamp.com/[ACCOUNT_ID]/buckets/[BUCKET_ID]/...
   ```
3. **Authentication**: Retrieves CSRF token from page meta tags
4. **API Integration**: Queries Basecamp's autocompletables endpoint
5. **Data Processing**: Filters and displays user information locally
6. **Clipboard Integration**: Uses modern Clipboard API for one-click copying

### API Details

**Endpoint**: `https://3.basecamp.com/{account_id}/autocompletables/buckets/{bucket_id}/people`

**Parameters**:
- `include_groups=true` - Include team groups
- `mentionable=true` - Include mentionable users  
- `people_scope=team_users` - Scope to team members

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
| **Extension not loading** | Widget doesn't appear | Check browser console (F12) for errors<br/>Reload extension in browser settings |
| **No search results** | "Searching..." never completes | Verify you're on a project page (not account home)<br/>Check Network tab for failed API calls |
| **"No email" displayed** | Names show but emails are blank | API may not return emails due to privacy settings<br/>Try different users or contact admin |
| **CSRF token errors** | Console shows authentication errors | Refresh the Basecamp page<br/>Clear browser cache and cookies |
| **Clipboard not working** | No "copied" feedback | Check browser clipboard permissions<br/>Try manually selecting and copying |

### Debug Steps

1. **Open Developer Tools** (F12)  
2. **Check Console tab** for JavaScript errors
3. **Monitor Network tab** for API requests to `/autocompletables/`
4. **Verify extension is loaded** in browser settings
5. **Test on different Basecamp pages** (projects vs. account home)

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

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed  
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability accepted

See the [LICENSE](LICENSE) file for the full license text.

## 🙏 Acknowledgments

- **Basecamp team** for providing the autocompletables API
- **Browser extension communities** for development resources
- **Contributors and testers** who helped improve this extension

---

**Made with ❤️ for Basecamp users who need quick access to team member emails**

*If you find this extension helpful, please consider starring the repository!*