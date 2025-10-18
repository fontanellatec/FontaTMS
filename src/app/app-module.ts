import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ShipmentsComponent } from './pages/shipments/shipments.component';
import { VehiclesComponent } from './pages/vehicles/vehicles.component';
import { DriversComponent } from './pages/drivers/drivers.component';
import { LoginComponent } from './pages/login/login.component';
import { JornadaComponent } from './pages/jornada/jornada.component';
import { AuthInterceptor } from './core/auth.interceptor';
import { MaintenanceComponent } from './pages/maintenance/maintenance.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { EmbarqueComponent } from './pages/embarque/embarque.component';
import { ControleEmbarquesComponent } from './pages/controle-embarques/controle-embarques.component';
import { GestaoMotoristasComponent } from './pages/gestao-motoristas/gestao-motoristas.component';
import { ProgramacaoComponent } from './pages/programacao/programacao.component';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { ControleColaboradoresComponent } from './pages/controle-colaboradores/controle-colaboradores.component';
import { ControleFrotaComponent } from './pages/controle-frota/controle-frota.component';
import { AcertoViagemComponent } from './pages/acerto-viagem/acerto-viagem.component';
import { ProducaoOficinaComponent } from './pages/producao-oficina/producao-oficina.component';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    DashboardComponent,
    ShipmentsComponent,
    VehiclesComponent,
    DriversComponent,
    LoginComponent,
    JornadaComponent
    ,MaintenanceComponent
    ,TrackingComponent
    ,EmbarqueComponent
    ,ControleEmbarquesComponent
    ,GestaoMotoristasComponent
    ,ProgramacaoComponent
    ,ContratosComponent
    ,ControleColaboradoresComponent
    ,ControleFrotaComponent
    ,AcertoViagemComponent
    ,ProducaoOficinaComponent
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
