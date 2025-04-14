
export type Unit = 'mm' | 'cm' | 'inches';
export type Currency = '€' | '$' | '¥' | '¥';

export interface AppSettings {
  units: Unit;
  currency: Currency;
  kerfWidth: number;
  considerGrain: boolean;
  calculatePrice: boolean;
  includeEdgeBanding: boolean;
  edgeBandingThickness: number;
  includeEdgeTrimming: boolean;
  edgeTrimAmount: number;
}

export interface StockPanel {
  length: number;
  width: number;
  quantity: number;
  price?: number;
}

export interface RequiredPanel {
  length: number;
  width: number;
  quantity: number;
  label?: string;
  color?: string;
}


export interface AdjustedPanel extends RequiredPanel {
    originalLength: number;
    originalWidth: number;
    canRotate: boolean;
  }
  
  export interface CutFit {
    x: number;
    y: number;
    width: number;
    length: number;
    label?: string;
    efficiency: number;
  }
  
  export interface SpaceMatrix {
    grid: boolean[][];
    markSpace: (x: number, y: number, width: number, height: number) => void;
    isSpaceAvailable: (x: number, y: number, width: number, height: number) => boolean;
    findNextPosition: () => { x: number; y: number } | null;
  }
  
  export interface CalculationResult {
    layouts: Array<{
      cuts: Array<{
        x: number;
        y: number;
        width: number;
        length: number;
        label?: string;
        color?: string;
      }>;
    }>;
    remainingPanels: AdjustedPanel[];
    stats: {
      totalStockArea: number;
      totalRequiredArea: number;
      materialYield: number;
      stockPanelsUsed: number;
      totalCutLength: number;
      estimatedCost?: number;
    };
  }