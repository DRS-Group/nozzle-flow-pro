import { services } from "../dependency-injection";
import { BaseService, IBaseService } from "./base-service.type";
import { ESPData } from "../types/ESP-data.type";
import { Job } from "../types/job.type";
import { CurrentJobService } from "./current-job.service";
import { IDataFecherService } from "./data-fetcher.service";
import { SettingsService } from "./settings.service";
import { ISensor } from "../types/sensor";
import { IFlowmeterSensor } from "../types/flowmeter-sensor";

export type PumpServiceEvents = 'onStateChanged' | 'onOverriddenStateChanged' | 'onIsStabilizedChanged';

export interface IPumpService extends IBaseService<PumpServiceEvents> {
    setState: (state: 'on' | 'off') => void;
    getState: () => 'on' | 'off';
    setOverriddenState: (state: 'on' | 'off' | 'auto') => void;
    getOverriddenState: () => 'on' | 'off' | 'auto';
    getRawState: () => 'on' | 'off';
    getIsStabilized: () => boolean;
}

export class PumpService extends BaseService<PumpServiceEvents> implements IPumpService {
    private readonly dataFetcherService: IDataFecherService = services.dataFetcherService;

    private isStabilized: boolean = true;
    private timeoutHandler: NodeJS.Timeout | null = null;
    private lastState: 'on' | 'off' = 'off';

    constructor() {
        super();

        this.addEventListener('onStateChanged', (newState: 'on' | 'off') => {
            if (newState === 'on' && !this.timeoutHandler) {
                this.isStabilized = false;
                this.dispatchEvent('onIsStabilizedChanged', this.getIsStabilized());
                this.timeoutHandler = setTimeout(() => {
                    this.isStabilized = true;
                    this.dispatchEvent('onIsStabilizedChanged', this.getIsStabilized());
                    this.timeoutHandler = null;
                }, (5000));
            }
            else {
                this.isStabilized = true;
                this.dispatchEvent('onIsStabilizedChanged', this.getIsStabilized());
                if (this.timeoutHandler) {
                    clearTimeout(this.timeoutHandler)
                    this.timeoutHandler = null;
                }
            }
        });

        this.dataFetcherService.addEventListener('onDataFetched', async (data: ESPData) => {
            const currentJob = await services.currentJobService.getCurrentJob();
            if (!currentJob) return;

            const expectedFlow = calculateTargetValue(currentJob, data.speed, currentJob.nozzleSpacing);
            const tolerance = currentJob.tolerance;
            const minimumExpectedFlow = expectedFlow * (1 - tolerance) * 0.5;
            const rawIsPumpActive = data.sensors.some((sensor: ISensor) => {
                if (sensor.type !== 'flowmeter') return false;
                const flowmeterSensor = sensor as IFlowmeterSensor;
                if (flowmeterSensor.ignored) return false;
                const litersPerMinute = flowmeterSensor.pulsesPerMinute / flowmeterSensor.pulsesPerLiter;
                return litersPerMinute > minimumExpectedFlow && !flowmeterSensor.ignored;
            });

            let isPumpActive = rawIsPumpActive;
            const overriddenState = this.getOverriddenState();
            if (overriddenState !== 'auto')
                isPumpActive = overriddenState === 'on';

            const state = isPumpActive ? 'on' : 'off';
            if (state !== this.getState()) {
                this.setState(state);
            }
        });
    }

    private state: 'on' | 'off' = 'off';
    private overriddenState: 'on' | 'off' | 'auto' = 'auto';

    public setState = (state: 'on' | 'off') => {
        this.state = state;
        this.dispatchEvent('onStateChanged', this.getState());
    }

    public getState = () => {
        if (this.overriddenState === 'auto') {
            return this.state;
        }
        return this.overriddenState;
    }

    public getRawState = () => {
        return this.state;
    }

    public setOverriddenState = (state: 'on' | 'off' | 'auto') => {
        this.overriddenState = state;
        this.dispatchEvent('onOverriddenStateChanged', this.getOverriddenState());
        this.dispatchEvent('onStateChanged', this.getState());
    }

    public getOverriddenState = () => {
        return this.overriddenState;
    }

    public getIsStabilized = () => {
        return this.isStabilized;
    }
}

const calculateTargetValue = (job: Job, speed: number, nozzleSpacing: number) => {
    const expectedFlow = job.expectedFlow;

    return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
};