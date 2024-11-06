import { useEffect, useState } from "react";
import { Job } from "../types/job.type";
import { JobsService } from "../services/jobs.service";

export function useJobs() {
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        JobsService.getJobs().then(jobs => {
            setJobs(jobs);
        });

        const eventHandler = (jobs: Job[]) => {
            setJobs(jobs);
        }

        JobsService.addEventListener('onJobsChanged', eventHandler);

        return () => {
            JobsService.removeEventListener('onJobsChanged', eventHandler);
        }
    }, [setJobs]);

    const remove = JobsService.removeJob;

    const generateId = JobsService.generateJobId;

    return { jobs, remove, generateId };
}