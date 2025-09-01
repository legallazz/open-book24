class AudioPlayer {
  constructor() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 1.0;
    this.audioElement = null;
    this.currentChapter = 1;
    this.totalChapters = 0;
    this.audioFolder = "";
    this.bookId = "";
    this.demoInterval = null;
    this.isDemoMode = false;
    this.audioFileNames = [];
    this.audioFilePaths = [];
    this.durationCache = {};
  }

  init() {
    const bookConfig = window.bookConfig.getCurrentBook();
    if (!bookConfig) {
      console.error("Book configuration not found");
      return;
    }

    this.bookId = bookConfig.id;
    this.audioFolder = bookConfig.audioFolder || "";
    this.totalChapters = parseInt(bookConfig.audioCount || "0");
    this.audioFileNames = bookConfig.audioFileNames || [];
    this.audioFilePaths = bookConfig.audioFiles || [];

    this.createAudioElement();
    this.bindEvents();
    this.loadAudioState();
    this.generateChaptersList();
    this.setVolume(0.5);
  }

  createAudioElement() {
    this.audioElement = document.createElement("audio");
    this.audioElement.preload = "metadata";
    this.audioElement.style.display = "none";
    document.body.appendChild(this.audioElement);

    this.audioElement.addEventListener("loadedmetadata", () => {
      if (!isNaN(this.audioElement.duration)) {
        this.duration = this.audioElement.duration;
      } else {
        console.warn("Invalid duration from audio file, using fallback");
        this.duration = 180;
      }
      this.updateTimeDisplay();
    });

    this.audioElement.addEventListener("error", (e) => {
      console.error("Audio element error:", e);
      this.handleAudioError();
    });

    this.audioElement.addEventListener("stalled", () => {
      console.warn("Audio stalled");
      this.handleAudioError();
    });
  }

  async generateChaptersList() {
    const chaptersGrid = document.getElementById("chapters-grid");
    const currentChapterInfo = document.getElementById("current-chapter-info");

    if (!chaptersGrid) return;

    const listenedChapters = this.getListenedChapters();

    let html = "";
    for (let i = 1; i <= this.totalChapters; i++) {
      const isListened = listenedChapters.includes(i);
      const chapterName = this.getChapterName(i);

      html += `
        <div class="chapter-item ${i === this.currentChapter ? "active" : ""} ${
        isListened ? "listened" : ""
      }" data-chapter="${i}">
          <div class="chapter-info">
            <span class="chapter-number">
              ${isListened ? "" : ""}
              ${chapterName}
            </span>
          </div>
          <button class="chapter-play-btn" data-chapter="${i}" aria-label="Воспроизвести ${chapterName}">
            <i class="fas fa-play"></i>
          </button>
        </div>
      `;
    }
    chaptersGrid.innerHTML = html;

    chaptersGrid.querySelectorAll(".chapter-play-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const chapter = parseInt(
          e.target.closest("[data-chapter]").dataset.chapter
        );
        this.playChapter(chapter);
      });
    });

    if (currentChapterInfo) {
      currentChapterInfo.textContent =
        this.totalChapters > 0
          ? `Доступно ${this.totalChapters} аудиофайлов`
          : "Аудиофайлы временно недоступны";
    }
  }

  getChapterName(chapterNumber) {
    if (this.audioFileNames.length >= chapterNumber) {
      return this.audioFileNames[chapterNumber - 1];
    }
    return `Глава ${chapterNumber}`;
  }

  getAudioFilePath(chapter) {
    if (this.audioFilePaths.length >= chapter) {
      const fileName = this.audioFilePaths[chapter - 1];
      return `${this.audioFolder}${fileName}`;
    }

    const formats = [
      `${String(chapter).padStart(2, "0")}.mp3`,
      `${chapter}.mp3`,
      `chapter-${chapter}.mp3`,
      `track-${chapter}.mp3`,
      `part-${String(chapter).padStart(2, "0")}.mp3`,
      `audio-${chapter}.mp3`,
      `glava-${chapter}.mp3`,
      `file-${String(chapter).padStart(3, "0")}.mp3`,
    ];

    return `${this.audioFolder}${formats[0]}`;
  }

  playChapter(chapter) {
    if (chapter < 1 || chapter > this.totalChapters) return;

    this.currentChapter = chapter;
    const audioPath = this.getAudioFilePath(chapter);

    if (this.audioElement) {
      this.audioElement.src = audioPath;
      this.audioElement.load();

      this.play().catch((error) => {
        console.error("Cannot play chapter:", error);
        this.handleAudioError();
      });

      this.updateChapterInfo();
    }
  }

  async play() {
    if (!this.audioElement || !this.audioElement.src) {
      console.warn("No audio source to play");
      return false;
    }

    try {
      await this.audioElement.play();
      this.isPlaying = true;
      this.isDemoMode = false;
      this.updatePlayButton();
      return true;
    } catch (error) {
      console.error("Playback error:", error);
      throw error;
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      this.updatePlayButton();
    }
  }

  togglePlayPause() {
    if (this.audioElement && this.audioElement.src) {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play().catch((error) => {
          console.error("Playback failed:", error);
          this.handleAudioError();
        });
      }
    } else {
      if (!this.audioElement.src && this.totalChapters > 0) {
        this.playChapter(this.currentChapter);
        return;
      }

      this.isDemoMode = true;
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.startDemoPlayback();
      } else {
        this.stopDemoPlayback();
      }
    }

    this.updatePlayButton();
    this.saveAudioState();
  }

  handleAudioEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.updatePlayButton();
    this.updateProgress();

    this.markChapterAsListened(this.currentChapter);

    // Автопереход к следующей главе
    if (this.currentChapter < this.totalChapters) {
      setTimeout(() => {
        this.playChapter(this.currentChapter + 1);
      }, 1000);
    }
  }

  handleAudioError() {
    console.log("Starting audio demo mode");
    this.isDemoMode = true;
    this.showAudioError();

    this.duration = 180; // 3 минуты fallback
    this.updateTimeDisplay();

    this.startDemoMode();
  }

  startDemoMode() {
    this.updateChapterInfo();
  }

  startDemoPlayback() {
    this.stopDemoPlayback();

    this.demoInterval = setInterval(() => {
      if (this.isPlaying && this.isDemoMode) {
        this.currentTime += 1;
        if (this.currentTime >= this.duration) {
          this.currentTime = this.duration;
          this.isPlaying = false;
          this.updatePlayButton();
          this.stopDemoPlayback();

          if (this.currentChapter < this.totalChapters) {
            setTimeout(() => this.playChapter(this.currentChapter + 1), 1000);
          }
        }
        this.updateProgress();
        this.updateTimeDisplay();
      }
    }, 1000);
  }

  stopDemoPlayback() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }

  seekTo(percentage) {
    const newTime = (percentage / 100) * this.duration;
    this.currentTime = newTime;

    if (this.audioElement && this.audioElement.src && !this.isDemoMode) {
      this.audioElement.currentTime = newTime;
    }

    this.updateProgress();
    this.updateTimeDisplay();
    this.saveAudioState();
  }

  skipForward() {
    const newTime = Math.min(this.currentTime + 30, this.duration);
    this.seekTo((newTime / this.duration) * 100);
  }

  skipBackward() {
    const newTime = Math.max(this.currentTime - 30, 0);
    this.seekTo((newTime / this.duration) * 100);
  }

  toggleMute() {
    if (this.audioElement) {
      this.audioElement.muted = !this.audioElement.muted;
      this.updateMuteButton();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    this.updateMuteButton();
    this.saveAudioState();
  }

  updateChapterInfo() {
    const currentChapterInfo = document.getElementById("current-chapter-info");
    if (currentChapterInfo) {
      const chapterName = this.getChapterName(this.currentChapter);
      currentChapterInfo.textContent =
        this.totalChapters > 0
          ? `${chapterName} (${this.currentChapter} из ${this.totalChapters})`
          : "Демо-режим";
    }

    document.querySelectorAll(".chapter-item").forEach((item) => {
      const chapter = parseInt(item.dataset.chapter);
      item.classList.toggle("active", chapter === this.currentChapter);
    });
  }

  updatePlayButton() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    if (playPauseBtn) {
      const playIcon = playPauseBtn.querySelector(".play-icon");
      const pauseIcon = playPauseBtn.querySelector(".pause-icon");

      if (playIcon && pauseIcon) {
        playIcon.style.display = this.isPlaying ? "none" : "block";
        pauseIcon.style.display = this.isPlaying ? "block" : "none";
      }

      if (this.isDemoMode) {
        playPauseBtn.classList.add("demo-mode");
      } else {
        playPauseBtn.classList.remove("demo-mode");
      }
    }
  }

  updateMuteButton() {
    const muteBtn = document.getElementById("mute-btn");
    const volumeControl = document.getElementById("volume-control");

    if (muteBtn && this.audioElement) {
      const isMuted = this.audioElement.muted || this.volume === 0;
      const volumeIcon = muteBtn.querySelector(".volume-icon");
      const muteIcon = muteBtn.querySelector(".mute-icon");

      if (volumeIcon && muteIcon) {
        volumeIcon.style.display = isMuted ? "none" : "block";
        muteIcon.style.display = isMuted ? "block" : "none";
      }
    }

    if (volumeControl) {
      volumeControl.value = this.volume * 100;
    }
  }

  updateProgress() {
    const progressBar = document.getElementById("audio-progress-bar");
    if (progressBar && this.duration > 0) {
      const percentage = (this.currentTime / this.duration) * 100;
      progressBar.value = percentage;
    }
  }

  updateTimeDisplay() {
    const currentTimeEl = document.getElementById("current-time");
    const totalTimeEl = document.getElementById("total-time");

    const formattedCurrent = this.formatTime(this.currentTime);
    const formattedTotal =
      this.duration > 0 ? this.formatTime(this.duration) : "--:--";

    if (currentTimeEl) {
      currentTimeEl.textContent = formattedCurrent;
    }

    if (totalTimeEl) {
      totalTimeEl.textContent = formattedTotal;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "--:--";
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
  }

  showAudioError() {
    document.querySelectorAll(".audio-notification").forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = "audio-notification";
    notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: var(--error-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-width: 400px;
            animation: fadeIn 0.3s ease;
        `;

    notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 1.25rem;"></i>
                <span>Аудиофайл временно недоступен. Используется демо-режим.</span>
            </div>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  saveAudioState() {
    const state = {
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      volume: this.volume, // Добавляем сохранение громкости
      currentChapter: this.currentChapter,
      timestamp: new Date().toISOString(),
      isDemoMode: this.isDemoMode,
    };

    localStorage.setItem(`audio-state-${this.bookId}`, JSON.stringify(state));
  }

  loadAudioState() {
    const stored = localStorage.getItem(`audio-state-${this.bookId}`);
    if (stored) {
      try {
        const state = JSON.parse(stored);
        const stateAge = Date.now() - new Date(state.timestamp).getTime();

        if (stateAge < 24 * 60 * 60 * 1000) {
          this.currentTime = state.currentTime || 0;
          this.volume = state.volume || 0.5; // Восстанавливаем громкость
          this.currentChapter = state.currentChapter || 1;
          this.isDemoMode = state.isDemoMode || false;

          // Устанавливаем громкость в аудио элементе
          if (this.audioElement) {
            this.audioElement.volume = this.volume;
          }

          this.updateProgress();
          this.updateTimeDisplay();
          this.updateMuteButton();

          if (state.isPlaying) {
            this.isPlaying = true;
          }
        }
        return true;
      } catch (error) {
        console.error("Error loading audio state:", error);
      }
    }
    return false;
  }

  getListenedChapters() {
    const stored = localStorage.getItem(`listened-chapters-${this.bookId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error loading listened chapters:", error);
      }
    }
    return [];
  }

  markChapterAsListened(chapter) {
    const listenedChapters = this.getListenedChapters();
    if (!listenedChapters.includes(chapter)) {
      listenedChapters.push(chapter);
      localStorage.setItem(
        `listened-chapters-${this.bookId}`,
        JSON.stringify(listenedChapters)
      );

      const chapterItem = document.querySelector(`[data-chapter="${chapter}"]`);
      if (chapterItem) {
        chapterItem.classList.add("listened");
        const chapterNumber = chapterItem.querySelector(".chapter-number");
        if (chapterNumber) {
          const chapterName = this.getChapterName(chapter);
          chapterNumber.innerHTML = `${chapterName}`;
        }
      }
    }
  }

  getCurrentChapter() {
    return this.currentChapter;
  }

  getTotalChapters() {
    return this.totalChapters;
  }

  isInDemoMode() {
    return this.isDemoMode;
  }

  reload() {
    this.stopDemoPlayback();
    this.generateChaptersList();
    this.loadAudioState();
  }

  bindEvents() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    const progressBar = document.getElementById("audio-progress-bar");
    const muteBtn = document.getElementById("mute-btn");
    const volumeControl = document.getElementById("volume-control");
    // Кнопки переключения треков
    const prevBtn = document.getElementById("prev-chapter");
    const nextBtn = document.getElementById("next-chapter");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.prevChapter());
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.nextChapter());
    }

    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    }

    if (progressBar) {
      progressBar.addEventListener("input", (e) => this.seekTo(e.target.value));
      progressBar.addEventListener("change", (e) =>
        this.seekTo(e.target.value)
      );
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => this.toggleMute());
    }

    if (volumeControl) {
      volumeControl.addEventListener("input", (e) =>
        this.setVolume(e.target.value / 100)
      );
    }

    if (this.audioElement) {
      this.audioElement.addEventListener("loadedmetadata", () => {
        if (!isNaN(this.audioElement.duration)) {
          this.duration = this.audioElement.duration;
        } else {
          console.warn("Invalid duration from audio file, using fallback");
          this.duration = 180;
        }
        this.updateTimeDisplay();
      });

      this.audioElement.addEventListener("timeupdate", () => {
        this.currentTime = this.audioElement.currentTime;
        this.updateProgress();
        this.updateTimeDisplay();
      });

      this.audioElement.addEventListener("ended", () => {
        this.handleAudioEnded();
      });

      this.audioElement.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        this.handleAudioError();
      });

      this.audioElement.addEventListener("canplay", () => {
        this.isDemoMode = false;
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.code) {
        case "Space":
          if (e.target === document.body) {
            e.preventDefault();
            this.togglePlayPause();
          }
          break;
        case "ArrowLeft":
          if (e.ctrlKey) {
            e.preventDefault();
            this.skipBackward();
          }
          break;
        case "ArrowRight":
          if (e.ctrlKey) {
            e.preventDefault();
            this.skipForward();
          }
          break;
        case "KeyM":
          e.preventDefault();
          this.toggleMute();
          break;
      }
    });
  }
  prevChapter() {
    if (this.currentChapter > 1) {
      this.playChapter(this.currentChapter - 1);
    }
  }

  nextChapter() {
    if (this.currentChapter < this.totalChapters) {
      this.playChapter(this.currentChapter + 1);
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.audioPlayer = new AudioPlayer();
  window.audioPlayer.init();
});

// CSS animations
const audioPlayerStyle = document.createElement("style");
audioPlayerStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .chapter-item.listened {
        background: rgba(16, 185, 129, 0.1);
        border-color: var(--success-color);
    }
    
    .audio-btn.demo-mode {
        opacity: 0.7;
        position: relative;
    }
    
    .audio-btn.demo-mode::after {
        content: "DEMO";
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--warning-color);
        color: white;
        font-size: 0.6rem;
        padding: 2px 4px;
        border-radius: 4px;
    }
`;
document.head.appendChild(audioPlayerStyle);
