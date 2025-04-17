import { StockPanel,RequiredPanel,CalculationResult,AppSettings } from "../types";
  
// abstract packer
export abstract class Packer {
    protected stockPanels: StockPanel[]; // array of stockPanel used by packer
    protected requiredPanels: RequiredPanel[]; // array of requiredPanel used by packer
    protected appSettings: AppSettings;//setting of app
  
    constructor(appSettings: AppSettings) {
      this.stockPanels = [];
      this.requiredPanels = [];
      this.appSettings = appSettings;
    }
    /**
     * add stockPanel
     * @param StockPanel array of stockPanel
     */
    abstract addStockPanel(panels: StockPanel[]):void;
  
    /**
     * add requiredPanel
     * @param RequiredPanel array of requiredPanel
     */
    abstract addRequiredPanel(requiredPanels: RequiredPanel[]): void;

    /**
   * get all the stockPanels
   */
    getStockPanels(): StockPanel[] {
        return [...this.stockPanels]; // return the copy
    }

    /**
     * get all the requiredPanels
     */
    getRequiredPanels(): RequiredPanel[] {
        return [...this.requiredPanels]; // return the copy
    }

    /**
   * clear all stockPanels
   */
    clearStockPanels(): void {
        this.stockPanels = [];
    }

    /**
     * clear all requiredPanels
     */
    clearRequiredPanels(): void {
        this.requiredPanels = [];
    }

    
    /**
     * do the packing job
     * @returns CalculationResult
     */
    abstract pack(): CalculationResult;
  
    /**
     * reset the packer
     */
    reset(): void {
        this.clearStockPanels();
        this.clearRequiredPanels();
    }
  }