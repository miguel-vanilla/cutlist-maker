import { StockPanel, RequiredPanel, CalculationResult, AppSettings, PanelLayout } from '../types';
import { Packer } from './Packer';

// Packer that use maxrects algorithm
export class MaxRectsPacker extends Packer {
  static BESTSHORTSIDEFIT: number = 0; ///< -BSSF: Positions the Rectangle against the short side of a free Rectangle into which it fits the best.
  static BESTLONGSIDEFIT: number = 1; ///< -BLSF: Positions the Rectangle against the long side of a free Rectangle into which it fits the best.
  static BESTAREAFIT: number = 2; ///< -BAF: Positions the Rectangle into the smallest free Rectangle into which it fits.
  static BOTTOMLEFTRULE: number = 3; ///< -BL: Does the Tetris placement.
  static CONTACTPOINTRULE: number = 4; ///< -CP: Choosest the placement where the Rectangle touches other Rectangles as much as possible.

  private binWidth: number = 0;
  private binHeight: number = 0;
  private allowRotations: boolean = false;
  private padding: number = 0; ///< Padding between rectangles

  private usedRects: Size[] = [];
  private freeRects: Size[] = [];

  private score1: number = 0;
  private score2: number = 0;
  private bestShortSideFit: number = 0;
  private bestLongSideFit: number = 0;

  constructor(appSettings: AppSettings) {
      super(appSettings);
      this.allowRotations = appSettings.considerGrain;
      this.padding = appSettings.kerfWidth || 0; ///< Initialize padding from appSettings
  }

  addStockPanel(panels: StockPanel[]): void {
      this.stockPanels = [...panels];
      // Initialize with the first stock panel dimensions
      if (panels.length > 0) {
          this.binWidth = panels[0].length;
          this.binHeight = panels[0].width;
          this.init(this.binWidth, this.binHeight, this.allowRotations);
      }
  }

  addRequiredPanel(requiredPanels: RequiredPanel[]): void {
      this.requiredPanels = [...requiredPanels];
  }

  private init(width: number, height: number, rotations: boolean = false): void {
      this.binWidth = width;
      this.binHeight = height;
      this.allowRotations = rotations;

      // Initialize free rectangle with actual stock panel dimensions
      const n: Size = { 
          x: 0, ///< Start from edge
          y: 0, ///< Start from edge
          w: width + this.padding, ///< Use actual width
          h: height + this.padding///< Use actual height
      };
      this.usedRects = [];
      this.freeRects = [n];
  }

