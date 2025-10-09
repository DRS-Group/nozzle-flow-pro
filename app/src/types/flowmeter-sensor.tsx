import { ISensor } from "./sensor";

export interface IFlowmeterSensor extends ISensor {
    type: 'flowmeter';
    pulsesPerLiter: number;
    pulsesPerMinute: number;
    pulseCount: number;
}