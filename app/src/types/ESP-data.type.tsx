import { Nozzle } from "./nozzle.type";

export type ESPData = {
    active: boolean;
    speed: number;
    nozzles: Nozzle[];
}