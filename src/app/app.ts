import { Component, OnInit, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { filter, map } from 'rxjs/operators';
import { MenuConfigService, MenuKey } from './core/menu-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('ERP');
  protected readonly isDark = signal<boolean>(false);
  protected readonly brandColor = signal<string>('#086A54');
  protected readonly pageTitle = signal<string>('Torre de Controle');
  protected readonly userMenuOpen = signal<boolean>(false);
  protected readonly sidebarCollapsed = signal<boolean>(false);
  protected readonly brandLogo = signal<string>('/brand/FontaTmsLogo.png');

  constructor(
    private theme: ThemeService,
    private router: Router,
    private menu: MenuConfigService
  ) {}

  ngOnInit(): void {
    this.theme.applySaved();
    const theme = this.theme.getTheme();
    this.isDark.set(theme === 'dark');
    this.brandColor.set(this.theme.getPrimaryColor());

    // Update page title based on route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.getPageTitleFromRoute())
    ).subscribe(title => {
      this.pageTitle.set(title);
    });

    // Set initial page title
    this.pageTitle.set(this.getPageTitleFromRoute());
  }

  private getPageTitleFromRoute(): string {
    const url = this.router.url;
    if (url === '/dashboard') return 'Dashboard';
    if (url.startsWith('/login')) return 'Login';
    if (url.includes('/jornada')) return 'Jornada';
    if (url.includes('/financeiro')) return 'Financeiro';
    if (url.includes('/manutencao')) return 'Manutenção';
    if (url.includes('/producao-oficina')) return 'Produção Oficina';
    if (url.includes('/shipments')) return 'Intenção de Viagem';
    if (url.includes('/vehicles')) return 'Veículos';
    if (url.includes('/drivers')) return 'Motoristas';
    if (url.includes('/gestao-motoristas')) return 'Gestão de Motoristas';
    if (url.includes('/rastreamento')) return 'Rastreamento';
    if (url.includes('/torre-controle')) return 'Torre de Controle';
    if (url.includes('/programacao')) return 'Programação';
    if (url.includes('/intencao-viagem')) return 'Intenção de Viagem';
    if (url.includes('/controle-intencao-viagem')) return 'Controle de Pré-Carga';
    if (url.includes('/controle-colaboradores')) return 'Controle de Colaboradores';
    if (url.includes('/contratos')) return 'Contratos';
    if (url.includes('/controle-frota')) return 'Controle de Frota';
    if (url.includes('/precificacao-abastecimento')) return 'Abastecimento';
    if (url.includes('/acerto-viagem')) return 'Acerto de Viagem';
    if (url.includes('/frete-terceiro')) return 'Frete Terceiro';
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
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('isAuthenticated');
    this.router.navigate(['/login']);
  }

  isMenuEnabled(key: MenuKey): boolean { return this.menu.isEnabled(key); }
  toggleUserMenu(): void { this.userMenuOpen.set(!this.userMenuOpen()); }
  closeUserMenu(): void { this.userMenuOpen.set(false); }
  toggleSidebar(): void { this.sidebarCollapsed.set(!this.sidebarCollapsed()); }
  useFallbackLogo(): void { this.brandLogo.set('/brand/FontaTmsLogo.png'); }
}