  pack(): CalculationResult {
      if (this.stockPanels.length === 0 || this.requiredPanels.length === 0) {
          return this.createEmptyResult();
      }

      const results: CalculationResult = {
          layouts: [],
          remainingPanels: [],
          stats: {
              totalStockArea: 0,
              totalRequiredArea: 0,
              materialYield: 0,
              stockPanelsUsed: 0,
              totalCutLength: 0,
              estimatedCost: 0
          }
      };
      
      // Create a working copy of required panels that we'll modify
      const remainingRequiredPanels = this.requiredPanels.map(p => ({
        ...p,
        originalLength: p.length,
        originalWidth: p.width,
        canRotate: this.allowRotations
      }));

      // Process each stock panel
      for (const stockPanel of this.stockPanels) {
          // Process each instance of this stock panel (based on quantity)
          for (let stockCount = 0; stockCount < stockPanel.quantity; stockCount++) {
            this.init(stockPanel.length, stockPanel.width, !this.appSettings.considerGrain);

            const layout: PanelLayout = {
                width: stockPanel.width,
                length: stockPanel.length,
                cuts: []
            };

            // Try to pack remaining required panels into this stock panel
            for (const reqPanel of remainingRequiredPanels) {
                if (reqPanel.quantity <= 0) continue;

                let panelsPacked = 0;
                while (reqPanel.quantity > 0) {
                    const insertedRect = this.insert(
                        reqPanel.width + this.padding, 
                        reqPanel.length + this.padding, 
                        MaxRectsPacker.BESTSHORTSIDEFIT
                    );

                    if (insertedRect.h > 0) {
                        // Ensure the panel doesn't extend beyond stock panel boundaries
                        if (insertedRect.x + insertedRect.w <= (this.binWidth + this.padding) && 
                            insertedRect.y + insertedRect.h <= (this.binHeight + this.padding)) {
                            layout.cuts.push({
                                x: insertedRect.x,
                                y: insertedRect.y,
                                width: insertedRect.w - this.padding,
                                length: insertedRect.h - this.padding,
                                label: reqPanel.label,
                                color: reqPanel.color
                            });
                            reqPanel.quantity--;
                            panelsPacked++;
                        } else {
                            break; // Panel would extend beyond boundaries
                        }
                    } else {
                        // Try rotated version if allowed
                        if (this.allowRotations) {
                            const rotatedRect = this.insert(
                                reqPanel.length + this.padding, 
                                reqPanel.width + this.padding, 
                                MaxRectsPacker.BESTSHORTSIDEFIT
                            );
                            if (rotatedRect.h > 0) {
                                // Ensure the rotated panel doesn't extend beyond stock panel boundaries
                                if (rotatedRect.x + rotatedRect.w <= this.binWidth && 
                                    rotatedRect.y + rotatedRect.h <= this.binHeight) {
                                    layout.cuts.push({
                                        x: rotatedRect.x,
                                        y: rotatedRect.y,
                                        width: rotatedRect.w - this.padding, 
                                        length: rotatedRect.h - this.padding, 
                                        label: reqPanel.label,
                                        color: reqPanel.color,
                                        rotated: true
                                    });
                                    reqPanel.quantity--;
                                    panelsPacked++;
                                } else {
                                    break; // Rotated panel would extend beyond boundaries
                                }
                            } else {
                                break; // No more fit in this stock panel
                            }
                        } else {
                            break; // No more fit in this stock panel
                        }
                    }
                }
            }
            
            if (layout.cuts.length > 0) {
                results.layouts.push({ cuts: layout.cuts });
                results.stats.stockPanelsUsed++;
            } else {
              results.layouts.push({ cuts: [] });
            }
          }
      }

      // Calculate statistics
      results.stats.totalStockArea = this.stockPanels.reduce((sum, panel) => 
          sum + (panel.width * panel.length * panel.quantity), 0);
      
      results.stats.totalRequiredArea = this.requiredPanels.reduce((sum, panel) => 
          sum + (panel.width * panel.length * panel.quantity), 0);
      
      const usedArea = results.layouts.flatMap(l => l.cuts).reduce((sum, cut) => 
          sum + (cut.width * cut.length), 0);
      
      results.stats.materialYield = results.stats.totalStockArea > 0 ? 
          usedArea / results.stats.totalStockArea : 0;
      
      // Calculate total cut length (sum of all perimeters)
      results.stats.totalCutLength = results.layouts.flatMap(l => l.cuts).reduce((sum, cut) => 
          sum + (2 * (cut.width + cut.length)), 0);
      
      if (this.appSettings.calculatePrice) {
          results.stats.estimatedCost = this.stockPanels.reduce((sum, panel) => 
              sum + (panel.price || 0) * panel.quantity, 0);
      }

      return results;
  }

  private createEmptyResult(): CalculationResult {
      return {
          layouts: [],
          remainingPanels: this.requiredPanels.map(p => ({
              ...p,
              originalLength: p.length,
              originalWidth: p.width,
              canRotate: this.allowRotations
          })),
          stats: {
              totalStockArea: 0,
              totalRequiredArea: 0,
              materialYield: 0,
              stockPanelsUsed: 0,
              totalCutLength: 0,
              estimatedCost: 0
          }
      };
  }

