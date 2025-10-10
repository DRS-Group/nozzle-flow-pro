import { services } from "../dependency-injection";
import { BaseService, IBaseService } from "./base-service.type";
import { ESPData } from "../types/ESP-data.type";
import { Job } from "../types/job.type";
import { IFlowmeterEvent } from "../types/flowmeter-event.type";
import { IJobsService } from "./jobs.service";
import { SettingsService } from "./settings.service";
import { TranslationServices } from "./translations.service";
import { IFlowmeterSensor } from "../types/flowmeter-sensor";
import { IEvent } from "../types/event.type";
import { IOpticalSensor } from "../types/optical-sensor";
import { ISensor } from "../types/sensor";
import { IOpticalSensorEvent } from "../types/optical-sensor-event.type";

export type CurrentJobServiceEvents = 'onCurrentJobChanged' | 'onNozzleEventTriggered';

export interface ICurrentJobService extends IBaseService<CurrentJobServiceEvents> {
    setCurrentJob: (jobId: string | null) => void;
    getCurrentJob: () => Promise<Job | null>;
    markEventAsViewed: (eventId: string) => void;
    markAllEventsAsViewed: () => void;
}

export class CurrentJobService extends BaseService<CurrentJobServiceEvents> implements ICurrentJobService {
    private currentJobId: string | null = null;
    private jobsService: IJobsService;

    constructor() {
        super();
        this.jobsService = services.jobsService;

        this.loop();
    }

