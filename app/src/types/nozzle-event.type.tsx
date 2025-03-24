import { Event } from './event.type';

export type NozzleEvent = Event & {
    nozzleIndex: number;
};
