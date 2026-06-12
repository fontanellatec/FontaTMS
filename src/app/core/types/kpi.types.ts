export interface KpiChild {
  label: string;
  value: number | string;
  color?: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
}

export interface KpiConfig {
  label: string;
  value: number | string;
  icon: string;
  format?: 'number' | 'currency' | 'percentage' | 'text';
  prefix?: string;
  suffix?: string;
  color?: string;
  children?: KpiChild[];
  delta?: number;
  deltaFormat?: 'number' | 'currency' | 'percentage' | 'text';
  deltaSuffix?: string;
  betterDirection?: 'up' | 'down';
}
