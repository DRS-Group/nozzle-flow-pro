import { CapacitorHttp } from '@capacitor/core';
import { Nozzle } from '../models/nozzle.model';

export namespace DataFecherService {
    export const getNozzles = async (): Promise<Nozzle[]> => {
        return new Promise((resolve, reject) => {
            CapacitorHttp.get({ url: 'http://10.0.0.122:3000/sync', }).then((response) => {
                const nozzles: Nozzle[] = response.data.map((item: string) => {
                    return { id: item, flow: undefined } as Nozzle;
                });

                resolve(nozzles);
            });
        });
    }

    export const getData = async (): Promise<Nozzle[]> => {
        return new Promise((resolve, reject) => {
            CapacitorHttp.get({ url: 'http://10.0.0.122:3000/data', }).then((response) => {
                resolve(response.data);
            });
        });
    }
}