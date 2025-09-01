// Book content loader with dynamic path handling
class BookLoader {
  constructor() {
    this.bookData = {
      title: "",
      author: "",
      format: "",
      file: "",
    };
    this.bookId = "";
    this.init();
  }

  init() {
    // Get book data from body attributes and config
    this.bookData.file = document.body.getAttribute("data-book-file") || "";
    this.bookData.format =
      document.body.getAttribute("data-book-type") || "fb2";

    const bookConfig = window.bookConfig.getCurrentBook();
    if (bookConfig) {
      this.bookData.title = bookConfig.title;
      this.bookData.author = bookConfig.author;
      this.bookId = bookConfig.id;
    }

    this.setupInitialState();
  }

  setupInitialState() {
    const bookContent = document.getElementById("book-content");
    if (bookContent) {
      bookContent.innerHTML =
        '<p class="loading-message">Нажмите "Начать чтение" чтобы загрузить содержимое книги.</p>';
    }

    // Listen for reading start
    window.addEventListener("startReading", () => {
      this.loadBookContent();
    });
  }

  async loadBookContent() {
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    try {
      if (this.bookData.format === "fb2") {
        await this.loadFB2Book(this.bookData.file, bookContent);
      } else if (this.bookData.format === "pdf") {
        await this.loadPDFBook(this.bookData.file, bookContent);
      } else if (this.bookData.format === "txt") {
        await this.loadTXTBook(this.bookData.file, bookContent);
      }
    } catch (error) {
      console.error("Error loading book:", error);
      this.showBookError(bookContent);
    }
  }

