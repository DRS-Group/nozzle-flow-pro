import { CapacitorHttp } from '@capacitor/core';
import { NozzlesService } from './nozzles.service';
import { SettingsService } from './settings.service';
import { ESPData } from '../types/ESP-data.type';
import { BaseService, IBaseService } from '../types/base-service.type';

export type DataFecherServiceEvents = 'onDataFetched';

export interface IDataFecherService extends IBaseService<DataFecherServiceEvents> {
    fetchData: () => Promise<ESPData>;
    calibrateAllNozzles: (value: number) => Promise<void>;
    calibrateNozzle: (nozzleIndex: number, value: number) => Promise<void>;
    setInterval: (value: number) => Promise<void>;
}

export class DataFecherService extends BaseService<DataFecherServiceEvents> implements IDataFecherService {
    public fetchData = async (): Promise<ESPData> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
            CapacitorHttp.get({ url: `${ApiBaseUri}/data`, connectTimeout: 5000 }).then(async (response) => {
                const nozzles = await NozzlesService.getNozzles();
                const flows = response.data.flows;
                const active = response.data.active;
                const speed = response.data.speed;

                for (let i = 0; i < nozzles.length; i++) {
                    nozzles[i].flow = flows[i] || 0;
                }

                const res: ESPData = { active: active, nozzles: nozzles, speed: speed };

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

    public calibrateAllNozzles = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/calibrateAll`,
                    params: { pulsesPerLiter: value.toString() },
                }

            ).then(async (response) => {
                resolve();
            });
        });
    }

    public calibrateNozzle = async (nozzleIndex: number, value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/calibrate`,
                    params: {
                        pulsesPerLiter: value.toString(),
                        nozzleIndex: nozzleIndex.toString(),
                    },
                }
            ).then(async (response) => {
                resolve();
            });
        });
    }

    public setInterval = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post(
                {
                    url: `${ApiBaseUri}/interval`,
                    params: { interval: value.toString() },
                }
            ).then(async (response) => {
                resolve();
            });
        });
    }
}