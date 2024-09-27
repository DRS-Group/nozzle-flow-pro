import { NozzleEvent } from "./nozzle-event.type";

export class Job {
    title: string;
    expectedFlow: number;
    tolerance: number;
    durationTolerance: number;

    creationDate: Date = new Date();
    id: string;

    nozzleEvents: NozzleEvent[] = [];

    constructor(title: string, expectedFlow: number, tolerance: number, durationTolerance: number) {
        this.title = title;
        this.expectedFlow = expectedFlow;
        this.tolerance = tolerance;
        this.durationTolerance = durationTolerance;
        
        this.creationDate = new Date();

        // set id as random string based on now time
        this.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    addNozzleEvent(nozzleEvent: NozzleEvent) {
        this.nozzleEvents.push(nozzleEvent);
    }
}