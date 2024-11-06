import { NozzleEvent } from "./nozzle-event.type";

export type Job = {
    title: string;
    expectedFlow: number;
    tolerance: number;
    durationTolerance: number;
    creationDate: Date;
    id: string;
    nozzleEvents: NozzleEvent[];
}

// export class Job {
//     title: string;
//     expectedFlow: number;
//     tolerance: number;
//     durationTolerance: number;

//     creationDate: Date = new Date();
//     id: string;

//     nozzleEvents: NozzleEvent[] = [];

//     constructor(title: string, expectedFlow: number, tolerance: number, durationTolerance: number) {
//         this.title = title;
//         this.expectedFlow = expectedFlow;
//         this.tolerance = tolerance;
//         this.durationTolerance = durationTolerance;

//         this.creationDate = new Date();

//         // set id as random string based on now time
//         this.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//     }

//     static fromJson(json: string) {
//         const data = JSON.parse(json);
//         let job = new Job(data.title, data.expectedFlow, data.tolerance, data.durationTolerance);
//         job.id = data.id;
//         job.creationDate = new Date(data.creationDate);
//         job.nozzleEvents = data.nozzleEvents.map((event: any) => NozzleEvent.fromJson(JSON.stringify(event)));
//     }

//     public addNozzleEvent(nozzleEvent: NozzleEvent) {
//         this.nozzleEvents.push(nozzleEvent);
//     }

//     public getUnviewedTriggeredEvents() {
//         return this.nozzleEvents.filter(event => event.triggered && !event.viewed);
//     }
// }