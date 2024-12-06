import { NozzlesService } from '../services/nozzles.service';
import { Event } from './event.type';
import { Nozzle } from './nozzle.type';

export type NozzleEvent = Event & {
    nozzleIndex: number;
};

// export class NozzleEvent extends Event {
//     nozzleIndex: number;
//     nozzle: Nozzle;

//     constructor(title: string, description: string, startDate: Date, endDate: Date | undefined, nozzleIndex: number, nozzle: Nozzle, triggered: boolean) {
//         super(title, description, startDate, endDate, triggered);
//         this.nozzleIndex = nozzleIndex;
//         this.nozzle = nozzle;
//     }

//     static async fromJson(json: string) {
//         const data = JSON.parse(json);
//         const nozzle = await NozzlesService.getNozzleByIndex(data.nozzleIndex);
//         let event = new NozzleEvent(data.title, data.description, new Date(data.startTime), data.endTime ? new Date(data.endTime) : undefined, data.nozzleIndex, nozzle, data.triggered);
//         event.id = data.id;
//         event.viewed = data.viewed;
//         event.triggered = data.triggered;

//         return event;
//     }


//     get getModalMessage() {
//         let message = ''
//         if (this.title === 'Flow above expected') {
//             message += `Nozzle ${this.nozzle.name} flow is higher than expected!`;
//         }
//         else if (this.title === 'Flow below expected') {
//             message += `Nozzle ${this.nozzle.name} flow is lower than expected!`;
//         }

//         message += `\n\n Elapsed time: ${(this.duration / 1000).toFixed(3)} seconds.`;

//         return message;
//     }
// }

// export const generateFlowAboveExpectedNozzleEvent = (nozzleIndex: number, nozzle: Nozzle): NozzleEvent => {
//     return new NozzleEvent('Flow above expected', 'Nozzle flow is higher than expected', new Date(), undefined, nozzleIndex, nozzle, false);
// }

// export const generateFlowBelowExpectedNozzleEvent = (nozzleIndex: number, nozzle: Nozzle): NozzleEvent => {
//     return new NozzleEvent('Flow below expected', 'Nozzle flow is lower than expected', new Date(), undefined, nozzleIndex, nozzle, false);
// }