class ReadingSettings {
  constructor() {
    this.currentSettings = {
      fontSize: 18,
      fontFamily: "Inter",
      textAlign: "justify",
      readingMode: "scroll",
      theme: "dark",
    };

    this.fontOptions = [
      "Inter",
      "Arial",
      "Times New Roman",
      "Georgia",
      "Verdana",
      "Kazimir",
    ];
    this.themes = this.createThemes();
    this.currentPage = 1;
    this.totalPages = 1;

    // Привязываем контекст для обработчиков
    this.boundHandleKeyboardNavigation =
      this.handleKeyboardNavigation.bind(this);
    this.boundHandleWheelNavigation = this.handleWheelNavigation.bind(this);

    this.init();
  }

  createThemes() {
    return {
      dark: {
        "--reader-background": "#111827",
        "--reader-page": "#1f2937",
        "--reader-text": "#f9fafb",
        "--reader-border": "#374151",
      },
      "dark-blue": {
        "--reader-background": "#0f172a",
        "--reader-page": "#1e293b",
        "--reader-text": "#f1f5f9",
        "--reader-border": "#334155",
      },
      "dark-warm": {
        "--reader-background": "#1c1917",
        "--reader-page": "#292524",
        "--reader-text": "#e7e5e4",
        "--reader-border": "#57534e",
      },
      light: {
        "--reader-background": "#f8fafc",
        "--reader-page": "#ffffff",
        "--reader-text": "#1f2937",
        "--reader-border": "#e5e7eb",
      },
      "light-warm": {
        "--reader-background": "#fdf2f8",
        "--reader-page": "#fefce8",
        "--reader-text": "#374151",
        "--reader-border": "#fbcfe8",
      },
      sepia: {
        "--reader-background": "#f5e6d3",
        "--reader-page": "#fdf6e3",
        "--reader-text": "#5c4b37",
        "--reader-border": "#e9d5a1",
      },
      blue: {
        "--reader-background": "#e0f2fe",
        "--reader-page": "#f0f9ff",
        "--reader-text": "#0c4a6e",
        "--reader-border": "#bae6fd",
      },
      green: {
        "--reader-background": "#f0fdf4",
        "--reader-page": "#ecfdf5",
        "--reader-text": "#064e3b",
        "--reader-border": "#bbf7d0",
      },
    };
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
    this.applyAllSettings();
    this.setupReadingMode();

    // Слушаем событие загрузки контента книги
    window.addEventListener("bookContentLoaded", () => {
      console.log("Book content loaded, setting up reading mode");
      this.setupReadingMode();
    });

    // Обработчик изменения размера окна
    window.addEventListener("resize", () => {
      if (this.currentSettings.readingMode === "page") {
        this.calculatePages();
        this.showCurrentPage();
      }
    });
  }

