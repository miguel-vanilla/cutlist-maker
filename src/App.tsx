import React, { useEffect } from 'react';
import { Settings, Trash2, Plus, Calculator, Box, Layers, Ruler, CircleDollarSign, Scissors, Heart, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { Results } from './components/Results';
import { Modal } from './components/Modal';
import { Unit, Currency, AppSettings, StockPanel, RequiredPanel, PackerType } from './types';

function App() {
  const { t } = useTranslation();
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const [showResults, setShowResults] = React.useState(false);
  const [calculationKey, setCalculationKey] = React.useState(0);
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    type: 'stock' | 'required';
    index: number;
  }>({
    isOpen: false,
    type: 'stock',
    index: -1
  });

  const [calculatedLayout, setCalculatedLayout] = React.useState<{
    stockPanels: StockPanel[];
    requiredPanels: RequiredPanel[];
    settings: AppSettings;
  } | null>(null);

  const [settings, setSettings] = React.useState<AppSettings>({
    packerType: PackerType.LEFTBOTTOM,
    units: Unit.MM,
    currency: Currency.EURO,
    kerfWidth: 3,
    considerGrain: false,
    calculatePrice: false,
    includeEdgeBanding: false,
    edgeBandingThickness: 2,
    includeEdgeTrimming: false,
    edgeTrimAmount: 2,
  });

  const [stockPanels, setStockPanels] = React.useState<StockPanel[]>([
    { length: 2440, width: 1220, quantity: 1 }
  ]);

  const [requiredPanels, setRequiredPanels] = React.useState<RequiredPanel[]>([
    { length: 600, width: 400, quantity: 1, label: 'Sample Panel', color: '#e5e7eb' }
  ]);

  const canCalculate = React.useMemo(() => {
    const hasValidStock = stockPanels.some(panel => panel.quantity > 0);
    const hasValidRequired = requiredPanels.some(panel => panel.quantity > 0);
    return hasValidStock && hasValidRequired;
  }, [stockPanels, requiredPanels]);

  const addStockPanel = () => {
    setStockPanels([...stockPanels, { length: 0, width: 0, quantity: 1 }]);
  };

  const addRequiredPanel = () => {
    setRequiredPanels([...requiredPanels, { length: 0, width: 0, quantity: 1 }]);
  };

  const removeStockPanel = (index: number) => {
    setDeleteModal({
      isOpen: true,
      type: 'stock',
      index
    });
  };

  const removeRequiredPanel = (index: number) => {
    setDeleteModal({
      isOpen: true,
      type: 'required',
      index
    });
  };

  const handleDelete = () => {
    if (deleteModal.type === 'stock') {
      setStockPanels(stockPanels.filter((_, i) => i !== deleteModal.index));
    } else {
      setRequiredPanels(requiredPanels.filter((_, i) => i !== deleteModal.index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDelete}
        title={t('app.delete.title')}
        message={t('app.delete.message', { type: deleteModal.type === 'stock' ? t('app.panels.stock.title') : t('app.panels.required.title') })}
      />
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Header isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} />
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
          {t('app.subtitle')}
        </p>

        {/* Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-8 border border-gray-100 dark:border-gray-700 relative">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            {t('app.settings.title')}
          </h2>
          <div className="h-px bg-gray-100 -mx-8 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  {t('app.settings.packer')}
                </div>
              </label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none transition-colors"
                  value={settings.packerType}
                  onChange={(e) => setSettings({ ...settings, packerType: e.target.value as typeof PackerType[keyof typeof PackerType] })}
                >
                  <option value="LeftBottom">{t('app.settings.packerType.leftBottom')}</option>
                  <option value="MaxRects">{t('app.settings.packerType.maxRects')}</option>
                </select>
                <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-gray-600" />
                  {t('app.settings.units')}
                </div>
              </label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none transition-colors"
                  value={settings.units}
                  onChange={(e) => setSettings({ ...settings, units: e.target.value as typeof Unit[keyof typeof Unit] })}
                >
                  <option value="mm">{t('app.settings.units_options.mm')}</option>
                  <option value="cm">{t('app.settings.units_options.cm')}</option>
                  <option value="inches">{t('app.settings.units_options.inches')}</option>
                </select>
                <Ruler className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-gray-600" />
                  {t('app.settings.currency')}
                </div>
              </label>
              <div className="relative">
                <select
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none transition-colors"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value as typeof Currency[keyof typeof Currency] })}
                >
                  <option value="€">{t('app.settings.currency_options.eur')}</option>
                  <option value="$">{t('app.settings.currency_options.usd')}</option>
                  <option value="¥">{t('app.settings.currency_options.jpy')}</option>
                  <option value="¥">{t('app.settings.currency_options.cny')}</option>
                </select>
                <CircleDollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-gray-600" />
                  {t('app.settings.kerfWidth')}
                </div>
              </label>
              <div className="flex relative">
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  value={settings.kerfWidth}
                  onChange={(e) => setSettings({ ...settings, kerfWidth: Number(e.target.value) })}
                />
                <Scissors className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="ml-2 text-gray-600 dark:text-gray-400 self-center">{settings.units}</span>
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors dark:bg-gray-700 dark:checked:bg-blue-600"
                  checked={settings.considerGrain}
                  onChange={(e) => setSettings({ ...settings, considerGrain: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('app.settings.considerGrain')}</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors dark:bg-gray-700 dark:checked:bg-blue-600"
                  checked={settings.calculatePrice}
                  onChange={(e) => setSettings({ ...settings, calculatePrice: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('app.settings.calculatePrice')}</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors dark:bg-gray-700 dark:checked:bg-blue-600"
                  checked={settings.includeEdgeBanding}
                  onChange={(e) => setSettings({ ...settings, includeEdgeBanding: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('app.settings.includeEdgeBanding')}</span>
              </label>
              {settings.includeEdgeBanding && (
                <div className="flex">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                    value={settings.edgeBandingThickness}
                    onChange={(e) => setSettings({ ...settings, edgeBandingThickness: Number(e.target.value) })}
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-400 self-center">{settings.units}</span>
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-colors dark:bg-gray-700 dark:checked:bg-blue-600"
                  checked={settings.includeEdgeTrimming}
                  onChange={(e) => setSettings({ ...settings, includeEdgeTrimming: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('app.settings.includeEdgeTrimming')}</span>
              </label>
              {settings.includeEdgeTrimming && (
                <div className="flex">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                    value={settings.edgeTrimAmount}
                    onChange={(e) => setSettings({ ...settings, edgeTrimAmount: Number(e.target.value) })}
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-400 self-center">{settings.units}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stock Panels Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Box className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{t('app.panels.stock.title')}</span>
            </h2>
            <div className="h-px bg-gray-100 dark:bg-gray-700 -mx-8 mb-6" />
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 w-12 text-gray-900 dark:text-gray-100">#</th>
                    <th className="text-left py-2 px-4 text-gray-900 dark:text-gray-100">{t('app.panels.stock.length')} ({settings.units})</th>
                    <th className="text-left py-2 px-4 text-gray-900 dark:text-gray-100">{t('app.panels.stock.width')} ({settings.units})</th>
                    <th className="text-left py-2 px-4 w-24 text-gray-900 dark:text-gray-100">{t('app.panels.stock.quantity')}</th>
                    {settings.calculatePrice && (
                      <th className="text-left py-2 px-4 text-gray-900 dark:text-gray-100">{t('app.panels.stock.price')}</th>
                    )}
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {stockPanels.map((panel, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 px-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                          value={panel.length || ''}
                          onChange={(e) => {
                            const newPanels = [...stockPanels];
                            newPanels[index] = { ...panel, length: Number(e.target.value) };
                            setStockPanels(newPanels);
                          }}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                          value={panel.width || ''}
                          onChange={(e) => {
                            const newPanels = [...stockPanels];
                            newPanels[index] = { ...panel, width: Number(e.target.value) };
                            setStockPanels(newPanels);
                          }}
                        />
                      </td>
                      <td className="py-2 px-4 w-24">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.quantity || ''}
                            onChange={(e) => {
                              const newPanels = [...stockPanels];
                              newPanels[index] = { ...panel, quantity: Number(e.target.value) };
                              setStockPanels(newPanels);
                            }}
                          />
                      </td>
                      {settings.calculatePrice && (
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.price || ''}
                            placeholder={`0.00 ${settings.currency}`}
                            onChange={(e) => {
                              const newPanels = [...stockPanels];
                              newPanels[index] = { ...panel, price: Number(e.target.value) };
                              setStockPanels(newPanels);
                            }}
                          />
                        </td>
                      )}
                      <td className="py-2 px-4">
                        <button
                          onClick={() => removeStockPanel(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex">
              <button
                onClick={addStockPanel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('app.panels.stock.add')}
              </button>
            </div>
          </div>

          {/* Required Panels Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">{t('app.panels.required.title')}</span>
            </h2>
            <div className="h-px bg-gray-100 dark:bg-gray-700 -mx-8 mb-6" />
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 w-12 text-gray-900 dark:text-gray-100">#</th>
                    <th className="text-left py-2 px-4 text-gray-900 dark:text-gray-100">{t('app.panels.required.length')} ({settings.units})</th>
                    <th className="text-left py-2 px-4 text-gray-900 dark:text-gray-100">{t('app.panels.required.width')} ({settings.units})</th>
                    <th className="text-left py-2 px-4 w-32 text-gray-900 dark:text-gray-100">{t('app.panels.required.quantity')}</th>
                    <th className="text-left py-2 px-4 w-16 text-gray-900 dark:text-gray-100"></th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {requiredPanels.map((panel, index) => (
                    <React.Fragment key={index}>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-2 px-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.length || ''}
                            onChange={(e) => {
                              const newPanels = [...requiredPanels];
                              newPanels[index] = { ...panel, length: Number(e.target.value) };
                              setRequiredPanels(newPanels);
                            }}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.width || ''}
                            onChange={(e) => {
                              const newPanels = [...requiredPanels];
                              newPanels[index] = { ...panel, width: Number(e.target.value) };
                              setRequiredPanels(newPanels);
                            }}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number" 
                            min="1"
                            step="1"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.quantity || ''}
                            onChange={(e) => {
                              const newPanels = [...requiredPanels];
                              newPanels[index] = { ...panel, quantity: Number(e.target.value) };
                              setRequiredPanels(newPanels);
                            }}
                          />
                        </td>
                        <td className="py-2 px-4 w-16">
                          <input
                            type="color"
                            className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                            value={panel.color || '#e5e7eb'}
                            onChange={(e) => {
                              const newPanels = [...requiredPanels];
                              newPanels[index] = { ...panel, color: e.target.value };
                              setRequiredPanels(newPanels);
                            }}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <button
                            onClick={() => removeRequiredPanel(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4" colSpan={5}>
                          <input
                            type="text"
                            placeholder={t('app.panels.required.label')}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                            value={panel.label || ''}
                            onChange={(e) => {
                              const newPanels = [...requiredPanels];
                              newPanels[index] = { ...panel, label: e.target.value };
                              setRequiredPanels(newPanels);
                            }}
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex">
              <button
                onClick={addRequiredPanel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('app.panels.required.add')}
              </button>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex justify-center mb-12">
          <button 
            onClick={() => {
              // Additional validation for dimensions
              const hasValidStockDimensions = stockPanels.every(panel => 
                panel.length > 0 && panel.width > 0 && panel.quantity > 0
              );
              const hasValidRequiredDimensions = requiredPanels.every(panel =>
                panel.length > 0 && panel.width > 0 && panel.quantity > 0
              );
              
              if (hasValidStockDimensions && hasValidRequiredDimensions) {
                setCalculatedLayout({
                  stockPanels,
                  requiredPanels,
                  settings
                });
                setCalculationKey(prev => prev + 1);
                setShowResults(true);
              } else {
                alert(t('app.validation.dimensions_required'));
              }
            }}
            disabled={!canCalculate}
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold flex items-center gap-3 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
          >
            <Calculator className="w-5 h-5" />
            {t('app.calculate')}
          </button>
        </div>

        {showResults && (
          <Results
            key={calculationKey}
            calculatePrice={calculatedLayout!.settings.calculatePrice}
            stockPanels={calculatedLayout!.stockPanels}
            requiredPanels={calculatedLayout!.requiredPanels}
            settings={calculatedLayout!.settings}
          />
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-8">
          Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by Miguel Lobo
        </div>
      </div>
    </div>
  );
}

export default App