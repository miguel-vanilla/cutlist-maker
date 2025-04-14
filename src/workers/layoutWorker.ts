import { AppSettings, StockPanel, RequiredPanel, AdjustedPanel, CutFit, SpaceMatrix, CalculationResult } from '../types';


// Create space matrix helper
function createSpaceMatrix(stockLength: number, stockWidth: number): SpaceMatrix {
  const gridSize = 10; // Increased for better performance
  const cols = Math.ceil(stockLength / gridSize);
  const rows = Math.ceil(stockWidth / gridSize);
  let currentRow = 0;
  let currentCol = 0;
  
  if (cols > 1000 || rows > 1000) {
    throw new Error('Panel dimensions too large for calculation');
  }
  
  const grid = Array.from({ length: rows }, () => Array(cols).fill(false));

  return {
    grid,
    markSpace: (x: number, y: number, width: number, height: number) => {
      const startCol = Math.floor(x / gridSize);
      const startRow = Math.floor(y / gridSize);
      const endCol = Math.ceil((x + width) / gridSize);
      const endRow = Math.ceil((y + height) / gridSize);

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (row < rows && col < cols) {
            grid[row][col] = true;
          }
        }
      }
    },
    isSpaceAvailable: (x: number, y: number, width: number, height: number) => {
      const startCol = Math.floor(x / gridSize);
      const startRow = Math.floor(y / gridSize);
      const endCol = Math.ceil((x + width) / gridSize);
      const endRow = Math.ceil((y + height) / gridSize);

      if (endCol > cols || endRow > rows) return false;

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (grid[row][col]) return false;
        }
      }
      return true;
    },
    findNextPosition: () => {
      // Find next available position, left to right, top to bottom
      while (currentRow < rows) {
        while (currentCol < cols) {
          const x = currentCol * gridSize;
          const y = currentRow * gridSize;
          
          // If current position is free, return it
          if (!grid[currentRow][currentCol]) {
            const pos = { x, y };
            currentCol++;
            return pos;
          }
          currentCol++;
        }
        currentRow++;
        currentCol = 0;
      }
      return null;
    }
  };
}

// Find best rotation for a panel at a given position
function findBestRotation(
  panel: AdjustedPanel,
  x: number,
  y: number,
  spaceMatrix: SpaceMatrix,
  stockLength: number,
  stockWidth: number,
  kerfWidth: number,
  existingCuts: CalculationResult['layouts'][0]['cuts']
): { fit: CutFit | null; rotated: boolean } {
  const normalFit = tryFitPanel(panel, x, y, false, spaceMatrix, stockLength, stockWidth, kerfWidth);
  let rotatedFit = null;
  
  if (panel.canRotate) {
    rotatedFit = tryFitPanel(panel, x, y, true, spaceMatrix, stockLength, stockWidth, kerfWidth);
  }

  if (!normalFit && !rotatedFit) return { fit: null, rotated: false };
  if (normalFit && !rotatedFit) return { fit: normalFit, rotated: false };
  if (!normalFit && rotatedFit) return { fit: rotatedFit, rotated: true };

  // Compare fits based on:
  // 1. Alignment with existing cuts
  // 2. Space utilization
  // 3. Minimizing waste strips
  const normalScore = calculateFitScore(normalFit!, existingCuts, stockLength, stockWidth);
  const rotatedScore = calculateFitScore(rotatedFit!, existingCuts, stockLength, stockWidth);

  return rotatedScore > normalScore 
    ? { fit: rotatedFit, rotated: true }
    : { fit: normalFit, rotated: false };
}

