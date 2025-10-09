import { IEvent } from "../types/event.type";
import { IFlowmeterEvent } from "../types/flowmeter-event.type";
import { Job } from "../types/job.type";
import { IOpticalSensorEvent } from "../types/optical-sensor-event.type";

export abstract class JobRepository {
    public static async get(): Promise<Job[]> {
        const result = window.electron.store.get('jobs');
        const jobs = JSON.parse(result || '[]').map((job: any): Job => {
            return {
                title: job.title,
                expectedFlow: job.expectedFlow,
                tolerance: job.tolerance,
                creationDate: new Date(job.creationDate),
                id: job.id,
                nozzleSpacing: job.nozzleSpacing,
                events: job.events.map((event: any) => {
                    let e: IEvent | IFlowmeterEvent | IOpticalSensorEvent = {
                        title: event.title,
                        description: event.description,
                        startTime: new Date(event.startTime),
                        endTime: event.endTime ? new Date(event.endTime) : undefined,
                        triggered: event.triggered,
                        id: event.id,
                        viewed: event.viewed,
                        coordinates: {
                            latitude: event.coordinates.latitude,
                            longitude: event.coordinates.longitude
                        },
                        type: event.type
                    };

                    if (e.type === 'flowmeterSensor') {
                        e = {
                            ...e,
                            sensorIndex: event.sensorIndex,
                            isFlowAboveExpected: event.isFlowAboveExpected,
                            isFlowBelowExpected: event.isFlowBelowExpected
                        }
                    }
                    else if (e.type === 'opticalSensor') {
                        e = {
                            ...e,
                            sensorIndex: event.sensorIndex
                        }
                    }

                    return e;
                })
            }
        });
        return jobs;
    }

    public static async save(job: Job): Promise<Job> {
        if (!job.id) {
            job.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }

        let jobs = await this.get();

        const index = jobs.findIndex(j => j.id === job.id);
        if (index === -1) {
            jobs.push(job);
        } else {
            jobs[index] = job;
        }
        window.electron.store.set('jobs', JSON.stringify(jobs));
        return job;
    }

    public static async delete(id: string): Promise<void> {
        let jobs = await this.get();
        jobs = jobs.filter(j => j.id !== id);
        window.electron.store.set('jobs', JSON.stringify(jobs));
    }
}