  private insert(width: number, height: number, method: number = 0): Size {
      // Use original dimensions for placement search
      let newNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      this.score1 = 0;
      this.score2 = 0;
      
      switch (method) {
          case MaxRectsPacker.BESTSHORTSIDEFIT:
              newNode = this.findPositionForNewNodeBestShortSideFit(width, height);
              break;
          case MaxRectsPacker.BOTTOMLEFTRULE:
              newNode = this.findPositionForNewNodeBottomLeft(width, height, this.score1, this.score2);
              break;
          case MaxRectsPacker.CONTACTPOINTRULE:
              newNode = this.findPositionForNewNodeContactPoint(width, height, this.score1);
              break;
          case MaxRectsPacker.BESTLONGSIDEFIT:
              newNode = this.findPositionForNewNodeBestLongSideFit(width, height, this.score2, this.score1);
              break;
          case MaxRectsPacker.BESTAREAFIT:
              newNode = this.findPositionForNewNodeBestAreaFit(width, height, this.score1, this.score2);
              break;
      }

      if (newNode.h === 0) {
          return newNode;
      }

      // Return rectangle with original dimensions
      const finalNode: Size = {
          x: newNode.x,
          y: newNode.y,
          w: newNode.w,
          h: newNode.h
      };

      // Place rectangle with padding for spacing purposes
      this.placeRect({
          x: newNode.x,
          y: newNode.y,
          w: newNode.w,
          h: newNode.h
      });
      
      return finalNode;
  }

  private placeRect(node: Size): void {
      let numRectsToProcess: number = this.freeRects.length;
      for (let i: number = 0; i < numRectsToProcess; i++) {
          if (this.splitFreeNode(this.freeRects[i], node)) {
              this.freeRects.splice(i, 1);
              --i;
              --numRectsToProcess;
          }
      }

      this.pruneFreeList();
      this.usedRects.push(node);
  }

