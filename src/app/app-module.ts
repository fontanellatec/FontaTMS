import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
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
import { IntencaoViagemComponent } from './pages/intencao-viagem/intencao-viagem.component';
import { ControleIntencaoViagemComponent } from './pages/controle-intencao-viagem/controle-intencao-viagem.component';
import { GestaoMotoristasComponent } from './pages/gestao-motoristas/gestao-motoristas.component';
import { ProgramacaoComponent } from './pages/programacao/programacao.component';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { ControleColaboradoresComponent } from './pages/controle-colaboradores/controle-colaboradores.component';
import { ControleFrotaComponent } from './pages/controle-frota/controle-frota.component';
import { AcertoViagemComponent } from './pages/acerto-viagem/acerto-viagem.component';
import { ProducaoOficinaComponent } from './pages/producao-oficina/producao-oficina.component';
import { PrecificacaoAbastecimentoComponent } from './pages/precificacao-abastecimento/precificacao-abastecimento.component';
import { FreteTerceiroComponent } from './pages/frete-terceiro/frete-terceiro.component';
import { MenuConfigComponent } from './pages/menu-config/menu-config.component';
import { TorreControleComponent } from './pages/torre-controle/torre-controle.component';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    CommonModule,
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
    ,IntencaoViagemComponent
    ,ControleIntencaoViagemComponent
    ,GestaoMotoristasComponent
    ,CadastroMotoristaComponent
    ,ProgramacaoComponent
    ,ContratosComponent
    ,ControleColaboradoresComponent
    ,ControleFrotaComponent
    ,AcertoViagemComponent
    ,ProducaoOficinaComponent
    ,PrecificacaoAbastecimentoComponent
    ,FreteTerceiroComponent
    ,MenuConfigComponent
    ,TorreControleComponent
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
import { CadastroMotoristaComponent } from './pages/gestao-motoristas/cadastro-motorista.component';