  async loadFB2Book(bookFile, container) {
    try {
      const response = await fetch(bookFile);
      if (!response.ok)
        throw new Error(`Failed to load FB2 file: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();

      // Try different encodings
      let text;
      const encodings = ["utf-8", "windows-1251", "iso-8859-1", "cp1251"];

      for (const encoding of encodings) {
        try {
          text = new TextDecoder(encoding).decode(arrayBuffer);
          if (text.includes("FictionBook") || text.includes("<?xml")) {
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!text) {
        throw new Error("Could not decode file with any supported encoding");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      // Check for XML parsing errors
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error("XML parsing error: " + parseError.textContent);
      }

      // Extract book content
      let html = "";
      const body = xmlDoc.querySelector("body");

      if (body) {
        html = this.parseFB2Body(body);
      } else {
        // Fallback: try to find sections directly
        const sections = xmlDoc.querySelectorAll("section");
        if (sections.length > 0) {
          sections.forEach((section, index) => {
            html += this.parseFB2Section(section, index);
          });
        } else {
          throw new Error("No readable content found in FB2 file");
        }
      }

      if (!html.trim()) {
        throw new Error("No content extracted from FB2 file");
      }

      container.innerHTML = html;
      this.setupScrollBehavior(container);

      // Уведомляем о загрузке контента
      setTimeout(() => {
        const event = new CustomEvent("bookContentLoaded", {
          detail: { bookId: this.bookId },
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error("FB2 loading error:", error);
      this.showDemoContent(container);
    }
  }

  parseFB2Body(body) {
    let html = "";
    const sections = body.querySelectorAll("section");

    if (sections.length > 0) {
      sections.forEach((section, index) => {
        html += this.parseFB2Section(section, index);
      });
    } else {
      // Parse paragraphs directly from body
      const paragraphs = body.querySelectorAll("p");
      if (paragraphs.length > 0) {
        html += `<section class="chapter"><h2>${this.bookData.title}</h2>`;
        paragraphs.forEach((p) => {
          const text = p.textContent?.trim();
          if (text && text.length > 10) {
            html += `<p>${this.escapeHtml(text)}</p>`;
          }
        });
        html += `</section>`;
      }
    }

    return html;
  }

  parseFB2Section(section, index) {
    const title =
      section.querySelector("title")?.textContent?.trim() ||
      `Глава ${index + 1}`;
    const paragraphs = section.querySelectorAll("p");
    const images = section.querySelectorAll("image");

    let sectionHtml = `<section class="chapter">`;

    if (title && title !== `Глава ${index + 1}`) {
      sectionHtml += `<h2>${this.escapeHtml(title)}</h2>`;
    }

    // Add paragraphs
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim();
      if (text) {
        sectionHtml += `<p>${this.escapeHtml(text)}</p>`;
      }
    });

    // Add images if any
    images.forEach((img) => {
      const href =
        img.getAttribute("l:href") ||
        img.getAttribute("href") ||
        img.getAttribute("xlink:href");
      if (href) {
        // Construct correct image path
        const imagePath = this.getImagePath(href);
        sectionHtml += `<div class="book-image"><img src="${imagePath}" alt="Иллюстрация" loading="lazy" /></div>`;
      }
    });

    sectionHtml += `</section>`;
    return sectionHtml;
  }

  getImagePath(href) {
    // Handle relative image paths
    if (
      href.startsWith("http") ||
      href.startsWith("/") ||
      href.startsWith("data:")
    ) {
      return href;
    }

    // Construct path relative to book folder
    const bookConfig = window.bookConfig.getCurrentBook();
    if (bookConfig && bookConfig.folder) {
      return `${bookConfig.folder}images/${href}`;
    }

    return href;
  }

  async loadPDFBook(bookFile, container) {
    container.innerHTML = `
            <div class="pdf-container" style="text-align: center; padding: 3rem;">
                <h3>${this.bookData.title}</h3>
                <p>Для чтения PDF файла скачайте его по ссылке ниже:</p>
                <a href="${bookFile}" class="btn-primary" download style="margin-top: 1rem;">
                    <i class="fas fa-download"></i>
                    Скачать PDF
                </a>
                <p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Размер файла: ~2-5 МБ
                </p>
            </div>
        `;
  }

  async loadTXTBook(bookFile, container) {
    try {
      const response = await fetch(bookFile);
      if (!response.ok) throw new Error("Failed to load TXT file");

      const text = await response.text();
      const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

      let html = `<section class="chapter"><h2>${this.bookData.title}</h2>`;

      paragraphs.forEach((paragraph) => {
        if (paragraph.trim().length > 10) {
          html += `<p>${this.escapeHtml(paragraph.trim())}</p>`;
        }
      });

      html += `</section>`;
      container.innerHTML = html;

      // Уведомляем о загрузке контента
      setTimeout(() => {
        const event = new CustomEvent("bookContentLoaded", {
          detail: { bookId: this.bookId },
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error("TXT loading error:", error);
      this.showDemoContent(container);
    }
  }

  showDemoContent(container) {
    const demoContent = this.generateDemoContent();
    container.innerHTML = demoContent;
    this.setupScrollBehavior(container);

    // Уведомляем о загрузке контента
    setTimeout(() => {
      const event = new CustomEvent("bookContentLoaded", {
        detail: { bookId: this.bookId },
      });
      window.dispatchEvent(event);
    }, 100);
  }

  generateDemoContent() {
    const bookConfig = window.bookConfig.getCurrentBook();
    const title = bookConfig?.title || "Книга";

    return `
            <section class="chapter">
                <h2>Введение</h2>
                <p>Это демонстрационное содержимое книги "${title}".</p>
                <p>Оригинальный файл книги временно недоступен или находится в обработке.</p>
                <p>Пожалуйста, попробуйте обновить страницу позже или обратитесь в поддержку.</p>
            </section>
            
            <section class="chapter">
                <h2>О книге</h2>
                <p>Книга "${title}" представляет собой литературное произведение, доступное для чтения в нашей цифровой библиотеке.</p>
                <p>Для максимального комфорта чтения вы можете настроить цвета фона, страницы и текста согласно вашим предпочтениям.</p>
            </section>
            
            <section class="chapter">
                <h2>Особенности чтения</h2>
                <p>• Настройка цветовой схемы для комфортного чтения</p>
                <p>• Два режима чтения: постраничный и прокрутка</p>
                <p>• Сохранение прогресса чтения</p>
                <p>• Адаптивный дизайн для мобильных устройств</p>
            </section>
        `;
  }

  setupScrollBehavior(container) {
    container.style.scrollBehavior = "smooth";
    const chapters = container.querySelectorAll(".chapter");
    chapters.forEach((chapter, index) => {
      chapter.setAttribute("data-chapter", index + 1);
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showBookError(container) {
    container.innerHTML = `
            <div class="book-error" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Не удалось загрузить книгу</h3>
                <p>Файл книги временно недоступен. Показан демонстрационный контент.</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Попробовать снова
                </button>
            </div>
        `;
  }

  // Public method to reload content
  reload() {
    const bookContent = document.getElementById("book-content");
    if (bookContent) {
      this.loadBookContent();
    }
  }
}

// Initialize book loader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.bookLoader = new BookLoader();
});
