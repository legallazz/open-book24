// Color customization system for reading experience
class ColorCustomizer {
  constructor() {
    this.currentColors = {
      background: "#f8fafc",
      page: "#ffffff",
      text: "#1f2937",
    };
    this.isModalOpen = false;
    this.bookId = "";
    this.init();
  }

  init() {
    // Get book ID from config
    const bookConfig = window.bookConfig.getCurrentBook();
    this.bookId = bookConfig ? bookConfig.id : "unknown";

    this.loadSavedColors();
    this.bindEvents();
    this.setupColorPresets();
    this.updateThemePresets();

    window.addEventListener("themechange", () => {
      this.updateThemePresets();
    });
  }

  bindEvents() {
    // Modal controls
    const customizeBtn = document.getElementById("customize-colors");
    const closeModalBtn = document.getElementById("close-color-modal");
    const modal = document.getElementById("color-modal");

    if (customizeBtn) {
      customizeBtn.addEventListener("click", () => this.openModal());
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => this.closeModal());
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // Color picker inputs
    const backgroundPicker = document.getElementById("background-color-picker");
    const pagePicker = document.getElementById("page-color-picker");
    const textPicker = document.getElementById("text-color-picker");

    if (backgroundPicker) {
      backgroundPicker.addEventListener("input", (e) => {
        this.updateColor("background", e.target.value);
      });
    }

    if (pagePicker) {
      pagePicker.addEventListener("input", (e) => {
        this.updateColor("page", e.target.value);
      });
    }

    if (textPicker) {
      textPicker.addEventListener("input", (e) => {
        this.updateColor("text", e.target.value);
      });
    }

    // Action buttons
    const resetBtn = document.getElementById("reset-colors");
    const applyBtn = document.getElementById("apply-colors");

    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetColors());
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => this.applyAndCloseModal());
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalOpen) {
        this.closeModal();
      }
    });
  }

  setupColorPresets() {
    // Background color presets
    const backgroundPresets = document.getElementById("background-presets");
    if (backgroundPresets) {
      this.bindPresetEvents(backgroundPresets, "background");
    }

    // Page color presets
    const pagePresets = document.getElementById("page-presets");
    if (pagePresets) {
      this.bindPresetEvents(pagePresets, "page");
    }

    // Text color presets
    const textPresets = document.getElementById("text-presets");
    if (textPresets) {
      this.bindPresetEvents(textPresets, "text");
    }

    // Theme presets
    this.setupThemePresets();
  }

  setupThemePresets() {
    const themePresets = document.querySelectorAll(".theme-preset");
    themePresets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const theme = preset.dataset.theme;
        this.applyTheme(theme);
        this.updateThemeSelection(preset);
      });
    });
  }

  applyTheme(theme) {
    const baseTheme = theme.includes("dark") ? "dark" : "light"; // Определяем базовый режим
    const themes = {
      light: {
        background: "#f8fafc",
        page: "#ffffff",
        text: "#1f2937",
        base: "light",
      },
      "light-warm": {
        background: "#fdf2f8", // Очень светлый розовый
        page: "#fefce8", // Очень светлый желтый (пергамент)
        text: "#374151", // Серо-синий
        base: "light",
      },
      "light-sepia": {
        background: "#f7fee7", // Очень светлый зеленоватый
        page: "#f7fee7", // Тот же цвет для фона страницы
        text: "#4b5563", // Серый
        base: "light",
      },
      "light-blue": {
        background: "#f0f9ff", // Очень светлый голубой
        page: "#eff6ff", // Очень светлый синий
        text: "#1e40af", // Темно-синий
        base: "light",
      },
      dark: {
        background: "#0f172a",
        page: "#1e293b",
        text: "#f8fafc",
        base: "dark",
      },
      "dark-warm": {
        background: "#1c1917", // Темно-коричневый
        page: "#292524", // Чуть светлее коричневый
        text: "#e7e5e4", // Светло-бежевый
        base: "dark",
      },
      "dark-green": {
        background: "#14532d", // Темно-зеленый
        page: "#166534", // Зеленый
        text: "#dcfce7", // Светло-зеленый
        base: "dark",
      },
      "dark-blue": {
        background: "#0c4a6e", // Темно-синий
        page: "#075985", // Синий
        text: "#dbeafe", // Светло-голубой
        base: "dark",
      },
    };

    const themeColors = themes[theme];
    if (themeColors) {
      this.currentColors = { ...themeColors };
      this.applyColors();
      this.updateColorPickers();
      this.clearPresetSelections();

      // Также, если глобальный ThemeManager активен, синхронизируем базовую тему
      if (window.themeManager && themeColors.base) {
        // Внимание: это может конфликтовать с существующей логикой ThemeManager
        // Возможно, стоит только менять цвета читалки, а не всю тему сайта
        // window.themeManager.setTheme(themeColors.base);
      }
    }
  }

  updateThemeSelection(selectedPreset) {
    // Remove active class from all theme presets
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.classList.remove("active");
    });

    // Add active class to selected preset
    selectedPreset.classList.add("active");
  }

  bindPresetEvents(presetContainer, colorType) {
    const presets = presetContainer.querySelectorAll(".color-preset");
    presets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const color = preset.dataset.color;
        this.updateColor(colorType, color);
        this.updateColorPicker(colorType, color);
        this.updatePresetSelection(presetContainer, preset);
      });
    });
  }

  updatePresetSelection(container, selectedPreset) {
    // Remove active class from all presets in container
    container.querySelectorAll(".color-preset").forEach((preset) => {
      preset.classList.remove("active");
    });

    // Add active class to selected preset
    selectedPreset.classList.add("active");
  }

  updateThemePresets() {
    const currentTheme = window.themeManager
      ? window.themeManager.getTheme()
      : "light";

    // Update preset colors based on theme
    if (currentTheme === "dark") {
      this.updatePresetColors("dark");
    } else {
      this.updatePresetColors("light");
    }
  }

  updatePresetColors(theme) {
    const presets = {
      light: {
        background: ["#f8fafc", "#fdf2f8", "#f0fdf4", "#f0f9ff"],
        page: ["#ffffff", "#fefce8", "#f7fee7", "#eff6ff"],
        text: ["#1f2937", "#374151", "#4b5563", "#6b7280"],
      },
      dark: {
        background: ["#0f172a", "#1c1917", "#14532d", "#0c4a6e"],
        page: ["#1e293b", "#292524", "#166534", "#075985"],
        text: ["#f8fafc", "#e7e5e4", "#dcfce7", "#dbeafe"],
      },
    };

    const themePresets = presets[theme];

    // Update background presets
    const backgroundContainer = document.getElementById("background-presets");
    if (backgroundContainer && themePresets) {
      const backgroundPresetEls =
        backgroundContainer.querySelectorAll(".color-preset");
      backgroundPresetEls.forEach((preset, index) => {
        if (themePresets.background[index]) {
          preset.dataset.color = themePresets.background[index];
          preset.style.background = themePresets.background[index];
        }
      });
    }

    // Update page presets
    const pageContainer = document.getElementById("page-presets");
    if (pageContainer && themePresets) {
      const pagePresetEls = pageContainer.querySelectorAll(".color-preset");
      pagePresetEls.forEach((preset, index) => {
        if (themePresets.page[index]) {
          preset.dataset.color = themePresets.page[index];
          preset.style.background = themePresets.page[index];
        }
      });
    }

    // Update text presets
    const textContainer = document.getElementById("text-presets");
    if (textContainer && themePresets) {
      const textPresetEls = textContainer.querySelectorAll(".color-preset");
      textPresetEls.forEach((preset, index) => {
        if (themePresets.text[index]) {
          preset.dataset.color = themePresets.text[index];
          preset.style.background = themePresets.text[index];
        }
      });
    }
  }

  updateColor(type, color) {
    this.currentColors[type] = color;
    this.applyColors();
  }

  updateColorPicker(type, color) {
    const picker = document.getElementById(`${type}-color-picker`);
    if (picker) {
      picker.value = color;
    }
  }

  applyColors() {
    const root = document.documentElement;

    // Apply colors to CSS custom properties
    root.style.setProperty(
      "--reader-background",
      this.currentColors.background
    );
    root.style.setProperty("--reader-page", this.currentColors.page);
    root.style.setProperty("--reader-text", this.currentColors.text);

    // Update preview
    this.updatePreview();

    // Убрал вызов несуществующего метода
    // if (window.themeManager) {
    //   window.themeManager.updateReaderColors(this.currentColors);
    // }
  }

  updatePreview() {
    const preview = document.querySelector(".reading-preview");
    if (preview) {
      preview.style.background = this.currentColors.page;
      preview.style.color = this.currentColors.text;
    }
  }

  resetColors() {
    const currentTheme = window.themeManager
      ? window.themeManager.getTheme()
      : "light";

    if (currentTheme === "dark") {
      this.currentColors = {
        background: "#0f172a",
        page: "#1e293b",
        text: "#f8fafc",
      };
    } else {
      this.currentColors = {
        background: "#f8fafc",
        page: "#ffffff",
        text: "#1f2937",
      };
    }

    this.applyColors();
    this.updateColorPickers();
    this.clearPresetSelections();
  }

  updateColorPickers() {
    this.updateColorPicker("background", this.currentColors.background);
    this.updateColorPicker("page", this.currentColors.page);
    this.updateColorPicker("text", this.currentColors.text);
  }

  clearPresetSelections() {
    document.querySelectorAll(".color-preset").forEach((preset) => {
      preset.classList.remove("active");
    });
  }

  openModal() {
    const modal = document.getElementById("color-modal");
    if (modal) {
      modal.classList.add("show");
      this.isModalOpen = true;

      // Update color pickers with current values
      this.updateColorPickers();

      // Focus first color picker for accessibility
      const firstPicker = document.getElementById("background-color-picker");
      if (firstPicker) {
        setTimeout(() => firstPicker.focus(), 100);
      }
    }
  }

  closeModal() {
    const modal = document.getElementById("color-modal");
    if (modal) {
      modal.classList.remove("show");
      this.isModalOpen = false;
    }
  }

  applyAndCloseModal() {
    this.saveColors();
    this.closeModal();

    // Show confirmation
    this.showNotification("Цвета сохранены", "success");
  }

  saveColors() {
    const colorData = {
      colors: this.currentColors,
      bookId: this.bookId,
      timestamp: new Date().toISOString(),
      theme: window.themeManager ? window.themeManager.getTheme() : "light",
    };

    localStorage.setItem(
      `reader-colors-${this.bookId}`,
      JSON.stringify(colorData)
    );

    // Also save global color preferences
    localStorage.setItem(
      "reader-colors-global",
      JSON.stringify(this.currentColors)
    );
  }

  loadSavedColors() {
    // Try to load book-specific colors first
    const bookSpecific = localStorage.getItem(`reader-colors-${this.bookId}`);
    if (bookSpecific) {
      try {
        const data = JSON.parse(bookSpecific);
        this.currentColors = data.colors;
        this.applyColors();
        return;
      } catch (e) {
        console.error("Error loading book-specific colors:", e);
      }
    }

    // Fall back to global colors
    const globalColors = localStorage.getItem("reader-colors-global");
    if (globalColors) {
      try {
        this.currentColors = JSON.parse(globalColors);
        this.applyColors();
        return;
      } catch (e) {
        console.error("Error loading global colors:", e);
      }
    }

    // Fall back to theme-appropriate defaults
    this.resetColors();
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `color-notification color-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: var(--background-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem 1.5rem;
      box-shadow: var(--shadow-lg);
      z-index: 1001;
      max-width: 300px;
      animation: slideInRight 0.3s ease;
      ${
        type === "success" ? "border-left: 4px solid var(--success-color);" : ""
      }
      ${type === "error" ? "border-left: 4px solid var(--error-color);" : ""}
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${
          type === "success"
            ? `
          <svg style="width: 1.25rem; height: 1.25rem; color: var(--success-color); flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
        `
            : ""
        }
        <span style="color: var(--text-primary);">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Public API methods
  getColors() {
    return { ...this.currentColors };
  }

  setColors(colors) {
    this.currentColors = { ...this.currentColors, ...colors };
    this.applyColors();
    this.updateColorPickers();
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
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

// Initialize color customizer on book pages
document.addEventListener("DOMContentLoaded", () => {
  const colorModal = document.getElementById("color-modal");
  if (colorModal) {
    window.colorCustomizer = new ColorCustomizer();
  }
});
