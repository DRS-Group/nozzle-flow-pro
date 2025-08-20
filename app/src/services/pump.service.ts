import { services } from "../dependency-injection";
import { BaseService, IBaseService } from "../types/base-service.type";
import { ESPData } from "../types/ESP-data.type";
import { Nozzle } from "../types/nozzle.type";
import { CurrentJobService } from "./current-job.service";
import { IDataFecherService } from "./data-fetcher.service";
import { SettingsService } from "./settings.service";

export type PumpServiceEvents = 'onStateChanged' | 'onOverriddenStateChanged';

export interface IPumpService extends IBaseService<PumpServiceEvents> {
    setState: (state: 'on' | 'off') => void;
    getState: () => 'on' | 'off';
    setOverriddenState: (state: 'on' | 'off' | 'auto') => void;
    getOverriddenState: () => 'on' | 'off' | 'auto';
    getRawState: () => 'on' | 'off';
}

export class PumpService extends BaseService<PumpServiceEvents> implements IPumpService {
    private readonly dataFetcherService: IDataFecherService = services.dataFetcherService;

    constructor() {
        super();
        this.dataFetcherService.addEventListener('onDataFetched', async (data: ESPData) => {
            const currentJob = await services.currentJobService.getCurrentJob();
            if (currentJob) {
                const expectedFlow = currentJob.expectedFlow;
                const tolerance = currentJob.tolerance;
                const minimumExpectedFlow = expectedFlow * (1 - tolerance) * 0.5;
                const isPumpActive = data.nozzles.some((nozzle: Nozzle) => {
                    const litersPerMinute = nozzle.pulsesPerMinute / nozzle.pulsesPerLiter;
                    return litersPerMinute > minimumExpectedFlow && !nozzle.ignored;
                });

                const state = isPumpActive ? 'on' : 'off';
                if (state !== this.getState()) {
                    this.setState(state);
                }
            }
            else {
                const isPumpActive = data.nozzles.find((nozzle: Nozzle) => nozzle.pulsesPerMinute > 10 && !nozzle.ignored);
                const state = isPumpActive ? 'on' : 'off';
                if (state !== this.getState()) {
                    this.setState(state);
                }
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

}