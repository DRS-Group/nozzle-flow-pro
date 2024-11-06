import { Preferences } from "@capacitor/preferences";
import { Settings } from "../types/settings.type";
import { EventHandler } from "../types/event-handler";
import { DataFecherService } from "./data-fetcher.service";
import { Directory, Encoding, FileInfo, Filesystem, ReaddirResult, WriteFileResult } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export const defaultSettings: Settings = {
    language: 'en-us',
    apiBaseUrl: 'http://localhost:3000',
    primaryColor: '#466905',
    secondaryColor: '#ffffff',
    primaryFontColor: '#000000',
    secondaryFontColor: '#ffffff',
    interfaceScale: 1,
    nozzleSpacing: 0.6,
    volumeUnit: 'L',
    areaUnit: 'ha',
    interval: 1000,
    useDefaultLogo: true,
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
                dispatchEvent('onSettingsChanged', settings);
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

    export const setLanguage = async (language: 'en-us' | 'pt-br'): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.language = language;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onLanguageChanged', language);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setInterfaceScale = async (interfaceScale: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.interfaceScale = interfaceScale;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onInterfaceScaleChanged', interfaceScale);
            dispatchEvent('onSettingsChanged', settings);
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

    export const getLogoUri = (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            const useDefaultLogo: boolean = await getSettingOrDefault('useDefaultLogo', defaultSettings.useDefaultLogo);

            const DEFAULT_LOGO_URI = '/images/logo_drs.png';

            if (useDefaultLogo) {
                resolve(DEFAULT_LOGO_URI);
                return;
            }

            const logoImageName: string | undefined = (await Filesystem.readdir({
                path: 'NozzleFlowPro',
                directory: Directory.Documents
            })).files.find((file: FileInfo) => file.name.split('.')[0] === 'logo')?.name;

            if (!logoImageName) {
                resolve(DEFAULT_LOGO_URI);
                return;
            }

            const logoFilePath: string = (await Filesystem.getUri({
                directory: Directory.Documents,
                path: `NozzleFlowPro/${logoImageName}`
            })).uri;

            resolve(Capacitor.convertFileSrc(logoFilePath));
        });
    }

    export const setLogo = async (image?: File): Promise<void> => {
        function getBase64(file: File): Promise<string> {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        }

        return new Promise(async (resolve, reject) => {
            const logos: string[] = (await Filesystem.readdir({
                path: 'NozzleFlowPro',
                directory: Directory.Documents
            })).files.filter((file: FileInfo) => file.name.split('.')[0] === 'logo').map((file: FileInfo) => file.name);

            for (const logo of logos) {
                await Filesystem.deleteFile({
                    path: `NozzleFlowPro/${logo}`,
                    directory: Directory.Documents
                });
            }

            if (!image) {
                const settings = await getSettings();
                settings.useDefaultLogo = true;
                await setSettings(settings);
                resolve();
                dispatchEvent('onSettingsChanged', settings);
            }
            else {
                const base64 = await getBase64(image);

                await Filesystem.writeFile({
                    data: base64,
                    directory: Directory.Documents,
                    path: `NozzleFlowPro/logo.${image.type.split('/')[1]}`,
                    recursive: true
                });

                const settings = await getSettings();
                settings.useDefaultLogo = false;
                await setSettings(settings);
                resolve();
                dispatchEvent('onSettingsChanged', settings);
            }
        });
    }

    export const setPrimaryColor = async (primaryColor: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.primaryColor = primaryColor;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onPrimaryColorChanged', primaryColor);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setSecondaryColor = async (secondaryColor: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.secondaryColor = secondaryColor;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onSecondaryColorChanged', secondaryColor);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setPrimaryFontColor = async (primaryFontColor: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.primaryFontColor = primaryFontColor;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onPrimaryFontColorChanged', primaryFontColor);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setSecondaryFontColor = async (secondaryFontColor: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.secondaryFontColor = secondaryFontColor;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onSecondaryFontColorChanged', secondaryFontColor);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setVolumeUnit = async (volumeUnit: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.volumeUnit = volumeUnit;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onVolumeUnitChanged', volumeUnit);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setAreaUnit = async (areaUnit: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.areaUnit = areaUnit;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onAreaUnitChanged', areaUnit);
            dispatchEvent('onSettingsChanged', settings);
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

    export const setInterval = async (interval: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.interval = interval;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            DataFecherService.setInterval(interval);

            dispatchEvent('onIntervalChanged', interval);
            dispatchEvent('onSettingsChanged', settings);
        });
    }
}