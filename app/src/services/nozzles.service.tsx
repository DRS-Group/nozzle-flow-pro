import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";
import { Nozzle } from "../types/nozzle.type";
import { SettingsService } from "./settings.service";
import { DataFecherService } from "./data-fetcher.service";
import { EventHandler } from "../types/event-handler";
import { count } from "console";
import { TranslationServices } from "./translations.service";

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

    export const removeNozzle = async (index: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            nozzles = nozzles.filter((n, i) => i !== index);

            setNozzles(nozzles).then(() => {
                resolve();
            });
        });
    }

    export const updateNozzle = async (nozzle: Nozzle, index: number): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            nozzles[index] = nozzle;

            setNozzles(nozzles).then(() => {
                resolve();
            });
        });
    }

    export const getNozzleByIndex = async (index: number): Promise<Nozzle> => {
        return new Promise(async (resolve, reject) => {
            let nozzles = await getNozzles();

            resolve(nozzles[index]);
        });
    }

    export const clearNozzles = async (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            setNozzles([]).then(() => {
                resolve();
            });
        });
    }

    export const generateNozzles = async (count: number): Promise<Nozzle[]> => {
        return new Promise(async (resolve, reject) => {
            let nozzles: Nozzle[] = [];

            for (let i = 0; i < count; i++) {
                console.log(`${TranslationServices.translate('Nozzle', await TranslationServices.getCurrentLanguage())} ${i + 1}`);
                nozzles.push({ name: `${TranslationServices.translate('Nozzle', await TranslationServices.getCurrentLanguage())} ${i + 1}`, pulsesPerMinute: 0, pulsesPerLiter: 350 });
            }

            setNozzles(nozzles).then(() => {
                resolve(nozzles);
            });
        });
    }
}