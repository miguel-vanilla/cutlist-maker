import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe2 } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '简体中文' }
];

export function Header({ isDark, onThemeToggle }: HeaderProps) {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M3 3h18v18H3z" />
            <path d="M12 3v18" />
            <path d="M3 12h18" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Cutlist Maker</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-colors"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <Globe2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}