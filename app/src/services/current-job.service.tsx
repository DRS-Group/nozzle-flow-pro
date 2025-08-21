import { services } from "../dependency-injection";
import { BaseService, IBaseService } from "../types/base-service.type";
import { ESPData } from "../types/ESP-data.type";
import { Job } from "../types/job.type";
import { NozzleEvent } from "../types/nozzle-event.type";
import { Nozzle } from "../types/nozzle.type";
import { IJobsService } from "./jobs.service";
import { SettingsService } from "./settings.service";
import { TranslationServices } from "./translations.service";

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
        console.log(this.currentJobId)
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

        const event = currentJob.nozzleEvents.find((event: NozzleEvent) => {
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

        currentJob.nozzleEvents.forEach((event: NozzleEvent) => {
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

            const ongoingEvents = currentJob.nozzleEvents.filter((event: NozzleEvent) => {
                return event.endTime === undefined;
            });

            ongoingEvents.forEach((event: NozzleEvent) => {
                event.endTime = new Date();
            });

            await this.jobsService.saveJob(currentJob);
            this.dispatchEvent('onCurrentJobChanged', currentJob.id);
            return;
        }

        const calculateTargetValue = (job: Job, speed: number, nozzleSpacing: number) => {
            const expectedFlow = job.expectedFlow;

            return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
        };

        const currentLanguage: 'pt-br' | 'en-us' = await SettingsService.getSettingOrDefault('language', 'en-us');

        let shouldSaveJob = false;

        const currentJob = await this.getCurrentJob();
        if (!currentJob) return;

        const nozzles = espData.nozzles;
        const speed = espData.speed;
        const timeBeforeAlert = await SettingsService.getTimeBeforeAlert();
        const nozzleSpacing = await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6);
        const expectedFlow = calculateTargetValue(currentJob, speed, nozzleSpacing);
        const maxExpectedFlow = expectedFlow * (1 + currentJob.tolerance);
        const minExpectedFlow = expectedFlow * (1 - currentJob.tolerance);

        for (let nozzleIndex = 0; nozzleIndex < nozzles.length; nozzleIndex++) {
            const nozzle: Nozzle = nozzles[nozzleIndex];

            if (nozzle.ignored) continue;

            const nozzleFlow = nozzle.pulsesPerMinute / nozzle.pulsesPerLiter;

            const isFlowAboveExpected = nozzleFlow > maxExpectedFlow;
            const isFlowBelowExpected = nozzleFlow < minExpectedFlow;
            const isFlowWithinExpected = !isFlowAboveExpected && !isFlowBelowExpected;

            const nozzleEvents: NozzleEvent[] = currentJob.nozzleEvents.filter((event: NozzleEvent) => {
                return event.nozzleIndex === nozzleIndex;
            });

            const nozzleOngoingEvent: NozzleEvent | undefined = nozzleEvents.find((event: NozzleEvent) => {
                return event.endTime === undefined;
            });


            if (nozzleOngoingEvent === undefined) {
                if (isFlowAboveExpected) {
                    const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${nozzle.name}</b> ${TranslationServices.translate('is above the expected value', currentLanguage)}`;

                    const newEvent: NozzleEvent = {
                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                        title: TranslationServices.translate('Flow above expected', currentLanguage),
                        description: description,
                        startTime: new Date(),
                        endTime: undefined,
                        nozzleIndex: nozzleIndex,
                        triggered: false,
                        viewed: false,
                        coordinates: {
                            latitude: espData.coordinates.latitude,
                            longitude: espData.coordinates.longitude
                        }
                    }
                    currentJob.nozzleEvents.push(newEvent);
                    shouldSaveJob = true;
                }
                else if (isFlowBelowExpected) {
                    const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${nozzle.name}</b> ${TranslationServices.translate('is below the expected value', currentLanguage)}`;

                    const newEvent: NozzleEvent = {
                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                        title: TranslationServices.translate('Flow below expected', currentLanguage),
                        description: description,
                        startTime: new Date(),
                        endTime: undefined,
                        nozzleIndex: nozzleIndex,
                        triggered: false,
                        viewed: false,
                        coordinates: {
                            latitude: espData.coordinates.latitude,
                            longitude: espData.coordinates.longitude
                        }
                    }
                    currentJob.nozzleEvents.push(newEvent);
                    shouldSaveJob = true
                }
            }
            else {
                const wasEventTriggered = nozzleOngoingEvent.triggered;
                const eventDuration = new Date().getTime() - nozzleOngoingEvent.startTime.getTime();
                const eventTitle = nozzleOngoingEvent.title;

                if (!wasEventTriggered && eventDuration > timeBeforeAlert) {
                    nozzleOngoingEvent.triggered = true;
                    shouldSaveJob = true;

                    this.dispatchEvent('onNozzleEventTriggered', nozzleOngoingEvent);
                }
                else if (isFlowWithinExpected) {
                    nozzleOngoingEvent.endTime = new Date();
                    nozzleOngoingEvent.viewed = true;
                    shouldSaveJob = true;
                }
                else if (isFlowAboveExpected && eventTitle === TranslationServices.translate('Flow below expected', currentLanguage)) {
                    nozzleOngoingEvent.endTime = new Date();
                    nozzleOngoingEvent.viewed = true;

                    const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${nozzle.name}</b> ${TranslationServices.translate('is above the expected value', currentLanguage)}`;

                    const newEvent = {
                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                        title: TranslationServices.translate('Flow above expected', currentLanguage),
                        description: description,
                        startTime: new Date(),
                        endTime: undefined,
                        nozzleIndex: nozzleIndex,
                        nozzle: nozzle,
                        triggered: false,
                        viewed: false,
                        coordinates: {
                            latitude: espData.coordinates.latitude,
                            longitude: espData.coordinates.longitude
                        }
                    }
                    currentJob.nozzleEvents.push(newEvent);
                    shouldSaveJob = true;
                }
                else if (isFlowBelowExpected && eventTitle === TranslationServices.translate('Flow above expected', currentLanguage)) {
                    nozzleOngoingEvent.endTime = new Date();
                    nozzleOngoingEvent.viewed = true;

                    const description = `${TranslationServices.translate('Flow of', currentLanguage)} <b>${nozzle.name}</b> ${TranslationServices.translate('is below the expected value', currentLanguage)}`;

                    const newEvent = {
                        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                        title: TranslationServices.translate('Flow below expected', currentLanguage),
                        description: description,
                        startTime: new Date(),
                        endTime: undefined,
                        nozzleIndex: nozzleIndex,
                        nozzle: nozzle,
                        triggered: false,
                        viewed: false,
                        coordinates: {
                            latitude: espData.coordinates.latitude,
                            longitude: espData.coordinates.longitude
                        }
                    }
                    currentJob.nozzleEvents.push(newEvent);
                    shouldSaveJob = true;
                }
            }
        }

        if (shouldSaveJob) {
            await this.jobsService.saveJob(currentJob);
            this.dispatchEvent('onCurrentJobChanged', currentJob.id);
        }
    }
}