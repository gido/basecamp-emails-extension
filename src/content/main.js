class BasecampEmailSearch {
  constructor() {
    this.widget = null;
    this.users = [];
    this.isMinimized = false;
    this.debounceTimeout = null;
    
    this.init();
  }

  init() {
    if (!this.isBasecampPage()) {
      return;
    }

    this.createWidget();
    this.attachEventListeners();
  }

  isBasecampPage() {
    return window.location.hostname.includes('basecamp.com');
  }

  extractUrlInfo() {
    const url = window.location.pathname;
    const accountMatch = url.match(/\/(\d+)\//);
    const bucketMatch = url.match(/\/buckets\/(\d+)\//);
    
    return {
      accountId: accountMatch ? accountMatch[1] : null,
      bucketId: bucketMatch ? bucketMatch[1] : null
    };
  }

  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith('authenticity_token=')) {
        return decodeURIComponent(cookie.split('=')[1]);
      }
    }
    
    return null;
  }

  createWidget() {
    this.widget = document.createElement('div');
    this.widget.className = 'basecamp-email-search';
    
    this.widget.innerHTML = `
      <div class="basecamp-email-search-header">
        <h3 class="basecamp-email-search-title">📧 Email Search</h3>
        <button class="basecamp-email-search-toggle" title="Toggle">−</button>
      </div>
      <div class="basecamp-email-search-content">
        <input 
          type="text" 
          class="basecamp-email-search-input" 
          placeholder="Search team members..."
          autocomplete="off"
        />
        <div class="basecamp-email-search-results"></div>
      </div>
      <div class="basecamp-email-search-copied">Copied to clipboard!</div>
    `;
    
    document.body.appendChild(this.widget);
  }

  attachEventListeners() {
    const toggle = this.widget.querySelector('.basecamp-email-search-toggle');
    const input = this.widget.querySelector('.basecamp-email-search-input');
    const results = this.widget.querySelector('.basecamp-email-search-results');

    toggle.addEventListener('click', () => this.toggleWidget());
    input.addEventListener('input', (e) => this.handleSearch(e.target.value));
    results.addEventListener('click', (e) => this.handleResultClick(e));
  }

  toggleWidget() {
    this.isMinimized = !this.isMinimized;
    const content = this.widget.querySelector('.basecamp-email-search-content');
    const toggle = this.widget.querySelector('.basecamp-email-search-toggle');
    
    if (this.isMinimized) {
      content.style.display = 'none';
      toggle.textContent = '+';
      this.widget.classList.add('minimized');
    } else {
      content.style.display = 'block';
      toggle.textContent = '−';
      this.widget.classList.remove('minimized');
    }
  }

  handleSearch(query) {
    clearTimeout(this.debounceTimeout);
    
    if (!query.trim()) {
      this.clearResults();
      return;
    }

    this.debounceTimeout = setTimeout(() => {
      this.searchUsers(query.trim());
    }, 300);
  }

  async searchUsers(query) {
    const results = this.widget.querySelector('.basecamp-email-search-results');
    results.innerHTML = '<div class="basecamp-email-search-loading">Searching...</div>';

    try {
      const users = await this.fetchUsers();
      const filteredUsers = this.filterUsers(users, query);
      this.displayResults(filteredUsers);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching users:', error);
      results.innerHTML = '<div class="basecamp-email-search-error">Error loading users. Please try again.</div>';
    }
  }

  async fetchUsers() {
    if (this.users.length > 0) {
      return this.users;
    }

    const { accountId, bucketId } = this.extractUrlInfo();
    
    if (!accountId || !bucketId) {
      throw new Error('Unable to extract account or bucket ID from URL');
    }

    const csrfToken = this.getCSRFToken();
    if (!csrfToken) {
      throw new Error('Unable to extract CSRF token');
    }

    const url = `https://3.basecamp.com/${accountId}/autocompletables/buckets/${bucketId}/people?include_groups=true&mentionable=true&people_scope=team_users`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrfToken,
        'X-Fetch-Type': 'native'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    this.users = Array.isArray(data) ? data : [];
    return this.users;
  }

  filterUsers(users, query) {
    const lowerQuery = query.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(lowerQuery) ||
      user.email_address?.toLowerCase().includes(lowerQuery) ||
      user.title?.toLowerCase().includes(lowerQuery)
    );
  }

  displayResults(users) {
    const results = this.widget.querySelector('.basecamp-email-search-results');
    
    if (users.length === 0) {
      results.innerHTML = '<div class="basecamp-email-search-no-results">No users found</div>';
      return;
    }

    results.innerHTML = users.map(user => `
      <div class="basecamp-email-search-result" data-email="${user.email_address || ''}" data-name="${user.name || ''}">
        <div class="basecamp-email-search-name">${this.escapeHtml(user.name || 'No name')}</div>
        <div class="basecamp-email-search-email">${this.escapeHtml(user.email_address || 'No email')}</div>
        ${user.title ? `<div class="basecamp-email-search-title-role">${this.escapeHtml(user.title)}</div>` : ''}
      </div>
    `).join('');
  }

  handleResultClick(event) {
    const result = event.target.closest('.basecamp-email-search-result');
    if (!result) return;

    const email = result.getAttribute('data-email');
    
    if (email && email !== 'No email') {
      this.copyToClipboard(email);
      this.showCopiedMessage();
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy to clipboard:', err);
      
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  showCopiedMessage() {
    const copiedDiv = this.widget.querySelector('.basecamp-email-search-copied');
    copiedDiv.classList.add('show');
    
    setTimeout(() => {
      copiedDiv.classList.remove('show');
    }, 2000);
  }

  clearResults() {
    const results = this.widget.querySelector('.basecamp-email-search-results');
    results.innerHTML = '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BasecampEmailSearch();
  });
} else {
  new BasecampEmailSearch();
}