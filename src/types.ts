// Constants
export const Unit = {
  MM: "mm",
  CM: "cm",
  INCHES: "inches",
} as const;

export const Currency = {
  EURO: "€",
  DOLLAR: "$",
  YEN: "JPY ¥",
  RMB: "CNY ¥",
} as const;

export const PackerType = {
  LEFTBOTTOM: "LeftBottom",
  MAXRECTS: "MaxRects",
} as const;

export interface AppSettings {
  packerType: typeof PackerType[keyof typeof PackerType];
  units: typeof Unit[keyof typeof Unit];
  currency: typeof Currency[keyof typeof Currency];
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
  index?: number; //the index of StockPanel
}

export interface RequiredPanel {
  length: number;
  width: number;
  quantity: number;
  label?: string;
  color?: string;
  index?: number; //the index of RequiredPanel
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
  color?: string;
  efficiency: number;
}

export interface SpaceMatrix {
  grid: boolean[][];
  markSpace: (x: number, y: number, width: number, height: number) => void;
  isSpaceAvailable: (
    x: number,
    y: number,
    width: number,
    height: number
  ) => boolean;
  findNextPosition: () => { x: number; y: number } | null;
}
export interface Cut{
  x: number;
  y: number;
  width: number;
  length: number;
  label?: string;
  color?: string;
}

export interface CalculationResult {
  layouts: Array<{
    cuts: Array<Cut>;
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

export interface ResultsProps {
  calculatePrice: boolean;
  settings: {
    currency: string;
    kerfWidth: number;
    considerGrain: boolean;
    includeEdgeBanding: boolean;
    edgeBandingThickness: number;
    includeEdgeTrimming: boolean;
    edgeTrimAmount: number;
  };
  stockPanels: StockPanel[];
  requiredPanels: RequiredPanel[];
}

export interface PanelLayout {
  width: number;
  length: number;
  cuts: {
    x: number;
    y: number;
    width: number;
    length: number;
    label?: string;
    color?: string;
    rotated?: boolean;
  }[];
}

