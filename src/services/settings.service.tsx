import { Preferences } from "@capacitor/preferences";

export const languages = ['en-us', 'pt-br'];

export namespace SettingsService {

    export type Settings = {
        language: string;
        primaryColor: string;
        secondaryColor: string;
    }

    export const getSettings = async (): Promise<Settings> => {
        return new Promise((resolve, reject) => {
            Preferences.get({ key: 'settings' }).then((result) => {
                resolve(JSON.parse(result.value || '{}') as Settings);
            });
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
}