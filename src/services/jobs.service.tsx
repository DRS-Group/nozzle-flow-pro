import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";

export namespace JobsService {

    export const getJobs = async (): Promise<Job[]> => {
        return new Promise((resolve, reject) => {
            Preferences.get({ key: 'jobs' }).then((result) => {
                let jobs = JSON.parse(result.value || '[]') as Job[];
                jobs.forEach(job => {
                    job.creationDate = new Date(job.creationDate);
                    job.nozzleEvents.forEach(event => {
                        event._startTime = new Date(event._startTime);
                        if (event._endTime) event._endTime = new Date(event._endTime);
                    });
                });
                resolve(jobs);
            });
        });
    }

    export const setJobs = async (jobs: Job[]): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            Preferences.set({ key: 'jobs', value: JSON.stringify(jobs) }).then(() => {
                resolve();
            });
        });
    }

    export const addJob = async (job: Job): Promise<Job> => {
        return new Promise(async (resolve, reject) => {
            let jobs = await getJobs();

            jobs.push(job);

            setJobs(jobs).then(() => {
                resolve(job);
            });
        });
    }

    export const removeJob = async (job: Job): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let jobs = await getJobs();

            jobs = jobs.filter(j => j.id !== job.id);

            setJobs(jobs).then(() => {
                resolve();
            });
        });
    }

    export const removeJobById = async (id: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let jobs = await getJobs();

            jobs = jobs.filter(j => j.id !== id);

            setJobs(jobs).then(() => {
                resolve();
            });
        });
    }

    export const updateJob = async (job: Job): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            let jobs = await getJobs();

            let index = jobs.findIndex(j => j.id === job.id);

            jobs[index] = job;

            setJobs(jobs).then(() => {
                resolve();
            });
        });
    }

    export const getJobById = async (id: string): Promise<Job | null> => {
        return new Promise(async (resolve, reject) => {
            let jobs = await getJobs();

            let job = jobs.find(j => j.id === id);

            resolve(job || null);
        });
    }
}