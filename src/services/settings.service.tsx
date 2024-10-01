import { Preferences } from "@capacitor/preferences";
import { Settings } from "../types/settings.type";

export const languages = ['en-us', 'pt-br'];

export const defaultLogoUri = '/images/logo_drs.png';
export const defaultSettings: Settings = {
    language: 'en-us',
    apiBaseUrl: 'http://localhost:3000',
    primaryColor: '#466905',
    secondaryColor: '#ffffff',
    primaryFontColor: '#000000',
    secondaryFontColor: '#ffffff',
    interfaceScale: 1
}

export namespace SettingsService {
    export const setSettings = async (settings: Settings): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });
        });
    }

    export const getSettings = async (): Promise<Settings> => {
        return new Promise((resolve, reject) => {
            Preferences.get({ key: 'settings' }).then((result) => {
                const settings = (result.value ? JSON.parse(result.value) : defaultSettings) as Settings;
                resolve(settings);
            });
        });
    }

    export const getSettingOrDefault = async (key: string, defaultValue: any): Promise<any> => {
        return new Promise(async (resolve, reject) => {

            let settings: Settings | any = await getSettings();

            if (settings[key] === undefined) {
                settings[key] = defaultValue;
            }

            resolve(settings[key]);
        });
    }

    export const setLanguage = async (language: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.language = language;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });
        });
    }

    export const setApiBaseUrl = async (apiBaseUrl: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.apiBaseUrl = apiBaseUrl;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });
        });
    }

    export const getLogoUri = async (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            Preferences.get({ key: 'logoUri' }).then((result) => {
                resolve(result.value || defaultLogoUri);
            });
        });
    }

    export const setLogoUri = async (logoUri: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            Preferences.set({ key: 'logoUri', value: logoUri }).then(() => {
                resolve();
            });
        });
    }
}