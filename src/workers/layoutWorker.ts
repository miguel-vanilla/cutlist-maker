import { PackerFactory, PackerTypes } from "../packer/PackerFactory";

// Web Worker message handler
self.onmessage = (e: MessageEvent) => {
  const { stockPanels, requiredPanels, settings } = e.data;
  
  try {
    // new a packer
    const packer = PackerFactory.createPacker(PackerTypes.MAX_RECTS, settings);
    packer.addStockPanel(stockPanels);
    packer.addRequiredPanel(requiredPanels);
    const result = packer.pack();
    self.postMessage({ type: 'success', result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};