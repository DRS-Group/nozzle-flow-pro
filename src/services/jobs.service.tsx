import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";
import { BaseService } from "../types/base-service.type";
import { generateFlowAboveExpectedNozzleEvent, generateFlowBelowExpectedNozzleEvent, NozzleEvent } from "../types/nozzle-event.type";
import { ESPData } from "../types/ESP-data.type";
import { SettingsService } from "./settings.service";
import { DataFecherService } from "./data-fetcher.service";
import { NavigationService } from "./navigation.service";
import { JobRepository } from "../repositories/job.repository";

export abstract class JobsService extends BaseService {
    private static currentJob: Job | null = null;

    public static getCurrentJob = (): Job | null => {
        return this.currentJob;
    }

    public static setCurrentJob = async (jobId: string | null) => {
        if (jobId === null) {
            this.currentJob = null;
            this.dispatchEvent('onCurrentJobChanged', null);
            return;
        }

        this.currentJob = await this.getJobById(jobId);
        this.dispatchEvent('onCurrentJobChanged', this.currentJob);
    }

    public static saveJob = async (job: Job): Promise<Job> => {
        const savedJob = await JobRepository.save(job);
        if (savedJob.id === this.currentJob?.id) {
            await this.setCurrentJob(savedJob.id);
        }
        return savedJob;
    }

    public static removeJob = async (jobId: string): Promise<void> => {
        if (this.currentJob?.id === jobId) {
            await this.setCurrentJob(null);
        }

        await JobRepository.delete(jobId);

        this.dispatchEvent('onJobsChanged', await this.getJobs());
    }

    public static updateCurrentJobNozzleEvents = (espData: ESPData): Promise<void> => {
        const calculateTargetValue = (job: Job, speed: number, nozzleSpacing: number) => {
            // Nozzle expected flow in liters per second;
            const expectedFlow = job.expectedFlow;

            return (speed * nozzleSpacing * expectedFlow) / 1;
        }

        return new Promise(async (resolve, reject) => {
            const currentJob = this.getCurrentJob();
            const nozzles = espData.nozzles;
            const active = espData.active;
            const speed = espData.speed;
            const nozzleSpacing = await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6);

            if (currentJob === null) {
                reject('There is no current job');
                return;
            };

            if (!nozzles) {
                reject('Nozzles are not defined');
                return;
            }

            let eventsToAdd: NozzleEvent[] = [];
            let eventsToModify: NozzleEvent[] = [];

            for (let nozzleIndex = 0; nozzleIndex < nozzles.length; nozzleIndex++) {
                const nozzle = nozzles[nozzleIndex];

                const nozzleEvents: NozzleEvent[] = currentJob.nozzleEvents.filter((event: NozzleEvent) => {
                    return event.nozzleIndex === nozzleIndex;
                });

                const nozzle_ongoing_events = nozzleEvents.filter((event) => {
                    return event.endTime === undefined;
                });

                // TODO: Calculate expected flow
                const expectedFlow = calculateTargetValue(currentJob, speed, nozzleSpacing) || 0;

                const isNozzleFlowAboveExpected = nozzle.flow !== null && nozzle.flow > expectedFlow * (1 + currentJob.tolerance);
                const isNozzleFlowBelowExpected = nozzle.flow !== null && nozzle.flow < expectedFlow * (1 - currentJob.tolerance);
                const doesNozzleHaveOngoingEvent = nozzle_ongoing_events.length > 0;

                if (!doesNozzleHaveOngoingEvent) {
                    if (isNozzleFlowAboveExpected) {
                        const newEvent = generateFlowAboveExpectedNozzleEvent(nozzleIndex, nozzle);
                        eventsToAdd.push(newEvent);
                    }
                    else if (isNozzleFlowBelowExpected) {
                        const newEvent = generateFlowBelowExpectedNozzleEvent(nozzleIndex, nozzle);
                        eventsToAdd.push(newEvent);
                    }
                    else {
                        continue;
                    }
                }
                else {
                    for (let nozzleOngoingEvent of nozzle_ongoing_events) {
                        const wasEventTriggered = nozzleOngoingEvent.triggered;
                        const eventDuration = nozzleOngoingEvent.duration;
                        const eventTitle = nozzleOngoingEvent.title;

                        if (!wasEventTriggered) {
                            if (eventDuration > currentJob!.durationTolerance) {
                                nozzleOngoingEvent.triggered = true;
                                eventsToModify.push(nozzleOngoingEvent);

                                this.dispatchEvent('onNozzleEventTriggered', nozzleOngoingEvent);
                            }
                        }

                        if (isNozzleFlowAboveExpected) {
                            if (eventTitle === 'Flow below expected') {
                                nozzleOngoingEvent.endTime = new Date();
                                eventsToModify.push(nozzleOngoingEvent);

                                const newEvent = generateFlowAboveExpectedNozzleEvent(nozzleIndex, nozzle);
                                eventsToAdd.push(newEvent);
                            }
                        }
                        else if (isNozzleFlowBelowExpected) {
                            if (eventTitle === 'Flow above expected') {
                                nozzleOngoingEvent.endTime = new Date();
                                eventsToModify.push(nozzleOngoingEvent);

                                const newEvent = generateFlowBelowExpectedNozzleEvent(nozzleIndex, nozzle);
                                eventsToAdd.push(newEvent);
                            }
                        }
                        else {
                            nozzleOngoingEvent.endTime = new Date();
                            eventsToModify.push(nozzleOngoingEvent);
                        }
                    }
                }

                let newEvents = [...currentJob?.nozzleEvents];

                for (let event of eventsToAdd) {
                    newEvents.push(event);
                }

                for (let event of eventsToModify) {
                    const eventIndex = newEvents.findIndex((e) => e.id === event.id);
                    newEvents[eventIndex] = event;
                }

                if (eventsToAdd.length > 0 || eventsToModify.length > 0) {
                    currentJob.nozzleEvents = newEvents;
                    this.currentJob = currentJob;
                    this.dispatchEvent('onCurrentJobNozzleEventsUpdated', currentJob);
                }

                resolve();
            }
        });
    }

    public static getJobById = async (jobId: string): Promise<Job | null> => {
        const jobs = await JobRepository.get();
        const job = jobs.find((job) => job.id === jobId) ?? null;
        return job;
    }

    public static getJobs = async (): Promise<Job[]> => {
        return await JobRepository.get();
    }

    public static generateJobId = (): string => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}

const refreshData = async (): Promise<void> => {
    const espData = await DataFecherService.fetchData();
    await JobsService.updateCurrentJobNozzleEvents(espData);
}


const onJobChangedHandler = async () => {
    if (JobsService.getCurrentJob() === null) return;
    if (NavigationService.getPreviousPage() === 'jobs') return;

    const refreshBegin = new Date();
    await refreshData();
    const refreshEnd = new Date();
    const refreshDuration = refreshEnd.getTime() - refreshBegin.getTime();

    const nextTimeout = 1000 - refreshDuration;

    setTimeout(() => {
        onJobChangedHandler();
    }, nextTimeout);
};

JobsService.addEventListener('onCurrentJobChanged', onJobChangedHandler);