// Calculate score for a potential fit
function calculateFitScore(
  fit: CutFit,
  existingCuts: CalculationResult['layouts'][0]['cuts'],
  stockLength: number,
  stockWidth: number
): number {
  let score = fit.efficiency * 100; // Base score from efficiency

  // Bonus for aligning with stock panel edges
  if (fit.x === 0) score += 20;
  if (fit.y === 0) score += 20;
  if (fit.x + fit.width === stockLength) score += 20;
  if (fit.y + fit.length === stockWidth) score += 20;

  // Bonus for aligning with existing cuts
  for (const cut of existingCuts) {
    // Horizontal alignment
    if (Math.abs(fit.y - (cut.y + cut.length)) < 1) score += 15;
    if (Math.abs(fit.y + fit.length - cut.y) < 1) score += 15;
    
    // Vertical alignment
    if (Math.abs(fit.x - (cut.x + cut.width)) < 1) score += 15;
    if (Math.abs(fit.x + fit.width - cut.x) < 1) score += 15;
  }

  // Penalty for creating small waste strips
  const minWasteWidth = 50; // Minimum useful strip width
  if (fit.x > 0 && fit.x < minWasteWidth) score -= 30;
  if (stockLength - (fit.x + fit.width) < minWasteWidth) score -= 30;
  if (fit.y > 0 && fit.y < minWasteWidth) score -= 30;
  if (stockWidth - (fit.y + fit.length) < minWasteWidth) score -= 30;

  return score;
}

// Find best panel for a position
function findBestPanelForPosition(
  position: { x: number; y: number },
  panels: AdjustedPanel[],
  spaceMatrix: SpaceMatrix,
  stockLength: number,
  stockWidth: number,
  kerfWidth: number,
  existingCuts: CalculationResult['layouts'][0]['cuts']
): { panelIndex: number; fit: CutFit | null; rotated: boolean } {
  let bestFit: CutFit | null = null;
  let bestPanelIndex = -1;
  let bestScore = -Infinity;
  let bestRotated = false;

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const { fit, rotated } = findBestRotation(
      panel,
      position.x,
      position.y,
      spaceMatrix,
      stockLength,
      stockWidth,
      kerfWidth,
      existingCuts
    );

    if (fit) {
      const score = calculateFitScore(fit, existingCuts, stockLength, stockWidth);
      if (score > bestScore) {
        bestScore = score;
        bestFit = fit;
        bestPanelIndex = i;
        bestRotated = rotated;
      }
    }
  }

  return {
    panelIndex: bestPanelIndex,
    fit: bestFit,
    rotated: bestRotated
  };
}

// Prepare panel with adjustments
function preparePanel(panel: RequiredPanel, settings: AppSettings): AdjustedPanel {
  let adjustedLength = panel.length;
  let adjustedWidth = panel.width;

  if (settings.includeEdgeTrimming) {
    adjustedLength += 2 * settings.edgeTrimAmount;
    adjustedWidth += 2 * settings.edgeTrimAmount;
  }

  if (settings.includeEdgeBanding) {
    adjustedLength -= 2 * settings.edgeBandingThickness;
    adjustedWidth -= 2 * settings.edgeBandingThickness;
  }

  return {
    ...panel,
    length: adjustedLength,
    width: adjustedWidth,
    originalLength: adjustedLength,
    originalWidth: adjustedWidth,
    canRotate: !settings.considerGrain
  };
}

// Try to fit a panel at a specific position
function tryFitPanel(
  panel: AdjustedPanel,
  x: number,
  y: number,
  rotated: boolean,
  spaceMatrix: SpaceMatrix,
  stockLength: number, 
  stockWidth: number,
  kerfWidth: number
): CutFit | null {
  const panelLength = rotated ? panel.width : panel.length;
  const panelWidth = rotated ? panel.length : panel.width;
  
  // Add kerf to dimensions when checking fit
  const totalWidth = panelWidth + kerfWidth;
  const totalLength = panelLength + kerfWidth;

  if (x + totalWidth > stockLength || y + totalLength > stockWidth ||
      !spaceMatrix.isSpaceAvailable(x, y, totalWidth, totalLength)) {
    return null;
  }

  const efficiency = (panelLength * panelWidth) / (stockLength * stockWidth);

  return {
    x,
    y,
    length: panelLength,
    width: panelWidth,
    label: panel.label,
    color: panel.color,
    efficiency
  };
}

