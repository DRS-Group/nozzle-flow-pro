import { Event } from './event.type';

export class NozzleEvent extends Event {
    _nozzleId: string;

    constructor(title: string, description: string, startDate: Date, endDate: Date | undefined, nozzleId: string, triggered: boolean) {
        super(title, description, startDate, endDate, triggered);
        this._nozzleId = nozzleId;
    }

    get nozzleId() {
        return this._nozzleId;
    }

    set nozzleId(nozzleId: string) {
        this._nozzleId = nozzleId;
    }

    get getModalMessage() {
        let message = ''
        if (this.title === 'Flow above expected') {
            message += `Nozzle ${this._nozzleId} flow is higher than expected!`;
        }
        else if (this.title === 'Flow below expected') {
            message += `Nozzle ${this._nozzleId} flow is lower than expected!`;
        }

        message += `\n\n Elapsed time: ${(this.duration / 1000).toFixed(3)} seconds.`;

        return message;
    }
}

export const generateFlowAboveExpectedNozzleEvent = (nozzleId: string): NozzleEvent => {
    return new NozzleEvent('Flow above expected', 'Nozzle flow is higher than expected', new Date(), undefined, nozzleId, false);
}

export const generateFlowBelowExpectedNozzleEvent = (nozzleId: string): NozzleEvent => {
    return new NozzleEvent('Flow below expected', 'Nozzle flow is lower than expected', new Date(), undefined, nozzleId, false);
}