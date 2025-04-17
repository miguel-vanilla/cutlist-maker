import React, { useEffect, useState } from 'react';
import { Calculator, Printer, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { StockPanel, ResultsProps, CalculationResult } from '../types';


export function Results({ calculatePrice, stockPanels, requiredPanels, settings }: ResultsProps) {
  const { t } = useTranslation();
  const [isCalculating, setIsCalculating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentPanelIndex, setCurrentPanelIndex] = React.useState(0);
  const [totalPanels, setTotalPanels] = React.useState(0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!result || !result.layouts || !stockPanels) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(20);
    doc.text(t('app.results.title'), 15, 20);

    // Add statistics
    doc.setFontSize(12);
    doc.text([
      `${t('app.results.stockArea')}: ${(result.stats.totalStockArea / 1000000).toFixed(2)} m²`,
      `${t('app.results.requiredArea')}: ${(result.stats.totalRequiredArea / 1000000).toFixed(2)} m²`,
      `${t('app.results.yield')}: ${result.stats.materialYield.toFixed(1)}%`,
      `${t('app.results.panelsUsed')}: ${result.stats.stockPanelsUsed}`,
      `${t('app.results.cutLength')}: ${(result.stats.totalCutLength / 1000).toFixed(1)} m`,
      result.stats.estimatedCost ? `${t('app.results.cost')}: ${settings.currency}${result.stats.estimatedCost.toFixed(2)}` : ''
    ].filter(Boolean), 15, 35);

    // Create reusable canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size (A4 landscape dimensions in pixels at 96 DPI)
    canvas.width = 1123;  // 297mm * 3.78 pixels/mm
    canvas.height = 794;  // 210mm * 3.78 pixels/mm
    
    // Track current stock panel index
    let panelCount = 0;
    
    // Iterate through all layouts
    for (let i = 0; i < result.layouts.length; i++) {
      const layout = result.layouts[i];
      
      // Find the corresponding stock panel
      let stockPanel: StockPanel | undefined;
      let currentCount = 0;
      
      for (const panel of stockPanels) {
        if (i < currentCount + panel.quantity) {
          stockPanel = panel;
          break;
        }
        currentCount += panel.quantity;
      }
      
      if (!stockPanel || !layout) continue;
      
      // Add new page for each panel after the first
      if (i > 0) {
        doc.addPage();
      }
      
      // Add panel title
      doc.setFontSize(16);
      doc.text(t('app.results.navigation.panel_of', { current: i + 1, total: totalPanels }) + 
               ` (${stockPanel.length} × ${stockPanel.width} mm)`, 15, 80);
      
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scale factors
      const scaleX = canvas.width / stockPanel.length;
      const scaleY = canvas.height / stockPanel.width;
      const scale = Math.min(scaleX, scaleY) * 0.8; // 80% of available space
      
      // Calculate centered position
      const startX = (canvas.width - stockPanel.length * scale) / 2;
      const startY = (canvas.height - stockPanel.width * scale) / 2;
      
      // Draw stock panel border
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        startX,
        startY,
        stockPanel.length * scale,
        stockPanel.width * scale
      );
      
      // Draw cuts
      layout.cuts.forEach(cut => {
        // Draw cut rectangle
        ctx.fillStyle = cut.color || '#e5e7eb';
        ctx.strokeStyle = cut.color ? adjustColor(cut.color, -20) : '#9ca3af';
        ctx.lineWidth = 1;
        
        const x = startX + cut.x * scale;
        const y = startY + cut.y * scale;
        const width = cut.width * scale;
        const height = cut.length * scale;
        
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const label = `${cut.label || ''}\n${cut.length}×${cut.width}mm`;
        const lines = label.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(
            line,
            x + width / 2,
            y + height / 2 + (i - lines.length / 2 + 0.5) * 14
          );
        });
      });
      
      // Add the canvas image
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imageData, 'JPEG', 15, 90, 267, 150);
    }

    let yOffset = 250;

    // Add remaining panels if any
    if (result.remainingPanels.length > 0) {
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.text(t('app.results.remaining.title'), 15, yOffset);
      yOffset += 10;

      result.remainingPanels.forEach((panel, index) => {
        doc.setFontSize(12);
        doc.text(`${panel.label || t('app.results.remaining.panel', { number: index + 1 })}: ${panel.length} × ${panel.width} mm`, 20, yOffset);
        yOffset += 7;
      });
    }

    // Save the PDF
    doc.save('cutting-layout.pdf');
  };

  // Get the current stock panel dimensions
  const currentStockPanel = React.useMemo(() => {
    if (!stockPanels || currentPanelIndex === undefined) return null;
    
    // Find which stock panel this index corresponds to
    let panelCount = 0;
    for (const panel of stockPanels) {
      panelCount += panel.quantity;
      if (currentPanelIndex < panelCount) {
        return panel;
      }
    }
    return null;
  }, [stockPanels, currentPanelIndex]
  );

  useEffect(() => {
    const worker = new Worker(new URL('../workers/layoutWorker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      setIsCalculating(false);
      if (e.data.type === 'success') {
        setResult(e.data.result);
        setError(null);
      } else {
        setError(e.data.error);
        setResult(null);
      }
    };

    worker.onerror = (error) => {
      setIsCalculating(false);
      setError(error.message);
      setResult(null);
    };
    
    // Calculate total panels including quantities
    const total = stockPanels.reduce((sum, panel) => sum + panel.quantity, 0);
    setTotalPanels(total);
    setCurrentPanelIndex(0);

    worker.postMessage({ stockPanels, requiredPanels, settings });

    return () => worker.terminate();
  }, [stockPanels, requiredPanels, settings]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8 border border-gray-100 dark:border-gray-700 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Calculator className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100">{t('app.results.title')}</span>
      </h2>
      <div className="h-px bg-gray-100 dark:bg-gray-700 -mx-8 mb-6" />

      {isCalculating && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">{t('app.results.calculating')}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {result && !isCalculating && !error && 
       result.layouts.length > 0 &&
       result.remainingPanels.length > 0 && (
        currentStockPanel && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg mb-6">
          <div className="font-semibold mb-1">{t('app.results.additional_panel_needed.title')}</div>
          <p>{t('app.results.additional_panel_needed.message')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>{t('app.results.additional_panel_needed.option1')} ({currentStockPanel.length} × {currentStockPanel.width} mm)</li>
            <li>{t('app.results.additional_panel_needed.option2')} {Math.ceil(Math.sqrt(result.stats.totalRequiredArea * 1.1))} × {Math.ceil(Math.sqrt(result.stats.totalRequiredArea * 1.1))} mm</li>
          </ul>
        </div>
      )}
      
      {result && !isCalculating && !error && (<>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.stockArea')}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{(result.stats.totalStockArea / 1000000).toFixed(2)} m²</div>
        </div>
        <div className="bg-green-50/50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100/50 dark:border-green-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.requiredArea')}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{(result.stats.totalRequiredArea / 1000000).toFixed(2)} m²</div>
        </div>
        <div className="bg-purple-50/50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100/50 dark:border-purple-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.yield')}</div>
          <div className={`text-2xl font-semibold ${result.stats.materialYield > 100 ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-gray-100'}`}>
            {result.stats.materialYield.toFixed(1)}%
          </div>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-100/50 dark:border-amber-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.panelsUsed')}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{result.stats.stockPanelsUsed}</div>
        </div>
        <div className="bg-cyan-50/50 dark:bg-cyan-900/20 p-6 rounded-xl border border-cyan-100/50 dark:border-cyan-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.cutLength')}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{(result.stats.totalCutLength / 1000).toFixed(1)} m</div>
        </div>
        {calculatePrice && result.stats.estimatedCost && (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100/50 dark:border-emerald-800/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('app.results.cost')}</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{settings.currency}{result.stats.estimatedCost.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Cutting Layout Visualization */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('app.results.navigation.panel_of', { current: currentPanelIndex + 1, total: totalPanels })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPanelIndex(prev => prev - 1)}
              disabled={currentPanelIndex === 0}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('app.results.navigation.previous')}
            </button>
            <button
              onClick={() => setCurrentPanelIndex(prev => prev + 1)}
              disabled={currentPanelIndex >= totalPanels - 1}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('app.results.navigation.next')}
            </button>
          </div>
        </div>
        <div 
          className="bg-white dark:bg-gray-800 relative"
          style={currentStockPanel?.width && currentStockPanel?.length ? {
            aspectRatio: `${currentStockPanel.length}/${currentStockPanel.width}`, 
            maxWidth: '100%',
            maxHeight: '70vh'
          } : { width: '100%', height: '70vh' }}
        >
          {/* Dimension Labels */}
          {currentStockPanel && <div className="absolute -top-6 left-0 w-full flex justify-center text-sm text-gray-600 dark:text-gray-400">
            {currentStockPanel.length} mm
          </div>}
          {currentStockPanel && <div className="absolute -right-16 top-0 h-full flex items-center text-gray-600 dark:text-gray-400">
            <div className="transform -rotate-90 text-sm">
              {currentStockPanel.width} mm
            </div>
          </div>}
          
          {/* Stock Panel Border */}
          <div className="absolute inset-0 border-2 border-gray-400 dark:border-gray-600">
            {/* Cut Pieces */}
            {result.layouts && 
             result.layouts[currentPanelIndex] && 
             Array.isArray(result.layouts[currentPanelIndex].cuts) &&
             result.layouts[currentPanelIndex].cuts.map((cut, index) => (
              <div
                key={index}
                className="absolute border flex items-center justify-center group"
                style={{
                  left: `${(cut.x / currentStockPanel!.length) * 100}%`,
                  top: `${(cut.y / currentStockPanel!.width) * 100}%`,
                  width: `${(cut.width / currentStockPanel!.length) * 100}%`,
                  height: `${(cut.length / currentStockPanel!.width) * 100}%`,
                  backgroundColor: cut.color || '#e5e7eb',
                  borderColor: cut.color ? adjustColor(cut.color, -20) : '#9ca3af'
                }}
              >
                <div className="text-xs font-medium text-gray-700 text-center">
                  {cut.label}
                  <br />
                  {cut.length || 0} × {cut.width || 0} mm
                </div>
                
                {/* Dimension Labels */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {cut.width || 0} mm
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 transform -rotate-90 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {cut.length || 0} mm
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {result.remainingPanels.length > 0 && (
          <div className="w-full mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-6 py-4 rounded-lg">
            <div className="font-semibold mb-2">{t('app.results.remaining.title')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {result.remainingPanels.map((panel, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
                  <div className="font-medium">{panel.label || t('app.results.remaining.panel', { number: index + 1 })}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{panel.length} × {panel.width} mm</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button 
          onClick={handlePrint}
          className="bg-gray-600 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-sm hover:shadow-md print:hidden"
        >
          <Printer className="w-5 h-5" />
          {t('app.results.print')}
        </button>
        <button 
          onClick={handleDownloadPDF}
          className="bg-gray-600 dark:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-sm hover:shadow-md print:hidden"
        >
          <FileDown className="w-5 h-5" />
          {t('app.results.download')}
        </button>
      </div></>)}
    </div>
  );
}

// Helper function to darken/lighten colors for borders
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(Math.min((num >> 16) + amount, 255), 0);
  const g = Math.max(Math.min(((num >> 8) & 0x00FF) + amount, 255), 0);
  const b = Math.max(Math.min((num & 0x0000FF) + amount, 255), 0);
  return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}