import { CapacitorHttp } from '@capacitor/core';
import { NozzlesService } from './nozzles.service';
import { SettingsService } from './settings.service';
import { ESPData } from '../types/ESP-data.type';
import { BaseService, IBaseService } from '../types/base-service.type';
import { Preferences } from '@capacitor/preferences';

export type DataFecherServiceEvents = 'onDataFetched';

export interface IDataFecherService extends IBaseService<DataFecherServiceEvents> {
    fetchData: () => Promise<ESPData>;
    setInterval: (value: number) => Promise<void>;
    getModuleMode: () => Promise<number>;
    setModuleMode: (value: number) => Promise<void>;
    getSecondaryModulesCount: () => Promise<number>;
    removeAllSecondaryModules: () => Promise<void>;

    setSimulatedSpeed: (value: number) => Promise<void>;
    setShouldSimulateSpeed: (value: boolean) => Promise<void>;
}

export class DataFecherService extends BaseService<DataFecherServiceEvents> implements IDataFecherService {
    simulatedSpeed = 0;
    shouldSimulateSpeed = false;

    public setSimulatedSpeed = async (value: number): Promise<void> => {
        this.simulatedSpeed = value;
    }

    public setShouldSimulateSpeed = async (value: boolean): Promise<void> => {
        this.shouldSimulateSpeed = value;
    }

    public fetchData = async (): Promise<ESPData> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
            CapacitorHttp
                .get({ url: `${ApiBaseUri}/data`, connectTimeout: 5000 })
                .then(async (response) => {
                    const nozzles = await NozzlesService.getNozzles();
                    const pulsesPerMinute = response.data.flowmetersPulsesPerMinute;
                    const speed = this.shouldSimulateSpeed ? this.simulatedSpeed : response.data.speed;

                    for (let i = 0; i < nozzles.length; i++) {
                        nozzles[i].pulsesPerMinute = pulsesPerMinute[i] || 0;
                    }

                    const res: ESPData = { nozzles: nozzles, speed: speed };

                    this.dispatchEvent('onDataFetched', res);

                    resolve(res);
                })
                .catch((reason: any) => {
                    alert(reason);
                    setTimeout(() => {
                        reject(reason);
                    }, 5000);
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