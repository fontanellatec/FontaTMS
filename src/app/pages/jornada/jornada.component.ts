import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusLabel = 'DSR' | 'Ausente' | 'Folga' | 'Atestado' | 'Trabalhando' | 'Férias';
type DayCell = { day?: number; status?: StatusLabel; statusClass?: 'dsr' | 'ausente' | 'folga' | 'atestado' | 'trabalhando' | 'ferias' };

@Component({
  selector: 'app-jornada',
  templateUrl: './jornada.component.html',
  styleUrl: './jornada.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class JornadaComponent implements OnInit {
  monthName = '';
  year = 0;
  monthIndex = 0;
  currentDate = new Date();
  daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  calendarCells: DayCell[] = [];

  // Filtro por status
  selectedStatus: StatusLabel | 'Todos' = 'Todos';
  statusOptions: StatusLabel[] = ['Trabalhando', 'DSR', 'Folga', 'Ausente', 'Atestado', 'Férias'];

  // Motoristas
  drivers = ['João Santos', 'Maria Lima', 'Carlos Silva', 'Ana Costa', 'Pedro Alves'];
  selectedDriver = this.drivers[0];
  scheduleByDriver: Record<string, Record<number, StatusLabel>> = {};

  // Modal
  modalOpen = false;
  selectedDay?: { day: number; driver: string; status: StatusLabel };

  // Opções de jornada (conforme terceiro print)
  jornadaActions: (
    | 'Afastamento'
    | 'Calcular Período DSR'
    | 'DSR Avulso'
    | 'Férias'
    | 'Ausente'
    | 'Folga Remunerada'
  )[] = [
    'Afastamento',
    'Calcular Período DSR',
    'DSR Avulso',
    'Férias',
    'Ausente',
    'Folga Remunerada',
  ];
  selectedAction: string | null = null;
  observation: string = '';

  // Métricas exibidas na lateral da modal
  workedDaysCount = 0; // "Trabalhados"
  dsrWeekProgress = 0; // X de 6
  dsrAvailable = 0; // 0/1
  managerName = 'Allan Colombo';

  stats = [
    { label: 'Motoristas Ativos', value: 42, icon: 'users' },
    { label: 'Em Rota', value: 19, icon: 'route' },
    { label: 'Disponíveis', value: 15, icon: 'available' },
    { label: 'Ausentes', value: 8, icon: 'absent' }
  ];

  ngOnInit(): void {
    this.setMonth(new Date());
  }

  prevMonth(): void {
    const d = new Date(this.year, this.monthIndex - 1, 1);
    this.setMonth(d);
  }

  nextMonth(): void {
    const d = new Date(this.year, this.monthIndex + 1, 1);
    this.setMonth(d);
  }

  goToday(): void {
    this.setMonth(new Date());
  }

  private setMonth(date: Date): void {
    this.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
    this.year = this.currentDate.getFullYear();
    this.monthIndex = this.currentDate.getMonth();
    this.monthName = this.getMonthName(this.monthIndex);

    const firstDay = this.getMondayFirstDay(new Date(this.year, this.monthIndex, 1));
    const daysInMonth = new Date(this.year, this.monthIndex + 1, 0).getDate();

    // Gera agenda por motorista
    for (const drv of this.drivers) {
      this.scheduleByDriver[drv] = this.generateDefaultScheduleForDriver(drv, this.year, this.monthIndex, daysInMonth);
    }

    // Monta células do calendário para o motorista selecionado
    const offset = firstDay; // 0..6 starting Monday
    this.calendarCells = Array(offset).fill({});
    for (let d = 1; d <= daysInMonth; d++) {
      const status = this.scheduleByDriver[this.selectedDriver][d];
      this.calendarCells.push({ day: d, status, statusClass: this.getStatusClass(status) });
    }
  }

  private getMondayFirstDay(date: Date): number {
    // JS getDay(): 0=Sun..6=Sat -> convert to Monday-first (Mon=0..Sun=6)
    const js = new Date(date).getDay();
    return (js + 6) % 7;
  }

  private getMonthName(m: number): string {
    const names = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return names[m] ?? '';
  }

  private getStatusClass(s: StatusLabel): DayCell['statusClass'] {
    switch (s) {
      case 'DSR': return 'dsr';
      case 'Ausente': return 'ausente';
      case 'Folga': return 'folga';
      case 'Atestado': return 'atestado';
      case 'Trabalhando': return 'trabalhando';
      case 'Férias': return 'ferias';
    }
  }

  private generateDefaultScheduleForDriver(driver: string, year: number, month: number, daysInMonth: number): Record<number, StatusLabel> {
    const schedule: Record<number, StatusLabel> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      // Padrão solicitado: todos os dias começam como "Trabalhando"
      schedule[d] = 'Trabalhando';
    }
    return schedule;
  }

  private generateAssignmentsForDay(day: number, status: DayCell['status']): { driver: string; team: string }[] {
    // Apenas gera atribuições quando o status do dia é "Trabalhando"
    if (status !== 'Trabalhando') return [];
    // Geração simples determinística baseada no dia
    const drivers = ['João Santos', 'Maria Lima', 'Carlos Silva', 'Ana Costa', 'Pedro Alves'];
    const teams = ['Equipe A', 'Equipe B', 'Equipe C'];
    const count = (day % 3) + 1; // 1..3
    const assigns: { driver: string; team: string }[] = [];
    for (let i = 0; i < count; i++) {
      const drv = drivers[(day + i) % drivers.length];
      const team = teams[(day + i) % teams.length];
      assigns.push({ driver: drv, team });
    }
    return assigns;
  }

  isDimmed(c: DayCell): boolean {
    if (!c.day) return false;
    // Filtro de status
    if (this.selectedStatus !== 'Todos' && c.status !== this.selectedStatus) return true;
    return false;
  }

  selectDay(c: DayCell): void {
    if (!c.day) return;
    const status = this.scheduleByDriver[this.selectedDriver][c.day];
    this.selectedDay = { day: c.day, driver: this.selectedDriver, status };
    // Atualiza métricas para a modal
    this.workedDaysCount = this.computeWorkedDaysCount();
    this.dsrWeekProgress = this.computeWeekProgress(new Date(this.year, this.monthIndex, c.day));
    this.dsrAvailable = this.dsrWeekProgress >= 6 ? 1 : 0;
    this.selectedAction = null;
    this.observation = '';
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; this.selectedAction = null; this.observation = ''; }

  saveModal(): void {
    if (!this.selectedDay || !this.selectedAction) { this.closeModal(); return; }
    const statusToApply = this.mapActionToStatus(this.selectedAction);
    if (statusToApply) {
      this.updateDayStatus(this.selectedDay.day, statusToApply);
      this.storeObservation(new Date(this.year, this.monthIndex, this.selectedDay.day), this.observation);
    }
    this.closeModal();
  }

  mapActionToStatus(action: string): StatusLabel | null {
    switch (action) {
      case 'Afastamento': return 'Ausente';
      case 'Calcular Período DSR': return 'DSR';
      case 'DSR Avulso': return 'DSR';
      case 'Férias': return 'Férias';
      case 'Ausente': return 'Ausente';
      case 'Folga Remunerada': return 'Folga';
      default: return null;
    }
  }

  // Observações por data (demo/temporário)
  private notesByDate: Record<string, string> = {};
  private storeObservation(date: Date, note: string): void {
    if (!note) return;
    const key = date.toISOString().split('T')[0];
    this.notesByDate[key] = note;
  }

  private computeWorkedDaysCount(): number {
    // Conta dias "Trabalhando" no mês atual exibido
    return this.calendarCells.filter((d) => d.day && d.status === 'Trabalhando').length;
  }

  private computeWeekProgress(date: Date): number {
    // Conta dias Trabalhando na semana do dia selecionado (Segunda a Sábado)
    const jsDay = date.getDay(); // 0=Dom..6=Sab
    // Encontrar segunda-feira da semana
    const monday = new Date(date);
    const diffToMonday = (jsDay + 6) % 7; // Mon=0
    monday.setDate(date.getDate() - diffToMonday);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    let count = 0;
    for (const c of this.calendarCells) {
      if (!c.day) continue;
      const d = new Date(this.year, this.monthIndex, c.day);
      if (d >= monday && d <= saturday && c.status === 'Trabalhando') count++;
    }
    return count;
  }

  updateDayStatus(day: number, newStatus: StatusLabel): void {
    if (!day) return;
    this.scheduleByDriver[this.selectedDriver][day] = newStatus;
    // Atualiza célula exibida
    const firstDay = this.getMondayFirstDay(new Date(this.year, this.monthIndex, 1));
    const daysInMonth = new Date(this.year, this.monthIndex + 1, 0).getDate();
    this.calendarCells = Array(firstDay).fill({});
    for (let d = 1; d <= daysInMonth; d++) {
      const status = this.scheduleByDriver[this.selectedDriver][d];
      this.calendarCells.push({ day: d, status, statusClass: this.getStatusClass(status) });
    }
    if (this.selectedDay && this.selectedDay.day === day) this.selectedDay.status = newStatus;
    this.modalOpen = false;
  }

  onDriverChange(): void {
    // Reconstrói células para o novo motorista
    const firstDay = this.getMondayFirstDay(new Date(this.year, this.monthIndex, 1));
    const daysInMonth = new Date(this.year, this.monthIndex + 1, 0).getDate();
    this.calendarCells = Array(firstDay).fill({});
    for (let d = 1; d <= daysInMonth; d++) {
      const status = this.scheduleByDriver[this.selectedDriver][d];
      this.calendarCells.push({ day: d, status, statusClass: this.getStatusClass(status) });
    }
  }

  exportCSV(): void {
    const rows: string[] = ['Motorista;Dia;Status'];
    for (const c of this.calendarCells) {
      if (!c.day) continue;
      rows.push(`${this.selectedDriver};${c.day};${c.status ?? ''}`);
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jornada_${this.selectedDriver.replace(/\s+/g,'_')}_${this.year}_${this.monthIndex + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  printSchedule(): void { window.print(); }

  // Utilitário para obter a data completa do dia selecionado (evita uso de `new` no template)
  getSelectedDayDate(): Date | null {
    if (!this.selectedDay) return null;
    return new Date(this.year, this.monthIndex, this.selectedDay.day);
  }
}