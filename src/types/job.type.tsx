import { NozzleEvent } from "./nozzle-event.type";

export type Job = {
    id: string;
    title: string;
    expectedFlow: number;
    tolerance: number;
    durationTolerance: number;
    creationDate: Date;
    nozzleEvents: NozzleEvent[];
};