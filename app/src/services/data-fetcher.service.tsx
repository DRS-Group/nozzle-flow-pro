import { CapacitorHttp } from '@capacitor/core';
import { NozzlesService } from './nozzles.service';
import { SettingsService } from './settings.service';
import { ESPData } from '../types/ESP-data.type';
import { BaseService, IBaseService } from '../types/base-service.type';
import { CapacitorHttpPluginWeb, HttpResponse } from '@capacitor/core/types/core-plugins';
import { Nozzle } from '../types/nozzle.type';
import { services } from '../dependency-injection';

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
            const isDemoMode = await SettingsService.getSettingOrDefault('demoMode', false);

            if (isDemoMode) {
                const nozzles = await NozzlesService.getNozzles();
                const currentJob = await services.currentJobService.getCurrentJob();

                if (!currentJob) {
                    resolve({ nozzles: [], speed: 0 } as ESPData);
                    return;
                }

                if (demoModeData.speed === 0) {
                    demoModeData.speed = 2.5; // default speed in km/h
                }

                if (demoModeData.nozzles.length != nozzles.length) {
                    const expectedFlow = (demoModeData.speed * 3.6 * (await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6)) * 100 * currentJob?.expectedFlow) / 60000;
                    demoModeData.nozzles = nozzles.map((nozzle) => ({ ...nozzle, pulsesPerMinute: expectedFlow * nozzle.pulsesPerLiter }));
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
                        const expectedFlow = (demoModeData.speed * 3.6 * (await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6)) * 100 * currentJob?.expectedFlow) / 60000;
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
                    speed: demoModeData.speed
                });

                const res: ESPData = {
                    nozzles: demoModeData.nozzles,
                    speed: demoModeData.speed
                };
                this.dispatchEvent('onDataFetched', res);
                return;
            }

            if (!SettingsService.isConnectedToWifi()) {
                resolve({ nozzles: [], speed: 0 } as ESPData)
                return;
            }

            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp
                .get({ url: `${ApiBaseUri}/data`, connectTimeout: 60000 })
                .then(
                    async (response: HttpResponse) => {

                        const shouldSimulateSpeed = await SettingsService.getShouldSimulateSpeed();
                        const simulatedSpeed = (await SettingsService.getSimulatedSpeed()) / 3.6; // Convert from m/s to km/h

                        const nozzles = await NozzlesService.getNozzles();
                        const pulsesPerMinute = response.data.flowmetersPulsesPerMinute;
                        const speed = shouldSimulateSpeed ? simulatedSpeed : response.data.speed;

                        for (let i = 0; i < nozzles.length; i++) {
                            nozzles[i].pulsesPerMinute = pulsesPerMinute[i] || 0;
                        }

                        const res: ESPData = { nozzles: nozzles, speed: speed };

                        this.dispatchEvent('onDataFetched', res);

                        resolve(res);
                    },
                    (reason: any) => {
                        // if (reason && reason.code === 'SocketTimeoutException') {
                        //     alert('Timout');
                        //     reject(reason);
                        // }

                        // alert('||| Não foi possível conectar ao módulo central. Verifique a conexão e tente novamente.');
                        alert('Ocorreu um erro de comunicação: ' + JSON.stringify(reason) + '\n\nCaso o erro persista, entre em contato com o suporte.');
                        setTimeout(() => {
                            reject(reason);
                        }, 1000);
                    }
                )
                .catch((reason: any) => {
                    // alert('Não foi possível conectar ao módulo central. Verifique a conexão e tente novamente.');
                    alert(JSON.stringify(reason) + '\n\nCaso o erro persista, entre em contato com suporte.');
                    setTimeout(() => {
                        reject(reason);
                    }, 1000);
                });
        });
    }

    public setInterval = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/set_refresh_rate`,
                    params: { refresh_rate: value.toString() },
                }
            ).then(async (response) => {
                resolve();
            });
        });
    }

    public getModuleMode = async (): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp
                .get({ url: `${ApiBaseUri}/get_module_mode` }).then(async (response) => {
                    resolve(response.data.mode);
                })
                .catch((reason: any) => {
                    resolve(0);
                });;
        });
    }

    public setModuleMode = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/set_module_mode`,
                    params: { mode: value.toString() },
                }
            ).then(async (response) => {
                resolve();
            })
                .catch((reason: any) => {
                    console.error(reason);
                    reject(reason);
                });
        });
    }

    public getSecondaryModulesCount = async (): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp
                .get({ url: `${ApiBaseUri}/get_secondary_modules_count` }).then(async (response) => {
                    resolve(response.data.count);
                })
                .catch((reason: any) => {
                    resolve(0);
                });;
        });
    }

    public removeAllSecondaryModules = async (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/remove_all_secondary_modules`,
                }
            ).then(async (response) => {
                resolve();
            });
        });
    }

}