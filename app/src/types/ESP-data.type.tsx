import { ISensor } from "./sensor";

export type ESPData = {
    speed: number;
    sensors: ISensor[];
    coordinates: {
        latitude: number;
        longitude: number;
    }
}