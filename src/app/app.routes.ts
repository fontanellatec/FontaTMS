import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TrackingComponent } from './pages/tracking/list/tracking-list.component';
import { ControleIntencaoViagemComponent } from './pages/controle-intencao-viagem/list/controle-intencao-viagem-list.component';
import { ProgramacaoComponent } from './pages/programacao/list/programacao-list.component';
import { authGuard } from './core/guards/auth.guard';
import { MenuConfigComponent } from './pages/menu-config/list/menu-config-list.component';
import { TorreControleComponent } from './pages/torre-controle/list/torre-controle-list.component';
import { TimelineLogisticaComponent } from './pages/timeline-logistica/list/timeline-logistica-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'torre-controle', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'rastreamento', component: TrackingComponent, canActivate: [authGuard] },
  { path: 'torre-controle', component: TorreControleComponent, canActivate: [authGuard] },
  { path: 'programacao', component: ProgramacaoComponent, canActivate: [authGuard] },
  { path: 'controle-intencao-viagem', component: ControleIntencaoViagemComponent, canActivate: [authGuard] },
  { path: 'timeline-logistica', component: TimelineLogisticaComponent, canActivate: [authGuard] },
  { path: 'config-menu', component: MenuConfigComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'torre-controle' }
];
