declare module 'chart.js' {
  export const Chart: any;
  export const CategoryScale: any;
  export const LinearScale: any;
  export const PointElement: any;
  export const LineElement: any;
  export const Title: any;
  export const Tooltip: any;
  export const Legend: any;
  export type ChartOptions = any;
  
  export function register(...components: any[]): void;
}

declare module 'react-chartjs-2' {
  export const Line: React.FC<any>;
} 