  setupEventListeners() {
    // Кнопки размера шрифта
    this.setupButton("font-size-increase", () => this.changeFontSize(1));
    this.setupButton("font-size-decrease", () => this.changeFontSize(-1));

    // Выбор шрифта
    this.setupSelect("font-family-select", (value) =>
      this.changeFontFamily(value)
    );

    // Выравнивание текста
    this.setupButton("text-align-left", () => {
      this.setTextAlign("left");
      this.updateButtonStates();
    });
    this.setupButton("text-align-justify", () => {
      this.setTextAlign("justify");
      this.updateButtonStates();
    });

    // Режим чтения
    this.setupButton("reading-mode-page", () => this.setReadingMode("page"));
    this.setupButton("reading-mode-scroll", () =>
      this.setReadingMode("scroll")
    );

    // Темы
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.addEventListener("click", () => {
        const theme = preset.dataset.theme;
        this.applyTheme(theme);
        this.saveSettings();
      });
    });

    // Навигация по страницам
    this.setupButton("next-page", () => this.nextPage());
    this.setupButton("prev-page", () => this.prevPage());

    // Закрытие настроек
    this.setupButton("settings-close", () => this.closeSettings());

    // Закрытие по клику вне области
    document.addEventListener("click", (e) => {
      const sidebar = document.getElementById("settings-sidebar");
      if (
        sidebar &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !e.target.closest("#reading-color-settings")
      ) {
        this.closeSettings();
      }
    });
  }

  setupButton(id, callback) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", callback);
    }
  }

  setupSelect(id, callback) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", (e) => callback(e.target.value));
    }
  }

  changeFontSize(delta) {
    this.currentSettings.fontSize = Math.max(
      14,
      Math.min(24, this.currentSettings.fontSize + delta)
    );
    this.applyFontSettings();
    this.saveSettings();
  }

  changeFontFamily(font) {
    this.currentSettings.fontFamily = font;
    this.applyFontSettings();
    this.saveSettings();
  }

  setTextAlign(align) {
    this.currentSettings.textAlign = align;
    this.applyFontSettings();
    this.saveSettings();
    this.updateButtonStates();
  }

  setReadingMode(mode) {
    console.log("Setting reading mode to:", mode);

    this.currentSettings.readingMode = mode;

    const bookContent = document.getElementById("book-content");
    if (!bookContent) {
      console.error("Book content element not found");
      return;
    }

    // Убираем предыдущие обработчики
    this.removePageNavigation();

    if (mode === "page") {
      this.setupPageMode();
    } else {
      this.setupScrollMode();
    }

    this.saveSettings();
    this.updateButtonStates();
  }

  setupScrollMode() {
    console.log("Setting up scroll mode");
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    // Убираем классы режимов
    bookContent.classList.remove("page-mode");
    bookContent.classList.add("scroll-mode");

    // Сбрасываем стили
    bookContent.style.transform = "none";
    bookContent.style.transition = "none";
    bookContent.style.width = "auto";
    bookContent.style.whiteSpace = "normal";
    bookContent.style.height = "auto";

    // Восстанавливаем нормальное отображение глав
    const chapters = bookContent.querySelectorAll(".chapter");
    chapters.forEach((chapter) => {
      chapter.style.display = "block";
      chapter.style.width = "auto";
      chapter.style.marginBottom = "3rem";
    });

    // Показываем контролы для прокрутки
    this.toggleReadingControls(false);
  }

  setupPageMode() {
    console.log("Setting up page mode");
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    // Добавляем классы режимов
    bookContent.classList.remove("scroll-mode");
    bookContent.classList.add("page-mode");

    // Настраиваем стили для постраничного режима
    bookContent.style.transition = "transform 0.3s ease";
    bookContent.style.whiteSpace = "nowrap";
    bookContent.style.overflow = "hidden";
    bookContent.style.height = "calc(100vh - 200px)";

    // Настраиваем главы для горизонтального отображения
    const chapters = bookContent.querySelectorAll(".chapter");
    const viewportWidth = window.innerWidth;

    chapters.forEach((chapter, index) => {
      chapter.style.display = "inline-block";
      chapter.style.width = `${viewportWidth}px`;
      chapter.style.verticalAlign = "top";
      chapter.style.whiteSpace = "normal";
      chapter.style.height = "100%";
      chapter.style.overflowY = "auto";
      chapter.style.padding = "2rem";
      chapter.style.boxSizing = "border-box";
      chapter.style.marginBottom = "0";
    });

    // Устанавливаем общую ширину
    bookContent.style.width = `${chapters.length * viewportWidth}px`;

    // Рассчитываем страницы
    this.calculatePages();
    this.showCurrentPage();

    // Добавляем обработчики навигации
    this.setupPageNavigation();

    // Показываем контролы для перелистывания
    this.toggleReadingControls(true);
  }

  toggleReadingControls(show) {
    const readingControls = document.getElementById("reading-controls");
    if (readingControls) {
      readingControls.style.display = show ? "block" : "none";
    }
  }

  setupPageNavigation() {
    // Клавиатура
    document.addEventListener("keydown", this.boundHandleKeyboardNavigation);

    // Колесико мыши
    document.addEventListener("wheel", this.boundHandleWheelNavigation, {
      passive: false,
    });

    // Свайпы для мобильных
    this.setupTouchNavigation();
  }

  removePageNavigation() {
    // Убираем обработчики событий
    document.removeEventListener("keydown", this.boundHandleKeyboardNavigation);
    document.removeEventListener("wheel", this.boundHandleWheelNavigation);
  }

  handleKeyboardNavigation(e) {
    if (this.currentSettings.readingMode !== "page") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    switch (e.key) {
      case "ArrowRight":
      case " ":
        e.preventDefault();
        this.nextPage();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.prevPage();
        break;
    }
  }

  handleWheelNavigation(e) {
    if (this.currentSettings.readingMode !== "page") return;

    e.preventDefault();

    if (e.deltaY > 0) {
      this.nextPage();
    } else if (e.deltaY < 0) {
      this.prevPage();
    }
  }

  setupTouchNavigation() {
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    let startX = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;

      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.nextPage();
        } else {
          this.prevPage();
        }
      }
    };

    bookContent.addEventListener("touchstart", handleTouchStart);
    bookContent.addEventListener("touchend", handleTouchEnd);

    // Сохраняем ссылки для удаления
    this.touchHandlers = { handleTouchStart, handleTouchEnd };
  }

  removeTouchNavigation() {
    const bookContent = document.getElementById("book-content");
    if (!bookContent || !this.touchHandlers) return;

    bookContent.removeEventListener(
      "touchstart",
      this.touchHandlers.handleTouchStart
    );
    bookContent.removeEventListener(
      "touchend",
      this.touchHandlers.handleTouchEnd
    );
  }

  calculatePages() {
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    const chapters = bookContent.querySelectorAll(".chapter");
    this.totalPages = chapters.length;
    this.updatePageInfo();
  }

  showCurrentPage() {
    if (this.currentSettings.readingMode !== "page") return;

    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    const viewportWidth = window.innerWidth;
    const scrollPosition = (this.currentPage - 1) * viewportWidth;

    bookContent.style.transform = `translateX(-${scrollPosition}px)`;
    this.updatePageInfo();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.showCurrentPage();
      this.updatePageInfo();
      this.saveReadingProgress();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.showCurrentPage();
      this.updatePageInfo();
      this.saveReadingProgress();
    }
  }

  updatePageInfo() {
    const currentPageEl = document.getElementById("current-page");
    const totalPagesEl = document.getElementById("total-pages");

    if (currentPageEl) {
      currentPageEl.textContent = this.currentPage;
    }

    if (totalPagesEl) {
      totalPagesEl.textContent = this.totalPages;
    }
  }

  applyFontSettings() {
    const bookContent = document.getElementById("book-content");
    if (!bookContent) return;

    bookContent.style.fontSize = `${this.currentSettings.fontSize}px`;
    bookContent.style.fontFamily = this.currentSettings.fontFamily;
    bookContent.style.textAlign = this.currentSettings.textAlign;

    // Обновляем отображение размера шрифта
    const fontSizeDisplay = document.getElementById("font-size-display");
    if (fontSizeDisplay) {
      fontSizeDisplay.textContent = `${this.currentSettings.fontSize}px`;
    }
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) return;

    const theme = this.themes[themeName];
    Object.keys(theme).forEach((variable) => {
      document.documentElement.style.setProperty(variable, theme[variable]);
    });

    this.currentSettings.theme = themeName;
    this.updateActiveTheme(themeName);
  }

  updateActiveTheme(themeName) {
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.classList.remove("active");
    });

    const activePreset = document.querySelector(`[data-theme="${themeName}"]`);
    if (activePreset) {
      activePreset.classList.add("active");
    }
  }

  updateButtonStates() {
    // Выравнивание текста
    this.updateButtonState(
      "text-align-left",
      this.currentSettings.textAlign === "left"
    );
    this.updateButtonState(
      "text-align-justify",
      this.currentSettings.textAlign === "justify"
    );

    // Режим чтения
    this.updateButtonState(
      "reading-mode-page",
      this.currentSettings.readingMode === "page"
    );
    this.updateButtonState(
      "reading-mode-scroll",
      this.currentSettings.readingMode === "scroll"
    );

    // Тема
    this.updateActiveTheme(this.currentSettings.theme);
  }

  updateButtonState(buttonId, isActive) {
    const button = document.getElementById(buttonId);
    if (button) {
      if (isActive) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    }
  }

  applyAllSettings() {
    this.applyFontSettings();
    this.applyTheme(this.currentSettings.theme);
    this.updateButtonStates();
  }

  setupReadingMode() {
    this.setReadingMode(this.currentSettings.readingMode);
  }

  saveSettings() {
    const settings = {
      ...this.currentSettings,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("reading-settings", JSON.stringify(settings));
  }

  loadSettings() {
    const saved = localStorage.getItem("reading-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings) {
          this.currentSettings = { ...this.currentSettings, ...settings };
        }
      } catch (e) {
        console.error("Error loading reading settings:", e);
      }
    }
  }

  saveReadingProgress() {
    const progressData = {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("reading-progress", JSON.stringify(progressData));
  }

  loadReadingProgress() {
    const saved = localStorage.getItem("reading-progress");
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        if (progress) {
          this.currentPage = progress.currentPage || 1;
          this.totalPages = progress.totalPages || 1;
        }
      } catch (e) {
        console.error("Error loading reading progress:", e);
      }
    }
  }

  openSettings() {
    const sidebar = document.getElementById("settings-sidebar");
    if (sidebar) {
      sidebar.classList.add("open");
    }
  }

  closeSettings() {
    const sidebar = document.getElementById("settings-sidebar");
    if (sidebar) {
      sidebar.classList.remove("open");
    }
  }
}

// Инициализация при загрузке документа
document.addEventListener("DOMContentLoaded", function () {
  window.readingSettings = new ReadingSettings();

  // Глобальные функции для вызова из HTML
  window.openReadingSettings = function () {
    if (window.readingSettings) {
      window.readingSettings.openSettings();
    }
  };

  window.closeReadingSettings = function () {
    if (window.readingSettings) {
      window.readingSettings.closeSettings();
    }
  };
});
