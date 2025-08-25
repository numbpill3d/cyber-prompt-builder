export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

class BrowserStorage implements StorageInterface {
  getItem(key: string): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
class BrowserStorage implements StorageInterface {
  getItem(key: string): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }
  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  }
  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }
  keys(): string[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const result: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) result.push(k);
      }
      return result;
    } catch (error) {
      console.error('Error accessing localStorage keys:', error);
      return [];
    }
  }
}
  removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
  keys(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) result.push(k);
    }
    return result;
  }
}

import fs from 'fs';
import path from 'path';

class NodeStorage implements StorageInterface {
  private data: Record<string, string> = {};
  private file: string;

  constructor(filePath: string = path.join(process.cwd(), 'storage.json')) {
    this.file = filePath;
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.file)) {
        this.data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      }
    } catch {
      this.data = {};
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch {
      // ignore write errors
    }
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
    this.save();
  }

  removeItem(key: string): void {
    delete this.data[key];
    this.save();
  }

  keys(): string[] {
    return Object.keys(this.data);
  }
}

let storage: StorageInterface | null = null;

export function getStorage(): StorageInterface {
  if (!storage) {
    if (typeof window === 'undefined') {
      storage = new NodeStorage();
    } else {
      storage = new BrowserStorage();
    }
  }
  return storage;
}
