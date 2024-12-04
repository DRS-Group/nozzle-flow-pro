import { useEffect, useState } from "react";
import { Job } from "../types/job.type";
import { services } from "../dependency-injection";

export function useJobs() {
    const jobsService = services.jobsService;

    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        jobsService.getJobs().then(jobs => {
            setJobs(jobs);
        });

        const eventHandler = (jobs: Job[]) => {
            setJobs(jobs);
        }

        jobsService.addEventListener('onJobsChanged', eventHandler);

        return () => {
            jobsService.removeEventListener('onJobsChanged', eventHandler);
        }
    }, [setJobs]);

    const remove = jobsService.removeJob;

    const generateId = jobsService.generateJobId;

    return { jobs, remove, generateId };
}