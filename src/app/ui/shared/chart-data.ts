export interface ChartData {
  label: string;
  value: number;
  formatter: (value: number) => string;
}
