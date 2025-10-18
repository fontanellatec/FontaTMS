import { Component, OnInit, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('ERP');
  protected readonly isDark = signal<boolean>(false);
  protected readonly brandColor = signal<string>('#0d9488');
  protected readonly pageTitle = signal<string>('Dashboard');

  constructor(
    private theme: ThemeService,
    private router: Router
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
    if (url.includes('/shipments')) return 'Embarques';
    if (url.includes('/vehicles')) return 'Veículos';
    if (url.includes('/drivers')) return 'Motoristas';
    if (url.includes('/gestao-motoristas')) return 'Gestão de Motoristas';
    if (url.includes('/rastreamento')) return 'Rastreamento';
    if (url.includes('/programacao')) return 'Programação';
    if (url.includes('/embarque')) return 'Intenção de Embarque';
    if (url.includes('/controle-embarques')) return 'Controle de Embarques';
    if (url.includes('/controle-colaboradores')) return 'Controle de Colaboradores';
    if (url.includes('/contratos')) return 'Contratos';
    if (url.includes('/controle-frota')) return 'Controle de Frota';
    if (url.includes('/acerto-viagem')) return 'Acerto de Viagem';
    return 'Dashboard';
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
    const hex = '#0d9488';
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
}