// Calculate optimal layout
function calculateLayout(
  stockPanels: StockPanel[],
  requiredPanels: RequiredPanel[],
  settings: AppSettings
): CalculationResult {
  const layouts: CalculationResult['layouts'] = [];
  let totalCutLength = 0;
  let remainingPanels: AdjustedPanel[] = [];
  
  // Calculate total available stock panels
  const totalStockPanels = stockPanels.reduce((sum, panel) => sum + panel.quantity, 0);
  const stockPanelsByIndex: StockPanel[] = [];
  
  // Create array of all available stock panels
  stockPanels.forEach(panel => {
    for (let i = 0; i < panel.quantity; i++) {
      stockPanelsByIndex.push(panel);
    }
  });
  
  try {
    // Prepare panels with adjustments
    const allPanels: AdjustedPanel[] = [];
    let totalRequiredArea = 0;

    for (const panel of requiredPanels) {
      const adjustedPanel = preparePanel(panel, settings);
      const panelArea = adjustedPanel.length * adjustedPanel.width;
      totalRequiredArea += panelArea * panel.quantity;
      for (let i = 0; i < panel.quantity; i++) {
        allPanels.push({
          ...adjustedPanel,
          label: panel.quantity > 1 ? `${panel.label || 'Panel'} ${i + 1}/${panel.quantity}` : panel.label
        });
      }
    }
    
    // Sort panels by area in descending order
    allPanels.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    remainingPanels = [...allPanels];

    let currentStockPanelIndex = 0;
    
    while (remainingPanels.length > 0) {
      if (currentStockPanelIndex >= totalStockPanels) break;
      
      const currentPanel = stockPanelsByIndex[currentStockPanelIndex];
      const spaceMatrix = createSpaceMatrix(currentPanel.length, currentPanel.width);
      const currentCuts: CalculationResult['layouts'][0]['cuts'] = [];
      
      while (true) {
        const position = spaceMatrix.findNextPosition();
        if (!position) break;

        const { panelIndex, fit, rotated } = findBestPanelForPosition(
          position,
          remainingPanels,
          spaceMatrix,
          currentPanel.length,
          currentPanel.width,
          settings.kerfWidth,
          currentCuts
        );

        if (fit && panelIndex !== -1) {
          currentCuts.push(fit);
          
          // Update statistics
          totalCutLength += 2 * (fit.length + fit.width);
          
          // Mark space as used
          spaceMatrix.markSpace(
            fit.x,
            fit.y,
            fit.width + settings.kerfWidth,
            fit.length + settings.kerfWidth
          );

          remainingPanels.splice(panelIndex, 1);
        } else {
          // If no panel fits at this position, mark it as used
          spaceMatrix.markSpace(position.x, position.y, 10, 10);
        }
      }
      
      // Always add the layout even if empty
      layouts.push({ cuts: currentCuts });
      
      currentStockPanelIndex++;
    }

    const totalStockArea = stockPanelsByIndex
      .slice(0, layouts.length)
      .reduce((sum, panel) => sum + (panel.length * panel.width), 0);
    
    return {
      layouts,
      remainingPanels,
      stats: {
        totalStockArea,
        totalRequiredArea,
        materialYield: totalStockArea > 0 ? (totalRequiredArea / totalStockArea) * 100 : 0,
        stockPanelsUsed: Math.max(1, layouts.length),
        totalCutLength,
        estimatedCost: settings.calculatePrice 
          ? stockPanelsByIndex.slice(0, layouts.length).reduce((sum, panel) => sum + (panel.price || 0), 0)
          : undefined
      }
    };
  } catch (error) {
    console.error('Layout calculation failed:', error);
    return {
      layouts: [],
      remainingPanels: [],
      stats: {
        totalStockArea: 0,
        totalRequiredArea: 0,
        materialYield: 0,
        stockPanelsUsed: 0,
        totalCutLength: 0,
      }
    };
  }
}

// Web Worker message handler
self.onmessage = (e: MessageEvent) => {
  const { stockPanels, requiredPanels, settings } = e.data;
  
  try {
    const result = calculateLayout(stockPanels, requiredPanels, settings);
    self.postMessage({ type: 'success', result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};