import { useEffect, useReducer, useState } from "react";
import { Job } from "../types/job.type";
import { services } from "../dependency-injection";

export function useCurrentJob() {
    const jobsService = services.jobsService;

    const [job, setJob] = useState<Job | null>(null);

    useEffect(() => {
        setJob(jobsService.getCurrentJob());

        const eventHandler = (job: Job | null) => {
            setJob(job);
        }

        jobsService.addEventListener('onCurrentJobChanged', eventHandler);

        return () => {
            jobsService.removeEventListener('onCurrentJobChanged', eventHandler);
        }
    }, [setJob, job]);

    useEffect(() => {
        setJob(jobsService.getCurrentJob());

        const eventHandler = (job: Job) => {
            let newJob: Job = { ...job };
            setJob(newJob);
        }

        jobsService.addEventListener('onCurrentJobNozzleEventsUpdated', eventHandler);

        return () => {
            jobsService.removeEventListener('onCurrentJobNozzleEventsUpdated', eventHandler);
        }
    }, [setJob, job]);

    const set = (jobId: string | null) => {
        jobsService.setCurrentJob(jobId);
    }

    const save = () => {
        if (job) jobsService.saveJob(job);
    }

    const markEventAsViewed = (eventId: string) => {
        if (!job) return;
        const event = job.nozzleEvents.find(e => e.id === eventId);
        if (!event) return;
        event.viewed = true;
        setJob({ ...job });
        save();

    }

    const markAllEventAsViewed = () => {
        if (!job) return;
        job.nozzleEvents.forEach(e => e.viewed = true);
    }

    const getUnviewedTriggeredEvents = () => {
        if (!job) return [];
        return job.nozzleEvents.filter(e => !e.viewed && e.triggered);
    }

    return {
        job,
        set,
        save,
        markEventAsViewed,
        markAllEventAsViewed,
        getUnviewedTriggeredEvents
    }
}