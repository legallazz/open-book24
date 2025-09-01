// Main application logic for the library homepage
function openBook(bookId) {
  const bookConfig = window.bookConfig.getBook(bookId);
  if (bookConfig && bookConfig.status === "available") {
    window.location.href = `${bookId}.html`;
  } else {
    showComingSoon(bookConfig?.title || bookId);
  }
}

// Show coming soon notification for placeholder books
function showComingSoon(bookTitle) {
  showNotification(`${bookTitle} будет доступна в ближайшее время!`, "info");
}

// Initialize application
document.addEventListener("DOMContentLoaded", function () {
  initializeSearch();
  initializeAnimations();
  initializeAccessibility();
});

function initializeSearch() {
  const searchInput = document.getElementById("search-input");
  const booksGrid = document.getElementById("books-grid");
  const bookCards = document.querySelectorAll(".compact-book-card");

  if (!searchInput || !booksGrid) return;

  let searchTimeout;

  searchInput.addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value.trim());
    }, 300);
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
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

    bookCards.forEach((card) => {
      const title =
        card.querySelector(".book-title")?.textContent?.toLowerCase() || "";
      const author =
        card.querySelector(".book-author")?.textContent?.toLowerCase() || "";
      const description =
        card.querySelector(".book-description")?.textContent?.toLowerCase() ||
        "";

      const matches =
        title.includes(searchTerm) ||
        author.includes(searchTerm) ||
        description.includes(searchTerm);

      if (matches) {
        card.style.display = "block";
        card.classList.add("fade-in");
        visibleCount++;
      } else {
        card.style.display = "none";
        card.classList.remove("fade-in");
      }
    });

    updateSearchResults(visibleCount, query);
  }

  function showAllBooks() {
    bookCards.forEach((card) => {
      card.style.display = "block";
      card.classList.add("fade-in");
    });
    removeNoResultsMessage();
  }

  function clearSearch() {
    searchInput.value = "";
    showAllBooks();
  }

  function updateSearchResults(count, query) {
    removeNoResultsMessage();

    if (count === 0) {
      showNoResultsMessage(query);
    }
  }

  function showNoResultsMessage(query) {
    const existingMessage = document.querySelector(".no-results-message");
    if (existingMessage) return;

    const message = document.createElement("div");
    message.className = "no-results-message fade-in";
    message.innerHTML = `
      <div style="
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
        grid-column: 1 / -1;
      ">
        <svg style="width: 3rem; height: 3rem; margin-bottom: 1rem; opacity: 0.5;" 
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3 style="margin-bottom: 0.5rem;">Ничего не найдено</h3>
        <p>По запросу "${query}" книги не найдены</p>
        <button onclick="clearSearchFromMessage()" 
                style="margin-top: 1rem; padding: 0.5rem 1rem; 
                       background: var(--primary-color); color: white; 
                       border: none; border-radius: 0.5rem; cursor: pointer;">
          Показать все книги
        </button>
      </div>
    `;

    booksGrid.appendChild(message);
  }

  function removeNoResultsMessage() {
    const existingMessage = document.querySelector(".no-results-message");
    if (existingMessage) {
      existingMessage.remove();
    }
  }

  window.clearSearchFromMessage = function () {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
      showAllBooks();
    }
  };
}

function initializeAnimations() {
  // Intersection Observer for fade-in animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  // Observe book cards
  document.querySelectorAll(".compact-book-card").forEach((card) => {
    observer.observe(card);
  });

  // Observe other elements
  document
    .querySelectorAll(".compact-search, .compact-header-content")
    .forEach((el) => {
      observer.observe(el);
    });
}

function initializeAccessibility() {
  // Add ARIA labels and roles
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.setAttribute("aria-label", "Поиск книг по названию или автору");
    searchInput.setAttribute("role", "searchbox");
  }

  const booksGrid = document.getElementById("books-grid");
  if (booksGrid) {
    booksGrid.setAttribute("role", "grid");
    booksGrid.setAttribute("aria-label", "Сетка книг");
  }

  // Add keyboard navigation for book cards
  const bookCards = document.querySelectorAll(".compact-book-card");
  bookCards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const bookId = card.dataset.book;
        if (bookId) {
          openBook(bookId);
        }
      }
    });
  });
}

// Utility functions
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--background-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1rem 1.5rem;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    max-width: 400px;
    animation: slideIn 0.3s ease;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
