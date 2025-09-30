import { Preferences } from "@capacitor/preferences";
import { Settings } from "../types/settings.type";
import { EventHandler } from "../types/event-handler";
import { DataFecherService } from "./data-fetcher.service";
import { Directory, Encoding, FileInfo, Filesystem, ReaddirResult, WriteFileResult } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import sha256 from 'crypto-js/sha256';
import { services } from "../dependency-injection";

import { CapacitorWifiConnect } from "@falconeta/capacitor-wifi-connect";
import { Network } from "@capacitor/network";

const checkIfIsConnected = async () => {
    const appSSID = await CapacitorWifiConnect.getAppSSID()
    const androidSSID = await CapacitorWifiConnect.getDeviceSSID()

    return appSSID.value === await SettingsService.getSettingOrDefault('SSID', 'D-Flow DEMO') || androidSSID.value === await SettingsService.getSettingOrDefault('SSID', 'D-Flow DEMO');
}

export const defaultSettings: Settings = {
    language: 'pt-br',
    apiBaseUrl: 'http://192.168.0.1',
    primaryColor: '#466905',
    secondaryColor: '#ffffff',
    primaryFontColor: '#000000',
    secondaryFontColor: '#ffffff',
    interfaceScale: 1,
    nozzleSpacing: 0.6,
    volumeUnit: 'L',
    areaUnit: 'ha',
    interval: 2500,
    useDefaultLogo: true,
    shouldSimulateSpeed: false,
    simulatedSpeed: 0,
    demoMode: false,
    logo: '',
    timeBeforeAlert: 5 * 1000,
    SSID: 'D-Flow',
}

export namespace SettingsService {
    let eventListeners: Map<string, EventHandler<any>[]> = new Map();
    let isAdmin: boolean = false;
    let _isConnectedToWifi = false;
    export const isConnectedToWifi = () => _isConnectedToWifi;
    export const setIsConnectedToWifi = (value: boolean) => _isConnectedToWifi = value;

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

    export const setSSID = async (SSID: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();
            settings.SSID = SSID;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });
            dispatchEvent('onSSIDChanged', SSID);
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

            const DEFAULT_LOGO_URI = '/images/D-Flow.svg';

            if (useDefaultLogo) {
                resolve(DEFAULT_LOGO_URI);
                return;
            }

            const settings = await getSettings();
            const logoFilePath = settings.logo;
            if (!logoFilePath) {
                resolve(DEFAULT_LOGO_URI);
                return;
            }

            resolve(logoFilePath);
            return;
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
            if (!image) {
                const settings = await getSettings();
                settings.useDefaultLogo = true;
                await setSettings(settings);
                resolve();
                dispatchEvent('onSettingsChanged', settings);
            }
            else {
                const base64 = await getBase64(image);

                const settings = await getSettings();
                settings.useDefaultLogo = false;
                settings.logo = base64;
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

            services.dataFetcherService.setInterval(interval);

            dispatchEvent('onIntervalChanged', interval);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const getInterval = async (): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const settings = await getSettings();
            resolve(settings.interval);
        });
    }

    export const setNozzleSpacing = async (nozzleSpacing: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.nozzleSpacing = nozzleSpacing;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onNozzleSpacingChanged', nozzleSpacing);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setTimeBeforeAlert = async (timeBeforeAlert: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.timeBeforeAlert = timeBeforeAlert;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onTimeBeforeAlertChanged', timeBeforeAlert);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const getTimeBeforeAlert = async (): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const settings = await getSettings();
            resolve(settings.timeBeforeAlert);
        });
    }

    export const getIsAdmin = (): boolean => {
        return isAdmin;
    }

    export const setIsAdmin = (value: boolean): void => {
        isAdmin = value;

        dispatchEvent('onIsAdminChanged', value);
    }

    export const setAdminPassword = async (password: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            await Preferences.set({ key: 'adminPassword', value: sha256(password).toString() });

            dispatchEvent('onAdminPasswordChanged');

            resolve();
        });
    }

    export const checkAdminPassword = async (password: string): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            const adminPassword = await Preferences.get({ key: 'adminPassword' });
            resolve(adminPassword.value === sha256(password).toString());
        });
    }

    export const isAdminPasswordSet = async (): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            const adminPassword = await Preferences.get({ key: 'adminPassword' });
            resolve(adminPassword.value !== null);
        });
    }

    export const setShouldSimulateSpeed = async (value: boolean): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.shouldSimulateSpeed = value;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onShouldSimulateSpeedChanged', value);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const setSimulatedSpeed = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.simulatedSpeed = value / 3.6; // Convert from km/h to m/s

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onSimulatedSpeedChanged', value / 3.6);
            dispatchEvent('onSettingsChanged', settings);
        });
    }

    export const getSimulatedSpeed = async (): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const settings = await getSettings();
            resolve(settings.simulatedSpeed * 3.6); // Convert from m/s to km/h
        });
    }

    export const getShouldSimulateSpeed = async (): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            const settings = await getSettings();
            resolve(settings.shouldSimulateSpeed);
        });
    }

    export const getDemoMode = async (): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            const settings = await getSettings();
            resolve(settings.demoMode);
        });
    }

    export const setDemoMode = async (value: boolean): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let settings = await getSettings();

            settings.demoMode = value;

            Preferences.set({ key: 'settings', value: JSON.stringify(settings) }).then(() => {
                resolve();
            });

            dispatchEvent('onDemoModeChanged', value);
            dispatchEvent('onSettingsChanged', settings);
        });
    }
}

let isConnecting = false;

const connectToAPIWifi = async () => {

    const SSID = await SettingsService.getSettingOrDefault('SSID', 'D-Flow DEMO');

    if (isConnecting) return;
    isConnecting = true;

    let { value } = await CapacitorWifiConnect.checkPermission();
    if (value === 'prompt') {
        const data = await CapacitorWifiConnect.requestPermission();
        value = data.value;
    }
    if (value === 'granted') {
        await CapacitorWifiConnect.secureConnect({
            ssid: SSID,
            password: '123456789',
        }).then(async (data) => {
            if (data.value === 0) {
                SettingsService.setIsConnectedToWifi(true);
                SettingsService.dispatchEvent('onNetworkStatusChange', true);
            }
        });;
    } else {
        throw new Error('permission denied');
    }
    isConnecting = false;
}

Network.addListener('networkStatusChange', async (status) => {
    const isConnected = await checkIfIsConnected();
    if (isConnected) {
        SettingsService.setIsConnectedToWifi(true);
        SettingsService.dispatchEvent('onNetworkStatusChange', true);
    }
    else {
        SettingsService.setIsConnectedToWifi(false);
        SettingsService.dispatchEvent('onNetworkStatusChange', false);
        connectToAPIWifi();
    }
});

checkIfIsConnected().then((isConnected) => {
    if (isConnected) {
        SettingsService.setIsConnectedToWifi(true);
        SettingsService.dispatchEvent('onNetworkStatusChange', true);
    } else {
        SettingsService.setIsConnectedToWifi(false);
        SettingsService.dispatchEvent('onNetworkStatusChange', false);
        connectToAPIWifi();
    }
});


setInterval(async () => {
    if (Capacitor.getPlatform() === 'web') return;

    checkIfIsConnected().then((isConnected) => {
        if (!isConnected) connectToAPIWifi();
    });
}, 100);