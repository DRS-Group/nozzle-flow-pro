import { CapacitorHttp } from '@capacitor/core';
import { Nozzle } from '../types/nozzle.type';
import { EventHandler } from '../types/event-handler';
import { NozzlesService } from './nozzles.service';
import { SettingsService } from './settings.service';

export namespace DataFecherService {
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

    export const fetchData = async (): Promise<Nozzle[]> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');
            CapacitorHttp.get({ url: `${ApiBaseUri}/data`, connectTimeout: 1000 }).then(async (response) => {

                const nozzles = await NozzlesService.getNozzles();
                const flows = response.data.flows;

                for (let i = 0; i < nozzles.length; i++) {
                    nozzles[i].flow = flows[i] || 0;
                }

                const res = { ...response.data, nozzles: nozzles, speed: 1 }

                dispatchEvent('onDataFetched', res);

                resolve(res);
            })
                .catch((reason: any) => {
                    reject(reason);
                    alert(reason);
                });
        });
    }

    export const calibrateAllNozzles = async (value: number): Promise<void> => {
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

    export const calibrateNozzle = async (nozzleIndex: number, value: number): Promise<void> => {
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
}