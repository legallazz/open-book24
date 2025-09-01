class ColorSettings {
  constructor() {
    this.currentTheme = "dark";
    this.themes = {
      light: {
        "--reader-background": "#f8fafc",
        "--reader-page": "#ffffff",
        "--reader-text": "#1f2937",
      },
      dark: {
        "--reader-background": "#111827",
        "--reader-page": "#1f2937",
        "--reader-text": "#f9fafb",
      },
      sepia: {
        "--reader-background": "#f5e6d3",
        "--reader-page": "#fdf6e3",
        "--reader-text": "#5c4b37",
      },
      blue: {
        "--reader-background": "#e0f2fe",
        "--reader-page": "#f0f9ff",
        "--reader-text": "#0c4a6e",
      },
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
    this.applyTheme(this.currentTheme);
  }

  bindEvents() {
    // Обработчики для кнопок выбора темы
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.addEventListener("click", () => {
        const theme = preset.dataset.theme;
        this.applyTheme(theme);
        this.saveSettings();
      });
    });

    // Кнопка закрытия модального окна
    document
      .getElementById("close-color-modal")
      ?.addEventListener("click", () => {
        this.closeModal();
      });

    // Кнопка применения настроек
    document.getElementById("apply-colors")?.addEventListener("click", () => {
      this.saveSettings();
      this.closeModal();
    });

    // Кнопка сброса настроек
    document.getElementById("reset-colors")?.addEventListener("click", () => {
      this.resetToDefault();
    });
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) return;

    this.currentTheme = themeName;
    const theme = this.themes[themeName];

    // Применяем цвета к CSS переменным
    Object.keys(theme).forEach((variable) => {
      document.documentElement.style.setProperty(variable, theme[variable]);
    });

    // Обновляем активную тему в интерфейсе
    this.updateActiveTheme(themeName);

    // Обновляем предпросмотр
    this.updatePreview(theme);
  }

  updateActiveTheme(themeName) {
    // Убираем активный класс у всех пресетов
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.classList.remove("active");
    });

    // Добавляем активный класс выбранному пресету
    const activePreset = document.querySelector(`[data-theme="${themeName}"]`);
    if (activePreset) {
      activePreset.classList.add("active");
    }
  }

  updatePreview(theme) {
    const preview = document.querySelector(".reading-preview");
    if (preview) {
      preview.style.backgroundColor = theme["--reader-page"];
      preview.style.color = theme["--reader-text"];
    }
  }

  saveSettings() {
    const settings = {
      theme: this.currentTheme,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("reader-color-settings", JSON.stringify(settings));

    // Показываем уведомление
    this.showNotification("Настройки сохранены", "success");
  }

  loadSettings() {
    const saved = localStorage.getItem("reader-color-settings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.theme && this.themes[settings.theme]) {
          this.currentTheme = settings.theme;
          this.applyTheme(settings.theme);
        }
      } catch (e) {
        console.error("Error loading color settings:", e);
      }
    }
  }

  resetToDefault() {
    this.applyTheme("dark");
    this.saveSettings();
  }

  openModal() {
    const modal = document.getElementById("color-modal");
    if (modal) {
      modal.classList.add("show");
      this.updateActiveTheme(this.currentTheme);
    }
  }

  closeModal() {
    const modal = document.getElementById("color-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  showNotification(message, type = "info") {
    // Простая реализация уведомления
    const notification = document.createElement("div");
    notification.className = `color-notification color-notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--background-primary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            border-left: 4px solid ${
              type === "success"
                ? "var(--success-color)"
                : "var(--primary-color)"
            };
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Инициализация при загрузке документа
document.addEventListener("DOMContentLoaded", function () {
  window.colorSettings = new ColorSettings();

  // Открытие модального окна по кнопке
  document
    .getElementById("reading-color-settings")
    ?.addEventListener("click", function () {
      window.colorSettings.openModal();
    });

  // Закрытие по клику вне области
  document
    .getElementById("color-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) {
        window.colorSettings.closeModal();
      }
    });
});
