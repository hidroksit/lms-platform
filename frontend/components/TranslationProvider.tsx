'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import tr from '../i18n/tr.json';
import en from '../i18n/en.json';
import de from '../i18n/de.json';

type Language = 'tr' | 'en' | 'de';

interface TranslationContextType {
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
    languages: { code: Language; name: string }[];
}

const translations: Record<Language, any> = { tr, en, de };

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('tr');

    useEffect(() => {
        // Load saved language from localStorage
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && translations[savedLang]) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }

        return value || key;
    };

    const languages = [
        { code: 'tr' as Language, name: 'Türkçe' },
        { code: 'en' as Language, name: 'English' },
        { code: 'de' as Language, name: 'Deutsch' },
    ];

    return (
        <TranslationContext.Provider value={{ t, language, setLanguage, languages }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}
