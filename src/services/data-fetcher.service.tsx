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

    export const syncNozzles = async (): Promise<Nozzle[]> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.get({ url: `${ApiBaseUri}/sync`, }).then(async (response) => {
                const fetchedNozzles: Nozzle[] = response.data.map((item: string) => {
                    return { id: item, name: item } as Nozzle;
                });

                let nozzles: Nozzle[] = await NozzlesService.getNozzles();

                const newNozzles = fetchedNozzles.filter(fetchedNozzle => {
                    return nozzles.findIndex(n => n.id === fetchedNozzle.id) === -1;
                }).map(nozzle => {
                    return { ...nozzle, pulsesPerLiter: 350 };
                });

                nozzles.push(...newNozzles);

                for (let i = 0; i < nozzles.length; i++) {
                    const fetchedNozzleIndex = fetchedNozzles.findIndex(n => n.id === nozzles[i].id);

                    nozzles[i].index = fetchedNozzleIndex;
                }

                await NozzlesService.setNozzles(nozzles);

                dispatchEvent('onNozzlesSynced', nozzles);

                resolve(nozzles);
            });
        });
    }

    export const fetchData = async (): Promise<Nozzle[]> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.get({ url: `${ApiBaseUri}/data`, }).then(async (response) => {

                const oldNozzles = await NozzlesService.getActiveNozzles();
                const newNozzles = response.data.nozzles;

                for (let oldNozzleIndex = 0; oldNozzleIndex < oldNozzles.length; oldNozzleIndex++) {
                    const oldNozzle = oldNozzles[oldNozzleIndex];
                    const newNozzle = newNozzles.find((nozzle: Nozzle) => nozzle.id === oldNozzle.id);

                    if (newNozzle) {
                        oldNozzles[oldNozzleIndex].flow = newNozzle.flow;
                    }
                }

                const res = { ...response.data, nozzles: oldNozzles }

                dispatchEvent('onDataFetched', res);

                resolve(res);
            });
        });
    }

    export const calibrateAllNozzles = async (value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post({ url: `${ApiBaseUri}/calibrate`, data: JSON.stringify({ value: value }), headers: { "Content-Type": 'application/json' } }).then(async (response) => {
                resolve();
            });
        });
    }

    export const calibrateNozzle = async (nozzleId: string, value: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const ApiBaseUri = await SettingsService.getSettingOrDefault('apiBaseUrl', 'http://localhost:3000');

            CapacitorHttp.post({ url: `${ApiBaseUri}/calibrate/${nozzleId}`, data: JSON.stringify({ value: value }), headers: { "Content-Type": 'application/json' } }).then(async (response) => {
                resolve();
            });
        });
    }
}