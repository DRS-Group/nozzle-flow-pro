import { IEvent } from './event.type';

export interface IOpticalSensorEvent extends IEvent {
    sensorIndex: number;
};
