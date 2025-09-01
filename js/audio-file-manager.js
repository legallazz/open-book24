// Audio file manager for handling different file naming conventions
class AudioFileManager {
  constructor() {
    this.supportedFormats = [".mp3", ".m4a", ".aac", ".ogg", ".wav"];
    this.commonPatterns = [
      // Нумерованные паттерны
      /(\d+)\.mp3$/i,
      /chapter[_\s-]*(\d+)\.mp3$/i,
      /track[_\s-]*(\d+)\.mp3$/i,
      /part[_\s-]*(\d+)\.mp3$/i,
      /audio[_\s-]*(\d+)\.mp3$/i,

      // Паттерны с префиксами
      /ch[_\s-]*(\d+)\.mp3$/i,
      /tr[_\s-]*(\d+)\.mp3$/i,
      /pt[_\s-]*(\d+)\.mp3$/i,

      // Паттерны с ведущими нулями
      /(\d{2,})\.mp3$/i,
      /chapter[_\s-]*(\d{2,})\.mp3$/i,
    ];
  }

  // Получить отображаемое имя для файла
  getDisplayName(filename, index) {
    // Пытаемся извлечь номер из имени файла
    const number = this.extractNumberFromFilename(filename);

    if (number !== null) {
      return `Глава ${number}`;
    }

    // Пытаемся извлечь осмысленное имя
    const meaningfulName = this.extractMeaningfulName(filename);
    if (meaningfulName) {
      return meaningfulName;
    }

    // Fallback: используем индекс
    return `Аудио ${index + 1}`;
  }

  extractNumberFromFilename(filename) {
    for (const pattern of this.commonPatterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  extractMeaningfulName(filename) {
    // Удаляем расширение
    const nameWithoutExt = filename.replace(/\.\w+$/, "");

    // Удаляем общие префиксы
    let cleanName = nameWithoutExt
      .replace(/^(chapter|track|part|audio|ch|tr|pt)[_\s-]*/i, "")
      .replace(/[_\s-]+/g, " ")
      .trim();

    // Пытаемся извлечь номер в конце
    const numberMatch = cleanName.match(/(.*?)(\d+)$/);
    if (numberMatch) {
      const baseName = numberMatch[1].trim();
      const number = numberMatch[2];
      return baseName ? `${baseName} ${number}` : `Глава ${number}`;
    }

    // Если имя не пустое и не состоит только из цифр
    if (cleanName && !/^\d+$/.test(cleanName)) {
      return cleanName;
    }

    return null;
  }

  // Сортировка файлов по предполагаемому порядку
  sortFilesByOrder(files) {
    return files.sort((a, b) => {
      const numA =
        this.extractNumberFromFilename(a) || this.getFallbackOrder(a);
      const numB =
        this.extractNumberFromFilename(b) || this.getFallbackOrder(b);
      return numA - numB;
    });
  }

  getFallbackOrder(filename) {
    // Извлекаем все числа из имени файла
    const numbers = filename.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]);
    }

    // Используем лексикографический порядок как fallback
    return filename.charCodeAt(0);
  }

  // Генерация понятных имен для списка
  generateDisplayNames(files) {
    return files.map((file, index) => this.getDisplayName(file, index));
  }

  // Проверка существования файла
  async checkFileExists(url) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Поиск действительного аудиофайла
  async findValidAudioFile(basePath, possibleFilenames) {
    for (const filename of possibleFilenames) {
      const fullPath = `${basePath}${filename}`;
      if (await this.checkFileExists(fullPath)) {
        return { filename, fullPath, exists: true };
      }
    }
    return { exists: false };
  }
}

// Initialize globally
window.audioFileManager = new AudioFileManager();
