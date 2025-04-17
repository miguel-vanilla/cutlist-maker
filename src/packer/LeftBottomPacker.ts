import { AppSettings, StockPanel, RequiredPanel, AdjustedPanel, CutFit, SpaceMatrix, CalculationResult } from '../types';
import { Packer } from "./Packer"
export class LeftBottomPacker extends Packer{
  /**
   * Add stock panels to the packer
   * @param panels Array of stock panels
   */
  addStockPanel(panels: StockPanel[]): void {
    panels.forEach(panel => {
      for (let i = 0; i < panel.quantity; i++) {
        this.stockPanels.push({ ...panel, quantity: 1 });
      }
    });
  }

  /**
   * Add required panels to be packed
   * @param requiredPanels Array of required panels
   */
  addRequiredPanel(requiredPanels: RequiredPanel[]): void {
    requiredPanels.forEach(panel => {
      for (let i = 0; i < panel.quantity; i++) {
        this.requiredPanels.push({ ...panel, quantity: 1 });
      }
    });
  }

  /**
   * Reset the packer to initial state
   */
  reset(): void {
    this.stockPanels = [];
    this.requiredPanels = [];
  }

  /**
   * Perform the packing calculation
   * @returns Calculation result
   */
  pack(): CalculationResult {
    return this.calculateLayout(this.stockPanels, this.requiredPanels, this.appSettings);
  }

  // ============== Internal Private Methods ==============
  
