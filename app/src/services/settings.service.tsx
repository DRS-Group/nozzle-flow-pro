import { Settings } from "../types/settings.type";
import { EventHandler } from "../types/event-handler.type";
import sha256 from 'crypto-js/sha256';
import { services } from "../dependency-injection";

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
    simulatedSpeed: 10,
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

    export const setSettings = (settings: Settings) => {
        window.electron.store.setAll(settings);
    }

    export const getSettings = () => {
        return window.electron.store.getAll() as Settings;
    }

    export const getSettingOrDefault = (key: string, defaultValue: any) => {
        return window.electron.store.get(key) ?? defaultValue;
    }

    export const setLanguage = (language: 'en-us' | 'pt-br') => {
        window.electron.store.set('language', language);
        dispatchEvent('onLanguageChanged', language);

        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setInterfaceScale = (interfaceScale: number) => {
        window.electron.store.set('interfaceScale', interfaceScale);
        dispatchEvent('onInterfaceScaleChanged', interfaceScale);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setSSID = (SSID: string) => {
        window.electron.store.set('SSID', SSID);
        dispatchEvent('onSSIDChanged', SSID);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setApiBaseUrl = (apiBaseUrl: string) => {
        window.electron.store.set('apiBaseUrl', apiBaseUrl);
        dispatchEvent('onApiBaseUrlChanged', apiBaseUrl);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setUseDefaultLogo = (useDefaultLogo: boolean) => {
        window.electron.store.set('useDefaultLogo', useDefaultLogo);
        dispatchEvent('onUseDefaultLogoChanged', useDefaultLogo);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const getLogoUri = (): string => {
        const useDefaultLogo: boolean = getSettingOrDefault('useDefaultLogo', defaultSettings.useDefaultLogo);
        const DEFAULT_LOGO_URI = `${process.env.PUBLIC_URL}/images/D-Flow.svg`;

        if (useDefaultLogo) {
            return DEFAULT_LOGO_URI;
        }

        const logo = getSettingOrDefault('logo', defaultSettings.logo);
        if (!logo) {
            return DEFAULT_LOGO_URI;
        }
        return logo;
    }

    export const setLogo = (image?: File): Promise<void> => {
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
                setUseDefaultLogo(true);
                resolve();
            }
            else {
                const base64 = await getBase64(image);
                window.electron.store.set('logo', base64);
                setUseDefaultLogo(false);
                resolve();
                dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
            }
        });
    }

    export const setPrimaryColor = (primaryColor: string) => {
        window.electron.store.set('primaryColor', primaryColor);
        dispatchEvent('onPrimaryColorChanged', primaryColor);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setSecondaryColor = (secondaryColor: string) => {
        window.electron.store.set('secondaryColor', secondaryColor);
        dispatchEvent('onSecondaryColorChanged', secondaryColor);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setPrimaryFontColor = (primaryFontColor: string) => {
        window.electron.store.set('primaryFontColor', primaryFontColor);
        dispatchEvent('onPrimaryFontColorChanged', primaryFontColor);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setSecondaryFontColor = (secondaryFontColor: string) => {
        window.electron.store.set('secondaryFontColor', secondaryFontColor);
        dispatchEvent('onSecondaryFontColorChanged', secondaryFontColor);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setVolumeUnit = (volumeUnit: string) => {
        window.electron.store.set('volumeUnit', volumeUnit);
        dispatchEvent('onVolumeUnitChanged', volumeUnit);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setAreaUnit = (areaUnit: string) => {
        window.electron.store.set('areaUnit', areaUnit);
        dispatchEvent('onAreaUnitChanged', areaUnit);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const selectImage = (): Promise<File> => {
        return new Promise((resolve, reject) => {
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

    export const setInterval = (interval: number) => {
        window.electron.store.set('interval', interval);

        services.dataFetcherService.setInterval(interval);

        dispatchEvent('onIntervalChanged', interval);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const getInterval = () => {
        return window.electron.store.get('interval');
    }

    export const setNozzleSpacing = (nozzleSpacing: number) => {
        window.electron.store.set('nozzleSpacing', nozzleSpacing);
        dispatchEvent('onNozzleSpacingChanged', nozzleSpacing);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setTimeBeforeAlert = (timeBeforeAlert: number) => {
        window.electron.store.set('timeBeforeAlert', timeBeforeAlert);
        dispatchEvent('onTimeBeforeAlertChanged', timeBeforeAlert);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const getTimeBeforeAlert = (): number => {
        return window.electron.store.get('timeBeforeAlert');
    }

    export const getIsAdmin = (): boolean => {
        return isAdmin;
    }

    export const setIsAdmin = (value: boolean): void => {
        isAdmin = value;

        dispatchEvent('onIsAdminChanged', value);
    }

    export const setAdminPassword = (password: string) => {
        window.electron.store.set('adminPassword', sha256(password).toString());
        dispatchEvent('onAdminPasswordChanged');
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const checkAdminPassword = (password: string) => {
        const adminPassword = window.electron.store.get('adminPassword');
        return adminPassword === sha256(password).toString();
    }

    export const isAdminPasswordSet = () => {
        const adminPassword = window.electron.store.get('adminPassword');
        return adminPassword !== null && adminPassword !== undefined;
    }

    export const setShouldSimulateSpeed = (value: boolean) => {
        window.electron.store.set('shouldSimulateSpeed', value);
        dispatchEvent('onShouldSimulateSpeedChanged', value);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const setSimulatedSpeed = (value: number) => {
        window.electron.store.set('simulatedSpeed', value / 3.6); // Convert from km/h to m/s
        dispatchEvent('onSimulatedSpeedChanged', value / 3.6);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export const getSimulatedSpeed = () => {
        const simulatedSpeed = window.electron.store.get('simulatedSpeed');
        return simulatedSpeed * 3.6; // Convert from m/s to km/h
    }

    export const getShouldSimulateSpeed = () => {
        const shouldSimulateSpeed = window.electron.store.get('shouldSimulateSpeed');
        return shouldSimulateSpeed;
    }

    export const getDemoMode = () => {
        const demoMode = window.electron.store.get('demoMode');
        return demoMode;
    }

    export const setDemoMode = (value: boolean) => {
        window.electron.store.set('demoMode', value);
        dispatchEvent('onDemoModeChanged', value);
        dispatchEvent('onSettingsChanged', window.electron.store.getAll() as Settings);
    }

    export async function checkIfIsConnected() {
        const networks = await window.electron.getCurrentWifi();
        if (!networks || networks.length === 0) return false;

        const ssid = networks[0].bssid;
        const expected = SettingsService.getSettingOrDefault('SSID', 'D-Flow DEMO');
        return ssid === expected;
    }
}

const isAdminPasswordSet = SettingsService.isAdminPasswordSet();
if (!isAdminPasswordSet) {
    SettingsService.setSettings(defaultSettings);
}

let isConnecting = false;

export async function connectToAPIWifi() {
    if (isConnecting) return;
    isConnecting = true;

    const SSID = SettingsService.getSettingOrDefault('SSID', 'D-Flow DEMO');

    try {
        await window.electron.connectToWifi({ ssid: SSID, password: '123456789' });
        SettingsService.setIsConnectedToWifi(true);
        SettingsService.dispatchEvent('onNetworkStatusChange', true);
    } catch (err) {
        console.error('Wi-Fi connection failed:', err);
    } finally {
        isConnecting = false;
    }
}

let lastIsConnected = false;

async function monitorNetworkLoop() {
    const start = Date.now();
    const isConnected = await SettingsService.checkIfIsConnected();
    if (isConnected !== lastIsConnected) {
        lastIsConnected = isConnected;
        SettingsService.setIsConnectedToWifi(isConnected);
        SettingsService.dispatchEvent('onNetworkStatusChange', isConnected);
    }
    if (!isConnected) {
        await connectToAPIWifi();
    }
    const elapsed = Date.now() - start;
    const delay = Math.max(1000 - elapsed, 0);
    setTimeout(monitorNetworkLoop, delay);
}

monitorNetworkLoop();