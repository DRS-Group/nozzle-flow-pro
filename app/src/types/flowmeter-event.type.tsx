import { IEvent } from './event.type';

export interface IFlowmeterEvent extends IEvent {
    sensorIndex: number;
    isFlowAboveExpected: boolean;
    isFlowBelowExpected: boolean;
};