  /**
   * Create a space matrix for the stock panel
   * @param stockLength Length of the stock panel
   * @param stockWidth Width of the stock panel
   * @returns Space matrix object
   */
  private createSpaceMatrix(stockLength: number, stockWidth: number): SpaceMatrix {
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
      /**
       * Mark space as used
       * @param x X coordinate
       * @param y Y coordinate
       * @param width Width to mark
       * @param height Height to mark
       */
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
      /**
       * Check if space is available
       * @param x X coordinate
       * @param y Y coordinate
       * @param width Width needed
       * @param height Height needed
       * @returns True if space is available
       */
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
      /**
       * Find next available position
       * @returns Position object or null if no space left
       */
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

  /**
   * Prepare panel with adjustments for edge banding and trimming
   * @param panel Original required panel
   * @returns Adjusted panel
   */
  private preparePanel(panel: RequiredPanel): AdjustedPanel {
    let adjustedLength = panel.length;
    let adjustedWidth = panel.width;

    if (this.appSettings.includeEdgeTrimming) {
      adjustedLength += 2 * this.appSettings.edgeTrimAmount;
      adjustedWidth += 2 * this.appSettings.edgeTrimAmount;
    }

    if (this.appSettings.includeEdgeBanding) {
      adjustedLength -= 2 * this.appSettings.edgeBandingThickness;
      adjustedWidth -= 2 * this.appSettings.edgeBandingThickness;
    }

    return {
      ...panel,
      length: adjustedLength,
      width: adjustedWidth,
      originalLength: panel.length,
      originalWidth: panel.width,
      canRotate: !this.appSettings.considerGrain
    };
  }

  /**
   * Try to fit a panel at specific position
   * @param panel Panel to fit
   * @param x X coordinate
   * @param y Y coordinate
   * @param rotated Whether panel is rotated
   * @param spaceMatrix Space matrix
   * @param stockLength Stock panel length
   * @param stockWidth Stock panel width
   * @returns Cut fit or null if doesn't fit
   */
  private tryFitPanel(
    panel: AdjustedPanel,
    x: number,
    y: number,
    rotated: boolean,
    spaceMatrix: SpaceMatrix,
    stockLength: number, 
    stockWidth: number
  ): CutFit | null {
    const panelLength = rotated ? panel.width : panel.length;
    const panelWidth = rotated ? panel.length : panel.width;
    
    // Add kerf to dimensions when checking fit
    const totalWidth = panelWidth + this.appSettings.kerfWidth;
    const totalLength = panelLength + this.appSettings.kerfWidth;

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

  /**
   * Calculate score for a potential fit
   * @param fit The fit to score
   * @param existingCuts Existing cuts on the stock panel
   * @param stockLength Stock panel length
   * @param stockWidth Stock panel width
   * @returns Score value
   */
  private calculateFitScore(
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

  /**
   * Find best rotation for panel at position
   * @param panel Panel to place
   * @param x X coordinate
   * @param y Y coordinate
   * @param spaceMatrix Space matrix
   * @param stockLength Stock panel length
   * @param stockWidth Stock panel width
   * @param existingCuts Existing cuts
   * @returns Best fit and rotation state
   */
  private findBestRotation(
    panel: AdjustedPanel,
    x: number,
    y: number,
    spaceMatrix: SpaceMatrix,
    stockLength: number,
    stockWidth: number,
    existingCuts: CalculationResult['layouts'][0]['cuts']
  ): { fit: CutFit | null; rotated: boolean } {
    const normalFit = this.tryFitPanel(panel, x, y, false, spaceMatrix, stockLength, stockWidth);
    let rotatedFit = null;
    
    if (panel.canRotate) {
      rotatedFit = this.tryFitPanel(panel, x, y, true, spaceMatrix, stockLength, stockWidth);
    }

    if (!normalFit && !rotatedFit) return { fit: null, rotated: false };
    if (normalFit && !rotatedFit) return { fit: normalFit, rotated: false };
    if (!normalFit && rotatedFit) return { fit: rotatedFit, rotated: true };

    // Compare fits based on:
    // 1. Alignment with existing cuts
    // 2. Space utilization
    // 3. Minimizing waste strips
    const normalScore = this.calculateFitScore(normalFit!, existingCuts, stockLength, stockWidth);
    const rotatedScore = this.calculateFitScore(rotatedFit!, existingCuts, stockLength, stockWidth);

    return rotatedScore > normalScore 
      ? { fit: rotatedFit, rotated: true }
      : { fit: normalFit, rotated: false };
  }

  /**
   * Find best panel for position
   * @param position Position to fill
   * @param panels Available panels
   * @param spaceMatrix Space matrix
   * @param stockLength Stock panel length
   * @param stockWidth Stock panel width
   * @param existingCuts Existing cuts
   * @returns Best panel index and fit
   */
  private findBestPanelForPosition(
    position: { x: number; y: number },
    panels: AdjustedPanel[],
    spaceMatrix: SpaceMatrix,
    stockLength: number,
    stockWidth: number,
    existingCuts: CalculationResult['layouts'][0]['cuts']
  ): { panelIndex: number; fit: CutFit | null; rotated: boolean } {
    let bestFit: CutFit | null = null;
    let bestPanelIndex = -1;
    let bestScore = -Infinity;
    let bestRotated = false;

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const { fit, rotated } = this.findBestRotation(
        panel,
        position.x,
        position.y,
        spaceMatrix,
        stockLength,
        stockWidth,
        existingCuts
      );

      if (fit) {
        const score = this.calculateFitScore(fit, existingCuts, stockLength, stockWidth);
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

  /**
   * Calculate optimal layout
   * @param stockPanels Available stock panels
   * @param requiredPanels Panels to be packed
   * @param settings Application settings
   * @returns Calculation result
   */
  private calculateLayout(
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
        const adjustedPanel = this.preparePanel(panel);
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
        const spaceMatrix = this.createSpaceMatrix(currentPanel.length, currentPanel.width);
        const currentCuts: CalculationResult['layouts'][0]['cuts'] = [];
        
        while (true) {
          const position = spaceMatrix.findNextPosition();
          if (!position) break;

          const { panelIndex, fit, rotated } = this.findBestPanelForPosition(
            position,
            remainingPanels,
            spaceMatrix,
            currentPanel.length,
            currentPanel.width,
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
}