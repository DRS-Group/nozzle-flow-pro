import { Nozzle } from "./nozzle.type";

export type ESPData = {
    speed: number;
    nozzles: Nozzle[];
    coordinates: {
        latitude: number;
        longitude: number;
    }
}