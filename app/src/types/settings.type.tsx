export type Settings = {
    language: 'en-us' | 'pt-br';
    primaryColor: string;
    secondaryColor: string;
    primaryFontColor: string;
    secondaryFontColor: string;
    interfaceScale: number;
    nozzleSpacing: number;
    apiBaseUrl: string;
    volumeUnit: string;
    areaUnit: string;
    interval: number;
    useDefaultLogo: boolean;
    shouldSimulateSpeed: boolean;
    simulatedSpeed: number;
    demoMode: boolean;
    logo: string;
    timeBeforeAlert: number;
    SSID: string;
    debounce: number;
    minPulsesPerPacket: number;
    maxNumberOfPackets: number;
}