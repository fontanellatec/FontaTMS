import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './core/services/theme.service';
import { filter, map } from 'rxjs/operators';
import { MenuConfigService, MenuKey } from './core/services/menu-config.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class App implements OnInit {
  protected readonly title = signal('ERP');
  protected readonly isDark = signal<boolean>(false);
  protected readonly brandColor = signal<string>('#086A54');
  protected readonly pageTitle = signal<string>('Torre de Controle');
  protected readonly userMenuOpen = signal<boolean>(false);
  protected readonly sidebarCollapsed = signal<boolean>(false);
  protected readonly brandLogo = signal<string>('/brand/FontaTmsLogo.png');
  protected get userName() { return this.authService.userName; }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private theme: ThemeService,
    private router: Router,
    private menu: MenuConfigService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.theme.applySaved();
    const theme = this.theme.getTheme();
    this.isDark.set(theme === 'dark');
    this.brandColor.set(this.theme.getPrimaryColor());

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.getPageTitleFromRoute()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(title => {
      this.pageTitle.set(title);
    });

    this.pageTitle.set(this.getPageTitleFromRoute());
  }

  private getPageTitleFromRoute(): string {
    const url = this.router.url;
    if (url.startsWith('/login')) return 'Login';
    if (url.includes('/rastreamento')) return 'Rastreamento';
    if (url.includes('/torre-controle')) return 'Torre de Controle';
    if (url.includes('/programacao')) return 'Programação';
    if (url.includes('/controle-intencao-viagem')) return 'Controle de Pré-Carga';
    if (url.includes('/timeline-logistica')) return 'Timeline Logística';
    return 'Torre de Controle';
  }

  getPageTitle(): string {
    return this.pageTitle();
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.theme.setTheme(next as 'light' | 'dark');
    this.isDark.set(next === 'dark');
  }

  onColorChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const hex = input.value;
    this.theme.setPrimaryColor(hex);
    this.brandColor.set(hex);
  }

  resetBrandColor(): void {
    const hex = '#086A54';
    this.theme.setPrimaryColor(hex);
    this.brandColor.set(hex);
  }

  isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  logout(): void {
    this.authService.logout();
  }

  isMenuEnabled(key: MenuKey): boolean { return this.menu.isEnabled(key); }
  toggleUserMenu(): void { this.userMenuOpen.set(!this.userMenuOpen()); }
  closeUserMenu(): void { this.userMenuOpen.set(false); }
  toggleSidebar(): void { this.sidebarCollapsed.set(!this.sidebarCollapsed()); }
  useFallbackLogo(): void { this.brandLogo.set('/brand/FontaTmsLogo.png'); }
}
