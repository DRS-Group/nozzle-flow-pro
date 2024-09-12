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
}

export const generateFlowAboveExpectedNozzleEvent = (nozzleId: string): NozzleEvent => {
    return new NozzleEvent('Flow above expected', 'Nozzle flow is higher than expected', new Date(), undefined, nozzleId, false);
}

export const generateFlowBelowExpectedNozzleEvent = (nozzleId: string): NozzleEvent => {
    return new NozzleEvent('Flow below expected', 'Nozzle flow is lower than expected', new Date(), undefined, nozzleId, false);
}