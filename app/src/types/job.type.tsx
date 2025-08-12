import { NozzleEvent } from "./nozzle-event.type";

export type Job = {
    id: string;
    title: string;
    expectedFlow: number;
    tolerance: number;
    creationDate: Date;
    nozzleEvents: NozzleEvent[];
};