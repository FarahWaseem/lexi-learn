// خدمة للتخزين المحلي
export class StorageService {
  constructor(namespace = 'lexilearn') {
    this.namespace = namespace;
  }

  getKey(key) {
    return `${this.namespace}:${key}`;
  }

  setItem(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(`${this.namespace}:`))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
}

// إنشاء instance افتراضي
export const storage = new StorageService();