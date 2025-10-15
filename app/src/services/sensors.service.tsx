import { TranslationServices } from "./translations.service";
import { BaseService, IBaseService } from "./base-service.type";
import { ISensor } from "../types/sensor";
import { IFlowmeterSensor } from "../types/flowmeter-sensor";
import { IOpticalSensor } from "../types/optical-sensor";

type sensorsServiceEvents = '';

export interface ISensorsService extends IBaseService<sensorsServiceEvents> {
    getSensors: () => ISensor[];
    setSensors: (sensors: ISensor[]) => void;
    clearSensors: () => void;
    generateFlowmeterSensors: (count: number) => IFlowmeterSensor[];
    updateSensor: (sensor: ISensor, index: number) => void;
    updateFlowmeterSensor: (flowmeterSensor: IFlowmeterSensor, index: number) => void;
    updateOpticalSensor: (flowmeterSensor: IOpticalSensor, index: number) => void;
}

export class SensorsService extends BaseService<sensorsServiceEvents> implements ISensorsService {
    public getSensors(): ISensor[] {
        return window.electron.store.get('sensors') || [];
    }
    public setSensors(sensors: ISensor[]) {
        window.electron.store.set('sensors', sensors);
    }
    public clearSensors() {
        window.electron.store.set('sensors', []);
    }
    public addSensor(sensor: ISensor) {
        let sensors = this.getSensors();
        sensors.push(sensor);
        this.setSensors(sensors);
        return sensor;
    }

    public getFlowmeterSensors(): IFlowmeterSensor[] {
        let sensors = this.getSensors();
        return sensors.filter((s): s is IFlowmeterSensor => s.type === 'flowmeter');
    }
    public getOpticalSensors(): IOpticalSensor[] {
        let sensors = this.getSensors();
        return sensors.filter((s): s is IOpticalSensor => s.type === 'optical');
    }

    public generateFlowmeterSensors = (count: number): IFlowmeterSensor[] => {
        let sensors: IFlowmeterSensor[] = [];

        for (let i = 0; i < count; i++) {
            sensors.push({ name: `${TranslationServices.translate('Flowmeter', TranslationServices.getCurrentLanguage())} ${i + 1}`, type: 'flowmeter', pulsesPerLiter: 350, pulsesPerMinute: 0, ignored: false, lastPulseAge: 0 });
        }
        return sensors;
    }

    public updateSensor = (sensor: ISensor, index: number) => {
        let sensors = this.getSensors();
        sensors[index] = sensor;
        this.setSensors(sensors);
    }

    public updateFlowmeterSensor = (sensor: IFlowmeterSensor, index: number) => {
        let sensors = this.getSensors();
        const oldFlowmeterSensor = sensors.filter((sensor: ISensor) => sensor.type === 'flowmeter')[index];

        let flowmeterSensorGlobalIndex = sensors.indexOf(oldFlowmeterSensor);
        sensors[flowmeterSensorGlobalIndex] = sensor;
        this.setSensors(sensors);
    }

    public updateOpticalSensor = (sensor: IOpticalSensor, index: number) => {
        let sensors = this.getSensors();
        const oldOpticalSensor = sensors.filter((sensor: ISensor) => sensor.type === 'optical')[index];

        let flowmeterSensorGlobalIndex = sensors.indexOf(oldOpticalSensor);
        sensors[flowmeterSensorGlobalIndex] = sensor;
        this.setSensors(sensors);
    }
}
