import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ShipmentsComponent } from './pages/shipments/shipments.component';
import { VehiclesComponent } from './pages/vehicles/vehicles.component';
import { DriversComponent } from './pages/drivers/drivers.component';
import { LoginComponent } from './pages/login/login.component';
import { JornadaComponent } from './pages/jornada/jornada.component';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { EmbarqueComponent } from './pages/embarque/embarque.component';
import { ControleEmbarquesComponent } from './pages/controle-embarques/controle-embarques.component';
import { GestaoMotoristasComponent } from './pages/gestao-motoristas/gestao-motoristas.component';
import { ProgramacaoComponent } from './pages/programacao/programacao.component';
import { authGuard } from './core/auth.guard';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { ControleColaboradoresComponent } from './pages/controle-colaboradores/controle-colaboradores.component';
import { ControleFrotaComponent } from './pages/controle-frota/controle-frota.component';
import { AcertoViagemComponent } from './pages/acerto-viagem/acerto-viagem.component';
import { ProducaoOficinaComponent } from './pages/producao-oficina/producao-oficina.component';
import { PrecificacaoAbastecimentoComponent } from './pages/precificacao-abastecimento/precificacao-abastecimento.component';
import { FreteTerceiroComponent } from './pages/frete-terceiro/frete-terceiro.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'jornada', component: JornadaComponent, canActivate: [authGuard] },
  { path: 'shipments', component: ShipmentsComponent, canActivate: [authGuard] },
  { path: 'vehicles', component: VehiclesComponent, canActivate: [authGuard] },
  { path: 'drivers', component: DriversComponent, canActivate: [authGuard] },
  { path: 'gestao-motoristas', component: GestaoMotoristasComponent, canActivate: [authGuard] },
  { path: 'manutencao', component: MaintenanceComponent, canActivate: [authGuard] },
  { path: 'rastreamento', component: TrackingComponent, canActivate: [authGuard] },
  { path: 'programacao', component: ProgramacaoComponent, canActivate: [authGuard] },
  { path: 'embarque', component: EmbarqueComponent, canActivate: [authGuard] },
  { path: 'controle-embarques', component: ControleEmbarquesComponent, canActivate: [authGuard] },
  { path: 'controle-colaboradores', component: ControleColaboradoresComponent, canActivate: [authGuard] },
  { path: 'controle-frota', component: ControleFrotaComponent, canActivate: [authGuard] },
  { path: 'contratos', component: ContratosComponent, canActivate: [authGuard] },
  { path: 'acerto-viagem', component: AcertoViagemComponent, canActivate: [authGuard] },
  { path: 'producao-oficina', component: ProducaoOficinaComponent, canActivate: [authGuard] },
  { path: 'precificacao-abastecimento', component: PrecificacaoAbastecimentoComponent, canActivate: [authGuard] },
  { path: 'frete-terceiro', component: FreteTerceiroComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
