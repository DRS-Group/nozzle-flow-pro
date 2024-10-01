import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";
import { Nozzle } from "../types/nozzle.type";
import { SettingsService } from "./settings.service";
import { DataFecherService } from "./data-fetcher.service";
import { EventHandler } from "../types/event-handler";

export namespace NozzlesService {
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

    export const getNozzles = async (): Promise<Nozzle[]> => {
        return new Promise((resolve, reject) => {
            Preferences.get({ key: 'nozzles' }).then((result) => {
                let nozzles = JSON.parse(result.value || '[]') as Nozzle[];
                resolve(nozzles);
            });
        });
    }

    export const getActiveNozzles = async (): Promise<Nozzle[]> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = (await getNozzles()).filter(nozzle => nozzle.index >= 0).sort((a, b) => a.index - b.index);

            resolve(nozzles);
        });
    }

    export const setNozzles = async (nozzles: Nozzle[]): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            Preferences.set({ key: 'nozzles', value: JSON.stringify(nozzles) }).then(() => {
                resolve();
            });
        });
    }

    export const addNozzle = async (nozzle: Nozzle): Promise<Nozzle> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            nozzles.push(nozzle);

            setNozzles(nozzles).then(() => {
                resolve(nozzle);
            });
        });
    }

    export const removeNozzle = async (nozzle: Nozzle): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            nozzles = nozzles.filter(n => n.id !== nozzle.id);

            setNozzles(nozzles).then(() => {
                resolve();
            });
        });
    }

    export const removeNozzleById = async (id: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            nozzles = nozzles.filter(n => n.id !== id);

            setNozzles(nozzles).then(() => {
                resolve();
            });
        });
    }

    export const updateNozzle = async (nozzle: Nozzle): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            let index = nozzles.findIndex(n => n.id === nozzle.id);

            nozzles[index] = nozzle;

            setNozzles(nozzles).then(() => {
                resolve();
            });
        });
    }

    export const getNozzleById = async (id: string): Promise<Nozzle | null> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            let nozzle = nozzles.find(n => n.id === id);

            resolve(nozzle || null);
        });
    }
}