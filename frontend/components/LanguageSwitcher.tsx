'use client';

import { useTranslation } from './TranslationProvider';

export default function LanguageSwitcher() {
    const { language, setLanguage, languages } = useTranslation();

    return (
        <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'tr' | 'en' | 'de')}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.name}
                </option>
            ))}
        </select>
    );
}
