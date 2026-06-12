export interface TimelineModalMetric {
  label: string;
  value: string;
  info?: string;
}

export interface TimelineModalRow {
  label: string;
  value: string;
}

export interface TimelineFleetTimelineItem {
  status: string;
  period: string;
  title: string;
  detail: string;
  color: string;
}

export interface TimelineFleetModalData {
  title: string;
  subtitle: string;
  monthTag: string;
  summaryCards: TimelineModalMetric[];
  revenueEntries: TimelineModalRow[];
  expenseEntries: TimelineModalRow[];
  revenueTotal: string;
  expenseTotal: string;
  profit: string;
  detailedTime: TimelineModalMetric[];
  indicators: TimelineModalMetric[];
  timelineItems: TimelineFleetTimelineItem[];
}

export interface TimelineEventModalData {
  title: string;
  subtitle: string;
  detailTitle: string;
  detailText: string;
  fleet: string;
  plate: string;
  driver: string;
  period: string;
  duration: string;
  month: string;
  statusType: string;
  faturamento?: string;
  faturamentoInfo?: string;
  mapMode?: 'route' | 'location';
  mapOriginLabel?: string;
  mapDestinationLabel?: string;
  mapLocationLabel?: string;
}
