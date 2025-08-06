class BasecampEmailSearch {
  constructor() {
    console.log('🚀 BasecampEmailSearch constructor called');
    this.modal = null;
    this.button = null;
    this.users = [];
    this.debounceTimeout = null;
    
    this.init();
  }

  init() {
    console.log('🔍 Init called');
    console.log('URL:', window.location.href);
    console.log('Hostname includes basecamp:', window.location.hostname.includes('basecamp.com'));
    console.log('Path includes projects:', window.location.pathname.includes('/projects/'));
    
    if (!this.isProjectHomePage()) {
      console.log('❌ Not a project home page, exiting');
      return;
    }

    console.log('✅ Project home page detected, adding button');
    this.addSeeEmailsButton();
  }

  isProjectHomePage() {
    return window.location.hostname.includes('basecamp.com') && 
           window.location.pathname.includes('/projects/');
  }

  extractUrlInfo() {
    const url = window.location.pathname;
    console.log('🔍 Extracting from URL:', url);
    
    const accountMatch = url.match(/\/(\d+)\//);
    const projectMatch = url.match(/\/projects\/(\d+)/); // Remove trailing slash requirement
    
    const accountId = accountMatch ? accountMatch[1] : null;
    const bucketId = projectMatch ? projectMatch[1] : null;
    
    console.log('Account ID:', accountId, 'Bucket ID:', bucketId);
    
    return {
      accountId: accountId,
      bucketId: bucketId
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

  addSeeEmailsButton() {
    console.log('🔍 Looking for setup people button...');
    
    // Find the visible "Set up people" button by searching through all buttons
    let setupPeopleButton = null;
    const buttons = document.querySelectorAll('button, a');
    
    for (let button of buttons) {
      const text = button.textContent && button.textContent.trim();
      if (text && text.includes('Set up people')) {
        // Make sure it's visible (not in a hidden dropdown)
        const styles = window.getComputedStyle(button);
        if (styles.display !== 'none' && styles.visibility !== 'hidden') {
          setupPeopleButton = button;
          console.log('Found visible setup people button:', button);
          break;
        } else {
          console.log('Found hidden setup people button (skipping):', button);
        }
      }
    }
    
    console.log('Setup people button found:', setupPeopleButton);
    
    if (!setupPeopleButton) {
      console.log('Setup people button not found, retrying in 500ms...');
      setTimeout(() => this.addSeeEmailsButton(), 500);
      return;
    }

    console.log('✅ Setup people button found, creating See Emails button');
    
    // Create the "See Emails" button
    this.button = document.createElement('a');
    this.button.href = '#';
    this.button.className = 'btn btn--small';
    this.button.innerHTML = '📧 See Emails';
    this.button.style.cssText = 'margin-left: 20px;';
    
    console.log('📧 See Emails button created:', this.button);
    
    // Find the project-avatars section and add as last child
    const projectAvatarsSection = document.querySelector('section.project-avatars[data-controller="desktop-modal"]');
    
    if (projectAvatarsSection) {
      projectAvatarsSection.appendChild(this.button);
      console.log('✅ Button added to project-avatars section');
    } else {
      console.log('❌ Could not find project-avatars section');
    }
    
    console.log('✅ See Emails button inserted into DOM');
    
    // Add click event listener
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('📧 See Emails button clicked!');
      this.showEmailModal();
    });
  }

  showEmailModal() {
    if (this.modal) {
      // Modal already exists, just show it
      this.modal.style.display = 'block';
      return;
    }

    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'basecamp-email-modal-overlay';
    
    this.modal.innerHTML = `
      <div class="basecamp-email-modal">
        <div class="basecamp-email-modal-header">
          <h2>Team Emails</h2>
          <button class="basecamp-email-modal-close">&times;</button>
        </div>
        <div class="basecamp-email-modal-content">
          <div class="basecamp-email-search-section">
            <input 
              type="text" 
              class="basecamp-email-search-input" 
              placeholder="Search team members..."
              autocomplete="off"
            />
          </div>
          <div class="basecamp-email-search-results"></div>
        </div>
        <div class="basecamp-email-search-copied">Copied to clipboard!</div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
    this.attachModalEventListeners();
    
    // Auto-load all team members
    this.loadAllTeamMembers();
  }

  attachModalEventListeners() {
    const closeBtn = this.modal.querySelector('.basecamp-email-modal-close');
    const input = this.modal.querySelector('.basecamp-email-search-input');
    const results = this.modal.querySelector('.basecamp-email-search-results');
    const overlay = this.modal;

    // Close modal events
    closeBtn.addEventListener('click', () => this.hideModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideModal();
    });
    
    // Search functionality
    input.addEventListener('input', (e) => this.handleSearch(e.target.value));
    results.addEventListener('click', (e) => this.handleResultClick(e));
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display === 'block') {
        this.hideModal();
      }
    });
  }

  hideModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
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

  async loadAllTeamMembers() {
    const results = this.modal.querySelector('.basecamp-email-search-results');
    results.innerHTML = '<div class="basecamp-email-search-loading">Loading team members...</div>';

    try {
      const users = await this.fetchUsers();
      this.displayResults(users);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading users:', error);
      results.innerHTML = '<div class="basecamp-email-search-error">Error loading team members. Please try again.</div>';
    }
  }

  async searchUsers(query) {
    if (!this.modal) return;
    
    const results = this.modal.querySelector('.basecamp-email-search-results');
    
    if (!query.trim()) {
      // Show all users when no search query
      const users = await this.fetchUsers();
      this.displayResults(users);
      return;
    }
    
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

    const url = `https://3.basecamp.com/${accountId}/autocompletables/buckets/${bucketId}/people?mentionable=true`;
    
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
    if (!this.modal) return;
    
    const results = this.modal.querySelector('.basecamp-email-search-results');
    
    if (users.length === 0) {
      results.innerHTML = '<div class="basecamp-email-search-no-results">No team members found</div>';
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
    if (!this.modal) return;
    
    const copiedDiv = this.modal.querySelector('.basecamp-email-search-copied');
    copiedDiv.classList.add('show');
    
    setTimeout(() => {
      copiedDiv.classList.remove('show');
    }, 2000);
  }

  clearResults() {
    if (!this.modal) return;
    
    const results = this.modal.querySelector('.basecamp-email-search-results');
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