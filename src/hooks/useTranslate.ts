import { useEffect, useState } from "react";
import { SettingsService } from "../services/settings.service";
import { DataFecherService } from "../services/data-fetcher.service";
import { Settings as SettingsType } from "../types/settings.type";
import { TranslationServices } from "../services/translations.service";

export function useTranslate() {
    const [currentLanguage, setCurrentLanguage] = useState<'en-us' | 'pt-br'>('en-us');

    useEffect(() => {
        SettingsService.getSettingOrDefault('language', 'en-us').then((language) => {
            setCurrentLanguage(language);
        });

        const eventHandler = async (settings: SettingsType) => {
            setCurrentLanguage(settings.language);
        };
        SettingsService.addEventListener('onSettingsChanged', eventHandler);
        return () => {
            DataFecherService.removeEventListener('onSettingsChanged', eventHandler);
        }

    }, [setCurrentLanguage, currentLanguage]);

    return (term: string) => TranslationServices.translate(term, currentLanguage);
}