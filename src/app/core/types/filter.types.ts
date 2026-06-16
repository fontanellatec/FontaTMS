export interface FilterConfig {
  type: 'select' | 'date' | 'text' | 'number';
  label: string;
  key: string;
  options?: { value: any; label: string }[];
  placeholder?: string;
  value?: any;
}
