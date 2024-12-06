import { Preferences } from "@capacitor/preferences";
import { Job } from "../types/job.type";
import { BaseService, IBaseService } from "../types/base-service.type";
import { NozzleEvent } from "../types/nozzle-event.type";
import { ESPData } from "../types/ESP-data.type";
import { SettingsService } from "./settings.service";
import { DataFecherService } from "./data-fetcher.service";
import { NavigationService } from "./navigation.service";
import { JobRepository } from "../repositories/job.repository";
import { services } from "../dependency-injection";

export type JobsServiceEvents = 'onCurrentJobChanged' | 'onJobsChanged' | 'onCurrentJobNozzleEventsUpdated' | 'onNozzleEventTriggered';

export interface IJobsService extends IBaseService<JobsServiceEvents> {
    getCurrentJob: () => Job | null;
    setCurrentJob: (jobId: string | null) => Promise<void>;
    saveJob: (job: Job) => Promise<Job>;
    removeJob: (jobId: string) => Promise<void>;
    getJobById: (jobId: string) => Promise<Job | null>;
    getJobs: () => Promise<Job[]>;
    generateJobId: () => string;
}

export class JobsService extends BaseService<JobsServiceEvents> implements IJobsService {
    private currentJob: Job | null = null;

    public getCurrentJob = (): Job | null => {
        return this.currentJob;
    }

    public setCurrentJob = async (jobId: string | null) => {
        if (jobId === null) {
            this.currentJob = null;
            this.dispatchEvent('onCurrentJobChanged', null);
            return;
        }

        this.currentJob = await this.getJobById(jobId);
        this.dispatchEvent('onCurrentJobChanged', this.currentJob);
    }

    public saveJob = async (job: Job): Promise<Job> => {
        const savedJob = await JobRepository.save(job);
        if (savedJob.id === this.currentJob?.id) {
            await this.setCurrentJob(savedJob.id);
        }
        return savedJob;
    }

    public removeJob = async (jobId: string): Promise<void> => {
        if (this.currentJob?.id === jobId) {
            await this.setCurrentJob(null);
        }

        await JobRepository.delete(jobId);

        this.dispatchEvent('onJobsChanged', await this.getJobs());
    }

    public getJobById = async (jobId: string): Promise<Job | null> => {
        const jobs = await JobRepository.get();
        const job = jobs.find((job) => job.id === jobId) ?? null;
        return job;
    }

    public getJobs = async (): Promise<Job[]> => {
        return await JobRepository.get();
    }

    public generateJobId = (): string => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}