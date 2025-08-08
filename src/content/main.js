class BasecampEmailSearch {
  constructor() {
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
    
  }

  init() {
    
    if (!this.isProjectHomePage()) {
      return;
    }
    this.addSeeEmailsButton();
  }

  isProjectHomePage() {
    return window.location.hostname.includes('basecamp.com') && 
           window.location.pathname.includes('/projects/');
  }

  extractUrlInfo() {
    const url = window.location.pathname;
    
    const accountMatch = url.match(/\/(\d+)\//);
    const projectMatch = url.match(/\/projects\/(\d+)/); // Remove trailing slash requirement
    
    const accountId = accountMatch ? accountMatch[1] : null;
    const bucketId = projectMatch ? projectMatch[1] : null;
    
    
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
    
    // Find the project-avatars section to add the button
    const projectAvatarsSection = document.querySelector('section.project-avatars[data-controller="desktop-modal"]');
    
    if (!projectAvatarsSection) {
      setTimeout(() => this.addSeeEmailsButton(), 500);
      return;
    }

    
    // Create the "See Emails" button
    this.button = document.createElement('a');
    this.button.href = '#';
    this.button.className = 'btn btn--small';
    this.button.textContent = 'See Emails';
    this.button.style.cssText = 'margin-left: 20px;';
    
    
    // Add button to the project-avatars section
    projectAvatarsSection.appendChild(this.button);
    
    
    // Add click event listener
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.showEmailModal();
    });
  }

  showEmailModal() {
    if (this.modal) {
      // Modal already exists, just show it
      this.modal.style.display = 'block';
      return;
    }

    // Create modal overlay using safe DOM methods
    this.modal = document.createElement('div');
    this.modal.className = 'basecamp-email-modal-overlay';
    
    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-sheet modal-sheet--themed modal-sheet--jump-menu jump-menu__content-filter';
    modalContent.setAttribute('role', 'combobox');
    modalContent.setAttribute('aria-haspopup', 'listbox');
    modalContent.setAttribute('aria-owns', 'jump-menu__results');
    modalContent.setAttribute('aria-expanded', 'true');
    modalContent.setAttribute('selected-index', '0');

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'jump-menu__input-field';
    searchInput.setAttribute('data-behavior', 'content_filter_input');
    searchInput.placeholder = 'Search for team member emails...';
    searchInput.autofocus = true;
    searchInput.spellcheck = false;
    searchInput.autocorrect = 'off';
    searchInput.autocomplete = 'off';
    searchInput.setAttribute('aria-owns', 'jump-menu__results');
    searchInput.setAttribute('aria-controls', 'jump-menu__results');
    searchInput.setAttribute('aria-labelledby', 'a-jump-menu__description');
    searchInput.setAttribute('aria-autocomplete', 'list');

    // Create screen reader elements
    const screenReaderDiv = document.createElement('div');
    screenReaderDiv.className = 'a-for-screen-reader';
    
    const statusSpan = document.createElement('span');
    statusSpan.id = 'a-jump-menu__status';
    statusSpan.setAttribute('data-role', 'content_filter_aria_status');
    statusSpan.setAttribute('role', 'status');
    statusSpan.setAttribute('aria-live', 'assertive');
    statusSpan.textContent = 'Type to search for team member email addresses';
    
    const descSpan = document.createElement('span');
    descSpan.id = 'a-jump-menu__description';
    descSpan.setAttribute('data-role', 'content_filter_aria_description');
    descSpan.textContent = 'Type to search for team member email addresses';
    
    screenReaderDiv.appendChild(statusSpan);
    screenReaderDiv.appendChild(descSpan);

    // Create results container
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'jump-menu__results';
    resultsDiv.id = 'jump-menu__results';
    resultsDiv.setAttribute('role', 'listbox');
    
    const section = document.createElement('section');
    section.setAttribute('data-role', 'jump_menu_recent_history content_filter_group');
    section.className = '';
    
    const groupTitle = document.createElement('div');
    groupTitle.className = 'jump-menu__group-title';
    groupTitle.textContent = 'Team Members';
    
    const searchResults = document.createElement('div');
    searchResults.className = 'basecamp-email-search-results';
    
    section.appendChild(groupTitle);
    section.appendChild(searchResults);
    resultsDiv.appendChild(section);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'basecamp-email-modal-close';
    closeButton.style.cssText = 'position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;';
    closeButton.textContent = '×';

    // Create copied message
    const copiedDiv = document.createElement('div');
    copiedDiv.className = 'basecamp-email-search-copied';
    copiedDiv.textContent = 'Copied to clipboard!';

    // Assemble modal
    modalContent.appendChild(searchInput);
    modalContent.appendChild(screenReaderDiv);
    modalContent.appendChild(resultsDiv);
    modalContent.appendChild(closeButton);
    modalContent.appendChild(copiedDiv);
    
    this.modal.appendChild(modalContent);
    
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
    this.clearElement(results);
    const loadingDiv = this.createSafeElement('div', 'basecamp-email-search-loading', 'Loading team members...');
    results.appendChild(loadingDiv);

    try {
      const users = await this.fetchUsers();
      this.displayResults(users);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading users:', error);
      this.clearElement(results);
      const errorDiv = this.createSafeElement('div', 'basecamp-email-search-error', 'Error loading team members. Please try again.');
      results.appendChild(errorDiv);
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
    
    this.clearElement(results);
    const searchingDiv = this.createSafeElement('div', 'basecamp-email-search-loading', 'Searching...');
    results.appendChild(searchingDiv);

    try {
      const users = await this.fetchUsers();
      const filteredUsers = this.filterUsers(users, query);
      this.displayResults(filteredUsers);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching users:', error);
      this.clearElement(results);
      const errorDiv = this.createSafeElement('div', 'basecamp-email-search-error', 'Error loading users. Please try again.');
      results.appendChild(errorDiv);
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
      this.clearElement(results);
      const noResultsDiv = this.createSafeElement('div', 'basecamp-email-search-no-results', 'No team members found');
      results.appendChild(noResultsDiv);
      return;
    }

    this.clearElement(results);
    users.forEach(user => {
      const article = document.createElement('article');
      article.className = 'jump-menu__result';
      article.setAttribute('data-role', 'content_filterable');
      article.setAttribute('role', 'option');
      article.setAttribute('data-email', user.email_address || '');
      article.setAttribute('data-name', user.name || '');

      const link = document.createElement('a');
      link.className = 'jump-menu__link';
      link.setAttribute('data-role', 'content_filter_text');
      link.href = '#';

      // Add avatar or icon
      if (user.avatar_url) {
        const avatar = document.createElement('img');
        avatar.className = 'basecamp-email-avatar';
        avatar.src = user.avatar_url;
        avatar.alt = user.name || 'User';
        avatar.loading = 'lazy';
        link.appendChild(avatar);
      } else {
        const icon = document.createElement('span');
        icon.className = 'jump-menu__icon jump-menu__icon--project';
        link.appendChild(icon);
      }

      // Add name
      const nameSpan = document.createElement('span');
      nameSpan.setAttribute('data-role', 'content_filter_aria_text');
      nameSpan.textContent = user.name || 'No name';
      link.appendChild(nameSpan);

      // Add email
      const emailSpan = document.createElement('span');
      emailSpan.className = 'jump-menu__subtitle';
      emailSpan.textContent = user.email_address || 'No email';
      link.appendChild(emailSpan);

      article.appendChild(link);
      results.appendChild(article);
    });
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
      return;
    }
    
    // Show the message with CSS transition
    copiedDiv.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
      copiedDiv.classList.remove('show');
    }, 2000);
  }

  clearResults() {
    if (!this.modal) return;
    
    const results = this.modal.querySelector('.basecamp-email-search-results');
    this.clearElement(results);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  createSafeElement(tag, className, textContent) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

// Global instance tracker to prevent duplicates
let basecampEmailSearchInstance = null;

// Initialize on page load
function initializeExtension() {
  
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