  private findPositionForNewNodeBestShortSideFit(width: number, height: number): Size {
      const bestNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      this.bestShortSideFit = Infinity;
      this.bestLongSideFit = this.score2;

      for (const rect of this.freeRects) {
          // Try to place the Rect in upright (non-flipped) orientation.
          // Consider padding when checking if it fits
          if (rect.w >= width && rect.h >= height) {
              const leftoverHoriz = Math.abs(rect.w - width);
              const leftoverVert = Math.abs(rect.h - height);
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
              const longSideFit = Math.max(leftoverHoriz, leftoverVert);

              if (shortSideFit < this.bestShortSideFit || 
                  (shortSideFit === this.bestShortSideFit && longSideFit < this.bestLongSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = width;
                  bestNode.h = height;
                  this.bestShortSideFit = shortSideFit;
                  this.bestLongSideFit = longSideFit;
              }
          }

          if (this.allowRotations && rect.w >= height && rect.h >= width) {
              const leftoverHoriz = Math.abs(rect.w - height);
              const leftoverVert = Math.abs(rect.h - width);
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
              const longSideFit = Math.max(leftoverHoriz, leftoverVert);

              if (shortSideFit < this.bestShortSideFit || 
                  (shortSideFit === this.bestShortSideFit && longSideFit < this.bestLongSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = height;
                  bestNode.h = width;
                  this.bestShortSideFit = shortSideFit;
                  this.bestLongSideFit = longSideFit;
              }
          }
      }

      return bestNode;
  }

  private findPositionForNewNodeBottomLeft(width: number, height: number, bestY: number, bestX: number): Size {
      const bestNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      bestY = Infinity;

      for (const rect of this.freeRects) {
          // Try to place the Rect in upright (non-flipped) orientation.
          // Consider padding when checking if it fits
          if (rect.w >= width + this.padding && rect.h >= height + this.padding) {
              const topSideY = rect.y + height;
              if (topSideY < bestY || (topSideY === bestY && rect.x < bestX)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = width;
                  bestNode.h = height;
                  bestY = topSideY;
                  bestX = rect.x;
              }
          }

          if (this.allowRotations && rect.w >= height + this.padding && rect.h >= width + this.padding) {
              const topSideY = rect.y + width;
              if (topSideY < bestY || (topSideY === bestY && rect.x < bestX)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = height;
                  bestNode.h = width;
                  bestY = topSideY;
                  bestX = rect.x;
              }
          }
      }

      return bestNode;
  }

  private findPositionForNewNodeBestLongSideFit(width: number, height: number, bestShortSideFit: number, bestLongSideFit: number): Size {
      const bestNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      bestLongSideFit = Infinity;

      for (const rect of this.freeRects) {
          // Try to place the Rect in upright (non-flipped) orientation.
          // Consider padding when checking if it fits
          if (rect.w >= width + this.padding && rect.h >= height + this.padding) {
              const leftoverHoriz = Math.abs(rect.w - (width + this.padding));
              const leftoverVert = Math.abs(rect.h - (height + this.padding));
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
              const longSideFit = Math.max(leftoverHoriz, leftoverVert);

              if (longSideFit < bestLongSideFit || 
                  (longSideFit === bestLongSideFit && shortSideFit < bestShortSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = width;
                  bestNode.h = height;
                  bestShortSideFit = shortSideFit;
                  bestLongSideFit = longSideFit;
              }
          }

          if (this.allowRotations && rect.w >= height + this.padding && rect.h >= width + this.padding) {
              const leftoverHoriz = Math.abs(rect.w - (height + this.padding));
              const leftoverVert = Math.abs(rect.h - (width + this.padding));
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
              const longSideFit = Math.max(leftoverHoriz, leftoverVert);

              if (longSideFit < bestLongSideFit || 
                  (longSideFit === bestLongSideFit && shortSideFit < bestShortSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = height;
                  bestNode.h = width;
                  bestShortSideFit = shortSideFit;
                  bestLongSideFit = longSideFit;
              }
          }
      }

      return bestNode;
  }

  private findPositionForNewNodeBestAreaFit(width: number, height: number, bestAreaFit: number, bestShortSideFit: number): Size {
      const bestNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      bestAreaFit = Infinity;

      for (const rect of this.freeRects) {
          // Consider padding when calculating area fit
          const areaFit = rect.w * rect.h - (width + this.padding) * (height + this.padding);

          // Try to place the Rect in upright (non-flipped) orientation.
          // Consider padding when checking if it fits
          if (rect.w >= width + this.padding && rect.h >= height + this.padding) {
              const leftoverHoriz = Math.abs(rect.w - (width + this.padding));
              const leftoverVert = Math.abs(rect.h - (height + this.padding));
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);

              if (areaFit < bestAreaFit || 
                  (areaFit === bestAreaFit && shortSideFit < bestShortSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = width;
                  bestNode.h = height;
                  bestShortSideFit = shortSideFit;
                  bestAreaFit = areaFit;
              }
          }

          if (this.allowRotations && rect.w >= height + this.padding && rect.h >= width + this.padding) {
              const leftoverHoriz = Math.abs(rect.w - (height + this.padding));
              const leftoverVert = Math.abs(rect.h - (width + this.padding));
              const shortSideFit = Math.min(leftoverHoriz, leftoverVert);

              if (areaFit < bestAreaFit || 
                  (areaFit === bestAreaFit && shortSideFit < bestShortSideFit)) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = height;
                  bestNode.h = width;
                  bestShortSideFit = shortSideFit;
                  bestAreaFit = areaFit;
              }
          }
      }

      return bestNode;
  }

  private findPositionForNewNodeContactPoint(width: number, height: number, bestContactScore: number): Size {
      const bestNode: Size = { x: 0, y: 0, w: 0, h: 0 };
      bestContactScore = -1;

      for (const rect of this.freeRects) {
          // Try to place the Rect in upright (non-flipped) orientation.
          // Consider padding when checking if it fits
          if (rect.w >= width + this.padding && rect.h >= height + this.padding) {
              const score = this.contactPointScoreNode(rect.x, rect.y, width, height);
              if (score > bestContactScore) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = width;
                  bestNode.h = height;
                  bestContactScore = score;
              }
          }

          if (this.allowRotations && rect.w >= height + this.padding && rect.h >= width + this.padding) {
              const score = this.contactPointScoreNode(rect.x, rect.y, height, width);
              if (score > bestContactScore) {
                  bestNode.x = rect.x;
                  bestNode.y = rect.y;
                  bestNode.w = height;
                  bestNode.h = width;
                  bestContactScore = score;
              }
          }
      }

      return bestNode;
  }

  private contactPointScoreNode(x: number, y: number, width: number, height: number): number {
      let score = 0;

      if (x === 0 || x + width + this.padding === this.binWidth) {
          score += height;
      }
      if (y === 0 || y + height + this.padding === this.binHeight) {
          score += width;
      }

      for (const rect of this.usedRects) {
          if (rect.x === x + width + this.padding || rect.x + rect.w === x) {
              score += this.commonIntervalLength(rect.y, rect.y + rect.h, y, y + height + this.padding);
          }
          if (rect.y === y + height + this.padding || rect.y + rect.h === y) {
              score += this.commonIntervalLength(rect.x, rect.x + rect.w, x, x + width + this.padding);
          }
      }

      return score;
  }

  private commonIntervalLength(i1start: number, i1end: number, i2start: number, i2end: number): number {
      if (i1end < i2start || i2end < i1start) {
          return 0;
      }
      return Math.min(i1end, i2end) - Math.max(i1start, i2start);
  }

  private splitFreeNode(freeNode: Size, usedNode: Size): boolean {
      // Test with SAT if the Rects even intersect.
      if (usedNode.x >= freeNode.x + freeNode.w || 
          usedNode.x + usedNode.w <= freeNode.x ||
          usedNode.y >= freeNode.y + freeNode.h || 
          usedNode.y + usedNode.h <= freeNode.y) {
          return false;
      }

      // New node at the top side of the used node.
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.h) {
          const newNode: Size = {
              x: freeNode.x,
              y: freeNode.y,
              w: freeNode.w,
              h: usedNode.y - freeNode.y
          };
          this.freeRects.push(newNode);
      }

      // New node at the bottom side of the used node.
      if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
          const newNode: Size = {
              x: freeNode.x,
              y: usedNode.y + usedNode.h,
              w: freeNode.w,
              h: freeNode.y + freeNode.h - (usedNode.y + usedNode.h)
          };
          this.freeRects.push(newNode);
      }

      // New node at the left side of the used node.
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.w) {
          const newNode: Size = {
              x: freeNode.x,
              y: freeNode.y,
              w: usedNode.x - freeNode.x,
              h: freeNode.h
          };
          this.freeRects.push(newNode);
      }

      // New node at the right side of the used node.
      if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
          const newNode: Size = {
              x: usedNode.x + usedNode.w,
              y: freeNode.y,
              w: freeNode.x + freeNode.w - (usedNode.x + usedNode.w),
              h: freeNode.h
          };
          this.freeRects.push(newNode);
      }

      return true;
  }

  private pruneFreeList(): void {
      // Remove all free rectangles that are fully contained within another
      for (let i = 0; i < this.freeRects.length; i++) {
          for (let j = i + 1; j < this.freeRects.length; j++) {
              if (this.isContainedIn(this.freeRects[i], this.freeRects[j])) {
                  this.freeRects.splice(i, 1);
                  i--;
                  break;
              }
              if (this.isContainedIn(this.freeRects[j], this.freeRects[i])) {
                  this.freeRects.splice(j, 1);
                  j--;
              }
          }
      }
  }

  private isContainedIn(a: Size, b: Size): boolean {
      return a.x >= b.x && a.y >= b.y &&
             a.x + a.w <= b.x + b.w &&
             a.y + a.h <= b.y + b.h;
  }
}

interface Size {
  x: number;
  y: number;
  w: number;
  h: number;
}