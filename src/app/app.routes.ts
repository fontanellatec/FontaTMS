import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'torre-controle', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'rastreamento', 
    loadComponent: () => import('./pages/tracking/list/tracking-list.component').then(m => m.TrackingComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'torre-controle', 
    loadComponent: () => import('./pages/torre-controle/list/torre-controle-list.component').then(m => m.TorreControleComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'programacao', 
    loadComponent: () => import('./pages/programacao/list/programacao-list.component').then(m => m.ProgramacaoComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'controle-intencao-viagem', 
    loadComponent: () => import('./pages/controle-intencao-viagem/list/controle-intencao-viagem-list.component').then(m => m.ControleIntencaoViagemComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'timeline-logistica', 
    loadComponent: () => import('./pages/timeline-logistica/list/timeline-logistica-list.component').then(m => m.TimelineLogisticaComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'config-menu', 
    loadComponent: () => import('./pages/menu-config/list/menu-config-list.component').then(m => m.MenuConfigComponent), 
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: 'torre-controle' }
];
