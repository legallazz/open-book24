// Search functionality for the book library
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const booksGrid = document.getElementById('books-grid');
  const bookCards = document.querySelectorAll('.book-card');
  
  if (!searchInput || !booksGrid) return;

  let searchTimeout;
  
  // Search input handler
  searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value.trim());
    }, 300);
  });

  // Clear search on Escape
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });

  function performSearch(query) {
    if (!query) {
      showAllBooks();
      return;
    }

    const searchTerm = query.toLowerCase();
    let visibleCount = 0;

    bookCards.forEach(card => {
      const title = card.querySelector('.book-title')?.textContent?.toLowerCase() || '';
      const author = card.querySelector('.book-author')?.textContent?.toLowerCase() || '';
      const description = card.querySelector('.book-description')?.textContent?.toLowerCase() || '';
      
      const matches = 
        title.includes(searchTerm) ||
        author.includes(searchTerm) ||
        description.includes(searchTerm);

      if (matches) {
        card.style.display = 'block';
        card.classList.add('search-match');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.remove('search-match');
      }
    });

    updateSearchResults(visibleCount, query);
  }

  function showAllBooks() {
    bookCards.forEach(card => {
      card.style.display = 'block';
      card.classList.add('search-match');
    });
    removeNoResultsMessage();
  }

  function clearSearch() {
    searchInput.value = '';
    showAllBooks();
  }

  function updateSearchResults(count, query) {
    removeNoResultsMessage();
    
    if (count === 0) {
      showNoResultsMessage(query);
    }
  }

  function showNoResultsMessage(query) {
    const existingMessage = document.querySelector('.no-results-message');
    if (existingMessage) return;

    const message = document.createElement('div');
    message.className = 'no-results-message';
    message.innerHTML = `
      <div class="no-results-content">
        <svg class="no-results-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3>Ничего не найдено</h3>
        <p>По запросу "<strong>${query}</strong>" книги не найдены</p>
        <button onclick="clearSearchFromMessage()" class="btn-secondary">
          Показать все книги
        </button>
      </div>
    `;
    
    booksGrid.appendChild(message);
  }

  function removeNoResultsMessage() {
    const existingMessage = document.querySelector('.no-results-message');
    if (existingMessage) {
      existingMessage.remove();
    }
  }

  // Global function for clear search button
  window.clearSearchFromMessage = function() {
    searchInput.value = '';
    showAllBooks();
  };
}