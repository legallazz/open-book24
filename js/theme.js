// Theme management system
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem("theme") || "dark";
    this.init();
  }

  init() {
    this.applyTheme();
    this.bindEvents();
  }

  applyTheme() {
    // Remove existing theme styles
    document.getElementById("theme-style")?.remove();

    // Create new theme link
    const themeLink = document.createElement("link");
    themeLink.id = "theme-style";
    themeLink.rel = "stylesheet";
    themeLink.href = `styles/${this.theme}-theme.css`;

    document.head.appendChild(themeLink);

    // Update theme toggle icons
    this.updateThemeToggle();
  }

  updateThemeToggle() {
    const sunIcon = document.querySelector(".sun-icon");
    const moonIcon = document.querySelector(".moon-icon");

    if (this.theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", this.theme);

    // Add pulse animation
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.classList.add("pulse");
      setTimeout(() => {
        themeToggle.classList.remove("pulse");
      }, 600);
    }

    this.applyTheme();

    // Dispatch theme change event
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme: this.theme },
      })
    );
  }

  bindEvents() {
    // Find theme toggle button
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addListener((e) => {
        if (!localStorage.getItem("theme")) {
          this.theme = e.matches ? "dark" : "light";
          this.applyTheme();
        }
      });
    }
  }

  getTheme() {
    return this.theme;
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    localStorage.setItem("theme", newTheme);
    this.applyTheme();
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.themeManager = new ThemeManager();
});
