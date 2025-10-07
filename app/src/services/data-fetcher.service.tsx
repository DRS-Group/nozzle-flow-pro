import { NozzlesService } from './nozzles.service';
import { SettingsService } from './settings.service';
import { ESPData } from '../types/ESP-data.type';
import { BaseService, IBaseService } from '../types/base-service.type';
import { Nozzle } from '../types/nozzle.type';
import { services } from '../dependency-injection';
import axios from 'axios';

let demoModeData: { nozzles: Nozzle[], speed: number } = { nozzles: [], speed: 0 };

export type DataFecherServiceEvents = 'onDataFetched';

export interface IDataFecherService extends IBaseService<DataFecherServiceEvents> {
    fetchData: () => Promise<ESPData>;
    setInterval: (value: number) => Promise<void>;
    getModuleMode: () => Promise<number>;
    setModuleMode: (value: number) => Promise<void>;
    getSecondaryModulesCount: () => Promise<number>;
    removeAllSecondaryModules: () => Promise<void>;
}

export class DataFecherService extends BaseService<DataFecherServiceEvents> implements IDataFecherService {
    public fetchData = async (): Promise<ESPData> => {
        return new Promise(async (resolve, reject) => {
            const isDemoMode = SettingsService.getSettingOrDefault('demoMode', false);

            if (isDemoMode) {
                const nozzles = await NozzlesService.getNozzles();
                const currentJob = await services.currentJobService.getCurrentJob();

                if (!currentJob) {
                    resolve({ nozzles: [], speed: 0, coordinates: { latitude: 0, longitude: 0 } } as ESPData);
                    return;
                }

                if (demoModeData.speed === 0) {
                    demoModeData.speed = 2.5; // default speed in km/h
                }

                if (demoModeData.nozzles.length != nozzles.length) {
                    const expectedFlow = (demoModeData.speed * 3.6 * (SettingsService.getSettingOrDefault('nozzleSpacing', 0.6)) * 100 * currentJob?.expectedFlow) / 60000;
                    demoModeData.nozzles = nozzles.map((nozzle: Nozzle) => ({ ...nozzle, pulsesPerMinute: expectedFlow * nozzle.pulsesPerLiter }));
                }
                else {
                    const shouldChangeSpeed = Math.random() < 0.05; // 10% chance to change speed
                    if (shouldChangeSpeed) {
                        demoModeData.speed += (Math.random() - 0.5) * 0.05; // randomize +/-0.025

                        if (demoModeData.speed < 2) {
                            demoModeData.speed = 2; // minimum speed
                        }
                        if (demoModeData.speed > 3.5) {
                            demoModeData.speed = 3.5; // maximum speed
                        }
                    }

                    for (let i = 0; i < nozzles.length; i++) {
                        const expectedFlow = (demoModeData.speed * 3.6 * (SettingsService.getSettingOrDefault('nozzleSpacing', 0.6)) * 100 * currentJob?.expectedFlow) / 60000;
                        const expectedPulsesPerMinute = expectedFlow * nozzles[i].pulsesPerLiter;

                        const shouldChangePulses = Math.random() < 0.25; // 10% chance to change pulses
                        if (shouldChangePulses) {
                            const change = (Math.random() * 2) - 1; // randomize between -1 and 1
                            const tolerance = currentJob?.tolerance ?? 0.1; // default tolerance if not set
                            const min = expectedPulsesPerMinute * (1 - tolerance + 0.05);
                            const max = expectedPulsesPerMinute * (1 + tolerance - 0.05);
                            let newPulses = demoModeData.nozzles[i].pulsesPerMinute + change;
                            newPulses = Math.max(min, Math.min(max, newPulses));
                            demoModeData.nozzles[i].pulsesPerMinute = newPulses;
                        }

                    }
                }

                resolve({
                    nozzles: demoModeData.nozzles,
                    speed: demoModeData.speed,
                    coordinates: {
                        latitude: -21.122778,
                        longitude: -48.993056
                    }
                });

                const res: ESPData = {
                    nozzles: demoModeData.nozzles,
                    speed: demoModeData.speed,
                    coordinates: {
                        latitude: -21.122778,
                        longitude: -48.993056
                    }
                };
                this.dispatchEvent('onDataFetched', res);
                return;
            }

            if (!SettingsService.isConnectedToWifi()) {
                resolve({ nozzles: [], speed: 0, coordinates: { latitude: 0, longitude: 0 } } as ESPData)
                return;
            }

            const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            try {
                const response = await axios.get(`${ApiBaseUri}/data`, { timeout: 60000 });

                const shouldSimulateSpeed = SettingsService.getShouldSimulateSpeed();
                const simulatedSpeed = (SettingsService.getSimulatedSpeed()) / 3.6; // m/s → km/h

                const nozzles = await NozzlesService.getNozzles();
                const pulsesPerMinute = response.data.flowmetersPulsesPerMinute;
                const speed = shouldSimulateSpeed ? simulatedSpeed : response.data.speed;
                const latitude = response.data.latitude || -21.122778;
                const longitude = response.data.longitude || -48.993056;

                for (let i = 0; i < nozzles.length; i++) {
                    nozzles[i].pulsesPerMinute = pulsesPerMinute[i] || 0;
                }

                const res: ESPData = {
                    nozzles,
                    speed,
                    coordinates: { latitude, longitude }
                };

                this.dispatchEvent('onDataFetched', res);
                resolve(res);

            } catch (reason: any) {
                console.error('Erro de comunicação:', reason);

                // Example: send to renderer for non-blocking notification
                alert(`Ocorreu um erro de comunicação: ${reason.message || JSON.stringify(reason)} \n\nCaso o erro persista, entre em contato com o suporte.`);
                setTimeout(() => {
                    reject(reason);
                }, 3000);
            }
        });
    }

    public setInterval = async (value: number): Promise<void> => {
        const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
        try {
            await axios.post(`${ApiBaseUri}/set_refresh_rate`, { refresh_rate: value.toString() });
        } catch (reason: any) {
            console.error('Failed to set interval:', reason);
            throw reason;
        }
    };

    public getModuleMode = async (): Promise<number> => {
        const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
        try {
            const response = await axios.get(`${ApiBaseUri}/get_module_mode`);
            return response.data.mode;
        } catch (reason: any) {
            console.warn('Failed to get module mode, defaulting to 0', reason);
            return 0;
        }
    };

    public setModuleMode = async (value: number): Promise<void> => {
        const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
        try {
            await axios.post(`${ApiBaseUri}/set_module_mode`, { mode: value.toString() });
        } catch (reason: any) {
            console.error('Failed to set module mode:', reason);
            throw reason;
        }
    };

    public getSecondaryModulesCount = async (): Promise<number> => {
        const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
        try {
            const response = await axios.get(`${ApiBaseUri}/get_secondary_modules_count`);
            return response.data.count;
        } catch (reason: any) {
            console.warn('Failed to get secondary modules count, defaulting to 0', reason);
            return 0;
        }
    };

    public removeAllSecondaryModules = async (): Promise<void> => {
        const ApiBaseUri = SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
        try {
            await axios.post(`${ApiBaseUri}/remove_all_secondary_modules`);
        } catch (reason: any) {
            console.error('Failed to remove secondary modules:', reason);
            throw reason;
        }
    };

}