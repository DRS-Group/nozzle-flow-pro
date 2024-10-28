import { Preferences } from "@capacitor/preferences";
import { Settings } from "../types/settings.type";
import { EventHandler } from "../types/event-handler";
import { Directory, Filesystem, WriteFileResult } from "@capacitor/filesystem";

export const defaultLogoUri = '/images/logo_drs.png';
export const defaultSettings: Settings = {
    language: 'en-us',
    apiBaseUrl: 'http://localhost:3000',
    primaryColor: '#466905',
    secondaryColor: '#ffffff',
    primaryFontColor: '#000000',
    secondaryFontColor: '#ffffff',
    interfaceScale: 1,
    nozzleSpacing: 1
}

export namespace SettingsService {

    let eventListeners: Map<string, EventHandler<any>[]> = new Map();

    export const addEventListener = (eventName: string, callback: EventHandler<any>) => {
        const listeners = eventListeners.get(eventName) || [];
        listeners.push(callback);
        eventListeners.set(eventName, listeners);
    }

    export const dispatchEvent = (eventName: string, args?: any) => {
        const listeners = eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => listener(args));
        }
    }

    export const removeEventListener = (eventName: string, callback: EventHandler<any>) => {
        const listeners = eventListeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
            if (listeners.length === 0) {
                eventListeners.delete(eventName);
            }
        }
    }

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

            dispatchEvent('onSettingsChange', settings);
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

    export const selectImage = (): Promise<File> => {
        return new Promise(async (resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (event: any) => {
                const file = event.target.files[0];

                resolve(file);
            });
            input.click();
        });
    }

    export const saveFile = (data: string | Blob) => {
        Filesystem.writeFile({ data, path: '/teste/teste.svg' }).catch((reason: any) => {
            console.error(reason);
        }).then((value: void | WriteFileResult) => {
            console.log(value)
        })
    }
}