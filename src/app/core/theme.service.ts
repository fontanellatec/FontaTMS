import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeKey = 'erp_theme';
  private readonly colorKey = 'erp_brand_color';

  setTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(this.themeKey, theme); } catch {}
  }

  toggleTheme(): void {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  getTheme(): 'light' | 'dark' {
    const attr = document.documentElement.getAttribute('data-theme');
    return (attr as 'light' | 'dark') || 'light';
  }

  setPrimaryColor(hex: string): void {
    document.documentElement.style.setProperty('--brand', hex);
    try { localStorage.setItem(this.colorKey, hex); } catch {}
  }

  getPrimaryColor(): string {
    const stored = (() => { try { return localStorage.getItem(this.colorKey); } catch { return null; } })();
    if (stored) return stored;
    const cs = getComputedStyle(document.documentElement);
    const val = cs.getPropertyValue('--brand').trim();
    return val || '#2563eb';
  }

  applySaved(): void {
    const savedTheme = (() => { try { return localStorage.getItem(this.themeKey); } catch { return null; } })() as 'light' | 'dark' | null;
    const savedColor = (() => { try { return localStorage.getItem(this.colorKey); } catch { return null; } })();
    this.setTheme(savedTheme || 'light');
    if (savedColor) this.setPrimaryColor(savedColor);
  }
}