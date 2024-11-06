import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";

export abstract class JobRepository {
    public static async get(): Promise<Job[]> {
        const result = await Preferences.get({ key: 'jobs' });
        const jobs = JSON.parse(result.value || '[]').map((job: any) => {
            return {
                title: job.title,
                expectedFlow: job.expectedFlow,
                tolerance: job.tolerance,
                durationTolerance: job.durationTolerance,
                creationDate: new Date(job.creationDate),
                id: job.id,
                nozzleEvents: job.nozzleEvents
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
        await Preferences.set({ key: 'jobs', value: JSON.stringify(jobs) });
        return job;
    }

    public static async delete(id: string): Promise<void> {
        let jobs = await this.get();
        jobs = jobs.filter(j => j.id !== id);
        await Preferences.set({ key: 'jobs', value: JSON.stringify(jobs) });
    }
}