    refreshData = async (): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            services.dataFetcherService.fetchData()
                .then(async (espData) => {
                    await this.processNewData(espData);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    resolve();
                });
        });
    };

    loop = async () => {
        if (this.currentJobId === null) {
            setTimeout(() => {
                this.loop();
            }, 100);
            return;
        };

        const previousPage = services.navigationService.getPreviousPage();
        const currentPage = services.navigationService.getCurrentPage();
        if (previousPage === 'jobs' && currentPage !== 'createJob') {
            setTimeout(() => {
                this.loop();
            }, 100);

            return;
        };

        const refreshBegin = new Date();
        await this.refreshData();
        const refreshEnd = new Date();
        const refreshDuration = refreshEnd.getTime() - refreshBegin.getTime();
        const nextTimeout = 250 - refreshDuration;

        setTimeout(() => {
            this.loop();
        }, nextTimeout);
    };

    setCurrentJob = (jobId: string | null) => {
        this.currentJobId = jobId;
        this.dispatchEvent('onCurrentJobChanged', jobId);
    };

    getCurrentJob = async () => {
        if (!this.currentJobId) return null;
        return await this.jobsService.getJobById(this.currentJobId);
    };

    markEventAsViewed = async (eventId: string) => {
        const currentJob = await this.getCurrentJob();
        if (!currentJob) return;

        const event = currentJob.events.find((event: IEvent) => {
            return event.id === eventId;
        });

        if (!event) return;

        event.viewed = true;
        await this.jobsService.saveJob(currentJob);
        this.dispatchEvent('onCurrentJobChanged', currentJob.id);
    }

    markAllEventsAsViewed = async () => {
        const currentJob = await this.getCurrentJob();
        if (!currentJob) return;

        currentJob.events.forEach((event: IEvent) => {
            event.viewed = true;
        });

        await this.jobsService.saveJob(currentJob);
        this.dispatchEvent('onCurrentJobChanged', currentJob.id);
    }

    private processNewData = async (espData: ESPData) => {
        const isPumpStabilized = services.pumpService.getIsStabilized();

        if (!isPumpStabilized) return;

        const isPumpActive = services.pumpService.getState() === 'on';

        if (!isPumpActive) {
            const currentJob = await this.getCurrentJob();
            if (!currentJob) return;

            const ongoingEvents = currentJob.events.filter((event: IEvent) => {
                return event.endTime === undefined;
            });

            ongoingEvents.forEach((event: IEvent) => {
                event.endTime = new Date();
                event.viewed = true;
            });

            await this.jobsService.saveJob(currentJob);
            this.dispatchEvent('onCurrentJobChanged', currentJob.id);
            return;
        }

        const calculateTargetValue = (job: Job, speed: number, nozzleSpacing: number) => {
            const expectedFlow = job.expectedFlow;

            return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
        };

        const currentLanguage: 'pt-br' | 'en-us' = SettingsService.getSettingOrDefault('language', 'en-us');

        let shouldSaveJob = false;

        const currentJob = await this.getCurrentJob();
        if (!currentJob) return;

        const sensors: ISensor[] = espData.sensors;
        const speed = espData.speed;
        const timeBeforeAlert = SettingsService.getTimeBeforeAlert();
        const nozzleSpacing = currentJob.nozzleSpacing;
        const expectedFlow = calculateTargetValue(currentJob, speed, nozzleSpacing);
        const maxExpectedFlow = expectedFlow * (1 + currentJob.tolerance);
        const minExpectedFlow = expectedFlow * (1 - currentJob.tolerance);

        for (let sensorIndex = 0; sensorIndex < sensors.length; sensorIndex++) {
            const sensor: ISensor = sensors[sensorIndex];

            if (sensor.ignored) continue;

            if (sensor.type === 'flowmeter') {
                const flowmeterSensor = sensor as IFlowmeterSensor;

                const flowmeterFlow = flowmeterSensor.pulsesPerMinute / flowmeterSensor.pulsesPerLiter;

                const isFlowAboveExpected = flowmeterFlow > maxExpectedFlow;
                const isFlowBelowExpected = flowmeterFlow < minExpectedFlow;
                const isFlowWithinExpected = !isFlowAboveExpected && !isFlowBelowExpected;

                const flowmeterSensorEvents: IFlowmeterEvent[] = currentJob.events.filter((event: IEvent): event is IFlowmeterEvent => {
                    if (event.type !== 'flowmeterSensor') return false;

                    return (event as IFlowmeterEvent).sensorIndex === sensorIndex;
                });

                const flowmeterOngoingEvent: IFlowmeterEvent | undefined = flowmeterSensorEvents.find((event: IFlowmeterEvent) => {
                    return event.endTime === undefined;
                });

                if (flowmeterOngoingEvent === undefined) {
                    if (isFlowAboveExpected) {
                        const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${flowmeterSensor.name}</b> ${TranslationServices.translate('is above the expected value', currentLanguage)}`;

                        const newEvent: IFlowmeterEvent = {
                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            title: TranslationServices.translate('Flow above expected', currentLanguage),
                            description: description,
                            startTime: new Date(),
                            endTime: undefined,
                            sensorIndex: sensorIndex,
                            triggered: false,
                            viewed: false,
                            coordinates: {
                                latitude: espData.coordinates.latitude,
                                longitude: espData.coordinates.longitude
                            },
                            isFlowAboveExpected: true,
                            isFlowBelowExpected: false,
                            type: 'flowmeterSensor'
                        }
                        currentJob.events.push(newEvent);
                        shouldSaveJob = true;
                    }
                    else if (isFlowBelowExpected) {
                        const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${flowmeterSensor.name}</b> ${TranslationServices.translate('is below the expected value', currentLanguage)}`;

                        const newEvent: IFlowmeterEvent = {
                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            title: TranslationServices.translate('Flow below expected', currentLanguage),
                            description: description,
                            startTime: new Date(),
                            endTime: undefined,
                            sensorIndex: sensorIndex,
                            triggered: false,
                            viewed: false,
                            coordinates: {
                                latitude: espData.coordinates.latitude,
                                longitude: espData.coordinates.longitude
                            },
                            isFlowAboveExpected: false,
                            isFlowBelowExpected: true,
                            type: 'flowmeterSensor'
                        }
                        currentJob.events.push(newEvent);
                        shouldSaveJob = true
                    }
                }
                else {
                    const wasEventTriggered = flowmeterOngoingEvent.triggered;
                    const eventDuration = new Date().getTime() - flowmeterOngoingEvent.startTime.getTime();
                    const eventTitle = flowmeterOngoingEvent.title;

                    if (!wasEventTriggered && eventDuration > timeBeforeAlert) {
                        flowmeterOngoingEvent.triggered = true;
                        shouldSaveJob = true;

                        this.dispatchEvent('onNozzleEventTriggered', flowmeterOngoingEvent);
                    }
                    else if (isFlowWithinExpected) {
                        flowmeterOngoingEvent.endTime = new Date();
                        flowmeterOngoingEvent.viewed = true;
                        shouldSaveJob = true;
                    }
                    else if (isFlowAboveExpected && eventTitle === TranslationServices.translate('Flow below expected', currentLanguage)) {
                        flowmeterOngoingEvent.endTime = new Date();
                        flowmeterOngoingEvent.viewed = true;

                        const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${flowmeterSensor.name}</b> ${TranslationServices.translate('is above the expected value', currentLanguage)}`;

                        const newEvent: IFlowmeterEvent = {
                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            title: TranslationServices.translate('Flow above expected', currentLanguage),
                            description: description,
                            startTime: new Date(),
                            endTime: undefined,
                            sensorIndex: sensorIndex,
                            triggered: false,
                            viewed: false,
                            coordinates: {
                                latitude: espData.coordinates.latitude,
                                longitude: espData.coordinates.longitude
                            },
                            isFlowAboveExpected: true,
                            isFlowBelowExpected: false,
                            type: 'flowmeterSensor'
                        }
                        currentJob.events.push(newEvent);
                        shouldSaveJob = true;
                    }
                    else if (isFlowBelowExpected && eventTitle === TranslationServices.translate('Flow above expected', currentLanguage)) {
                        flowmeterOngoingEvent.endTime = new Date();
                        flowmeterOngoingEvent.viewed = true;

                        const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${flowmeterSensor.name}</b> ${TranslationServices.translate('is below the expected value', currentLanguage)}`;

                        const newEvent: IFlowmeterEvent = {
                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            title: TranslationServices.translate('Flow below expected', currentLanguage),
                            description: description,
                            startTime: new Date(),
                            endTime: undefined,
                            sensorIndex: sensorIndex,
                            triggered: false,
                            viewed: false,
                            coordinates: {
                                latitude: espData.coordinates.latitude,
                                longitude: espData.coordinates.longitude
                            },
                            isFlowAboveExpected: false,
                            isFlowBelowExpected: true,
                            type: 'flowmeterSensor'
                        }
                        currentJob.events.push(newEvent);
                        shouldSaveJob = true;
                    }
                }
            }
            else if (sensor.type === 'optical') {
                const opticalSensor = sensor as IOpticalSensor;

                const opticalSensorEvents: IOpticalSensorEvent[] = currentJob.events.filter((event: IEvent): event is IOpticalSensorEvent => {
                    if (event.type !== 'opticalSensor') return false;
                    return (event as IOpticalSensorEvent).sensorIndex === sensorIndex;
                });

                const opticalSensorOngoingEvent: IOpticalSensorEvent | undefined = opticalSensorEvents.find((event: IOpticalSensorEvent) => {
                    return event.endTime === undefined;
                });

                if (opticalSensorOngoingEvent === undefined) {
                    if (opticalSensor.lastPulseAge >= timeBeforeAlert * 2) {
                        const description = `<b>${opticalSensor.name}</b> ${TranslationServices.translate('detected a failure', currentLanguage)}`;
                        const newEvent: IOpticalSensorEvent = {
                            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                            title: TranslationServices.translate('Optical sensor alert', currentLanguage),
                            description: description,
                            startTime: new Date(),
                            endTime: undefined,
                            sensorIndex: sensorIndex,
                            triggered: true,
                            viewed: false,
                            coordinates: {
                                latitude: espData.coordinates.latitude,
                                longitude: espData.coordinates.longitude
                            },
                            type: 'opticalSensor'
                        };
                        currentJob.events.push(newEvent);
                        shouldSaveJob = true;
                    }
                }
                else {
                    if (opticalSensor.lastPulseAge < timeBeforeAlert * 2) {
                        opticalSensorOngoingEvent.endTime = new Date();
                        opticalSensorOngoingEvent.viewed = true;
                        shouldSaveJob = true;
                    }
                }
            }
        }

        if (shouldSaveJob) {
            await this.jobsService.saveJob(currentJob);
            this.dispatchEvent('onCurrentJobChanged', currentJob.id);
        }
    }
}