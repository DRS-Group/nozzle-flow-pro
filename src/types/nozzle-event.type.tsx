import { NozzlesService } from '../services/nozzles.service';
import { Event } from './event.type';
import { Nozzle } from './nozzle.type';

export class NozzleEvent extends Event {
    _nozzleIndex: number;
    _nozzle: Nozzle;

    constructor(title: string, description: string, startDate: Date, endDate: Date | undefined, nozzleIndex: number, nozzle: Nozzle, triggered: boolean) {
        super(title, description, startDate, endDate, triggered);
        this._nozzleIndex = nozzleIndex;
        this._nozzle = nozzle;
    }

    get nozzleIndex(): number {
        return this._nozzleIndex;
    }

    set nozzleIndex(nozzleIndex: number) {
        this._nozzleIndex = nozzleIndex;
    }

    get nozzle(): Nozzle {
        return this._nozzle;
    }

    set nozzle(nozzle: Nozzle) {
        this._nozzle = nozzle;
    }

    get getModalMessage() {
        let message = ''
        if (this.title === 'Flow above expected') {
            message += `Nozzle ${this._nozzle.name} flow is higher than expected!`;
        }
        else if (this.title === 'Flow below expected') {
            message += `Nozzle ${this._nozzle.name} flow is lower than expected!`;
        }

        message += `\n\n Elapsed time: ${(this.duration / 1000).toFixed(3)} seconds.`;

        return message;
    }
}

export const generateFlowAboveExpectedNozzleEvent = (nozzleIndex: number, nozzle: Nozzle): NozzleEvent => {
    return new NozzleEvent('Flow above expected', 'Nozzle flow is higher than expected', new Date(), undefined, nozzleIndex, nozzle, false);
}

export const generateFlowBelowExpectedNozzleEvent = (nozzleIndex: number, nozzle: Nozzle): NozzleEvent => {
    return new NozzleEvent('Flow below expected', 'Nozzle flow is lower than expected', new Date(), undefined, nozzleIndex, nozzle, false);
}