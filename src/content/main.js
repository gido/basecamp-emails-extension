class BasecampEmailSearch {
  constructor() {
    console.log('🚀 BasecampEmailSearch constructor called');
    this.modal = null;
    this.button = null;
    this.users = [];
    this.debounceTimeout = null;
    
    this.init();
  }

  cleanup() {
    // Remove existing button if it exists
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
      this.button = null;
    }
    
    // Remove existing modal if it exists
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
      this.modal = null;
    }
    
    // Clear any pending timeouts
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    console.log('🧹 Cleaned up previous extension instance');
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
    console.log('🔍 Looking for project-avatars section...');
    
    // Find the project-avatars section to add the button
    const projectAvatarsSection = document.querySelector('section.project-avatars[data-controller="desktop-modal"]');
    
    if (!projectAvatarsSection) {
      console.log('Project-avatars section not found, retrying in 500ms...');
      setTimeout(() => this.addSeeEmailsButton(), 500);
      return;
    }

    console.log('✅ Project-avatars section found, creating See Emails button');
    
    // Create the "See Emails" button
    this.button = document.createElement('a');
    this.button.href = '#';
    this.button.className = 'btn btn--small';
    this.button.innerHTML = 'See Emails';
    this.button.style.cssText = 'margin-left: 20px;';
    
    console.log('📧 See Emails button created:', this.button);
    
    // Add button to the project-avatars section
    projectAvatarsSection.appendChild(this.button);
    console.log('✅ Button added to project-avatars section');
    
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

    // Create modal overlay using Basecamp-style HTML structure
    this.modal = document.createElement('div');
    this.modal.className = 'basecamp-email-modal-overlay';
    
    this.modal.innerHTML = `
      <div class="modal-sheet modal-sheet--themed modal-sheet--jump-menu jump-menu__content-filter" role="combobox" aria-haspopup="listbox" aria-owns="jump-menu__results" aria-expanded="true" selected-index="0">
        <input type="text" class="jump-menu__input-field" data-behavior="content_filter_input" placeholder="Search for team member emails..." autofocus="true" spellcheck="false" autocorrect="off" autocomplete="off" aria-owns="jump-menu__results" aria-controls="jump-menu__results" aria-labelledby="a-jump-menu__description" aria-autocomplete="list">

        <div class="a-for-screen-reader">
          <span id="a-jump-menu__status" data-role="content_filter_aria_status" role="status" aria-live="assertive">
            Type to search for team member email addresses
          </span>
          <span id="a-jump-menu__description" data-role="content_filter_aria_description">
            Type to search for team member email addresses
          </span>
        </div>

        <div class="jump-menu__results" id="jump-menu__results" role="listbox">
          <section data-role="jump_menu_recent_history content_filter_group" class="">
            <div class="jump-menu__group-title">Team Members</div>
            <div class="basecamp-email-search-results"></div>
          </section>
        </div>
        
        <button class="basecamp-email-modal-close" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
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
    const input = this.modal.querySelector('.jump-menu__input-field');
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
      <article class="jump-menu__result" data-role="content_filterable" role="option" data-email="${user.email_address || ''}" data-name="${user.name || ''}">
        <a class="jump-menu__link" data-role="content_filter_text" href="#">
          <span class="jump-menu__icon jump-menu__icon--project"></span>
          <span data-role="content_filter_aria_text">${this.escapeHtml(user.name || 'No name')}</span>
          <span class="jump-menu__subtitle">${this.escapeHtml(user.email_address || 'No email')}</span>
        </a>
      </article>
    `).join('');
  }

  handleResultClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const result = event.target.closest('.jump-menu__result');
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
    if (!copiedDiv) {
      console.log('❌ Copied message div not found');
      return;
    }
    
    console.log('✅ Showing copied message');
    // Show the message with CSS transition
    copiedDiv.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
      copiedDiv.classList.remove('show');
      console.log('✅ Hiding copied message');
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

// Global instance tracker to prevent duplicates
let basecampEmailSearchInstance = null;

// Initialize on page load
function initializeExtension() {
  console.log('🔄 Initializing extension...');
  
  // Clean up previous instance if it exists
  if (basecampEmailSearchInstance) {
    basecampEmailSearchInstance.cleanup();
    basecampEmailSearchInstance = null;
  }
  
  // Create new instance
  basecampEmailSearchInstance = new BasecampEmailSearch();
}

// Handle initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Handle Turbo/SPA navigation (Basecamp uses Turbo for page transitions)
document.addEventListener('turbo:load', initializeExtension);
document.addEventListener('turbo:render', initializeExtension);

// Fallback for older Turbolinks
document.addEventListener('turbolinks:load', initializeExtension);

console.log('📱 Basecamp Email Search Extension loaded with SPA navigation support');