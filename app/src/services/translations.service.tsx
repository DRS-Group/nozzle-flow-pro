import { SettingsService } from "./settings.service"
import translations from '../translations.json';

export namespace TranslationServices {
    export const getCurrentLanguage = async (): Promise<'en-us' | 'pt-br'> => {
        return SettingsService.getSettingOrDefault('language', 'en-us');
    }

    export const getTranslations = (term: string) => {
        for (const terms of translations) {
            if (terms['en-us'] == term) {
                return terms;
            }
        }
        console.warn(`Translation for term ${term} not found`);
        return null;
    }

    export const translate = (term: string, language: 'en-us' | 'pt-br'): string => {
        const translations = getTranslations(term);
        if (translations === null) {
            return term;
        }
        return translations[language];
    }
}