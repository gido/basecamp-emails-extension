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
    
    // Also remove any orphaned buttons from previous instances
    const orphanedButtons = document.querySelectorAll('.basecamp-email-search-button');
    orphanedButtons.forEach(button => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    });
    
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
    const target = document.querySelector('.perma-toolbar__project-people');

    if (!target) {
      setTimeout(() => this.addSeeEmailsButton(), 500);
      return;
    }

    const existingButton = document.querySelector('.basecamp-email-search-button');
    if (existingButton) {
      this.button = existingButton;
      return;
    }

    this.button = document.createElement('a');
    this.button.href = '#';
    this.button.className = 'contents basecamp-email-search-button';
    this.button.title = 'Search team member emails';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'btn btn--icon btn--round btn--sm';
    iconWrap.style.marginLeft = '10px';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'svg-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', 'M4 6h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2v.4l8 5 8-5V8H4zm0 2.75V16h16v-5.25l-8 5-8-5z');
    svg.appendChild(path);
    iconWrap.appendChild(svg);

    const label = document.createElement('span');
    label.className = 'margin-left-4';
    label.textContent = 'See emails';

    this.button.appendChild(iconWrap);
    this.button.appendChild(label);
    target.appendChild(this.button);

    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.showEmailModal();
    });
  }

  showEmailModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      const input = this.modal.querySelector('.nav-menu__input');
      if (input) {
        input.focus();
      }
      return;
    }

    this.modal = document.createElement('div');
    this.modal.className = 'basecamp-email-modal-overlay';

    const sheet = document.createElement('div');
    sheet.className = 'nav-menu__sheet nav-menu__sheet--jump';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Search team member emails');

    const scroller = document.createElement('div');
    scroller.className = 'nav-menu__scroller';

    const searchSection = document.createElement('section');
    searchSection.className = 'nav-menu__section nav-menu__section--jump';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'input input--full-width nav-menu__input';
    searchInput.placeholder = 'Search by name or email…';
    searchInput.spellcheck = false;
    searchInput.autocomplete = 'off';
    searchInput.setAttribute('aria-label', 'Search team member emails');
    searchSection.appendChild(searchInput);

    const peopleSection = document.createElement('section');
    peopleSection.className = 'nav-menu__section nav-menu__section--people';

    const header = document.createElement('h3');
    header.className = 'nav-menu__header';
    header.textContent = 'Team Members';
    peopleSection.appendChild(header);

    const resultsList = document.createElement('ul');
    resultsList.className = 'basecamp-email-search-results margin-top-4 list--unruled-actions list--unbulleted';
    resultsList.setAttribute('role', 'group');
    resultsList.setAttribute('aria-label', 'Team Members');
    peopleSection.appendChild(resultsList);

    scroller.appendChild(searchSection);
    scroller.appendChild(peopleSection);
    sheet.appendChild(scroller);

    const copiedDiv = document.createElement('div');
    copiedDiv.className = 'basecamp-email-search-copied';
    copiedDiv.textContent = 'Copied to clipboard!';
    sheet.appendChild(copiedDiv);

    this.modal.appendChild(sheet);
    document.body.appendChild(this.modal);

    this.attachModalEventListeners();
    searchInput.focus();
    this.loadAllTeamMembers();
  }

  attachModalEventListeners() {
    const input = this.modal.querySelector('.nav-menu__input');
    const results = this.modal.querySelector('.basecamp-email-search-results');
    const overlay = this.modal;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideModal();
    });

    input.addEventListener('input', (e) => this.handleSearch(e.target.value));
    results.addEventListener('click', (e) => this.handleResultClick(e));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
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
    // Since we're filtering cached data locally, search can be instant
    if (!query.trim()) {
      // Show all users when search is empty
      this.loadAllTeamMembers();
      return;
    }
    this.searchUsers(query.trim());
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
      const item = document.createElement('li');
      item.className = 'nav-menu__result';
      item.setAttribute('role', 'treeitem');
      item.setAttribute('aria-selected', 'false');
      item.setAttribute('data-email', user.email_address || '');
      item.setAttribute('data-name', user.name || '');

      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'nav-menu__link';

      if (user.avatar_url) {
        const avatar = document.createElement('img');
        avatar.className = 'basecamp-email-avatar';
        avatar.src = user.avatar_url;
        avatar.alt = '';
        avatar.loading = 'lazy';
        avatar.width = 24;
        avatar.height = 24;
        link.appendChild(avatar);
      } else {
        const icon = document.createElement('span');
        icon.className = 'basecamp-email-avatar basecamp-email-avatar--placeholder';
        link.appendChild(icon);
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = user.name || 'No name';
      link.appendChild(nameSpan);

      const emailSpan = document.createElement('span');
      emailSpan.className = 'nav-menu__subtitle';
      emailSpan.textContent = user.email_address || 'No email';
      link.appendChild(emailSpan);

      item.appendChild(link);
      results.appendChild(item);
    });
  }

  handleResultClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const result = event.target.closest('.nav-menu__result');
    if (!result) return;

    const email = result.getAttribute('data-email');
    if (email) {
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

