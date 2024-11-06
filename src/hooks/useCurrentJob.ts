import { useEffect, useState } from "react";
import { Job } from "../types/job.type";
import { JobsService } from "../services/jobs.service";
import { NozzleEvent } from "../types/nozzle-event.type";

export function useCurrentJob() {
    const [job, setJob] = useState<Job | null>(null);

    useEffect(() => {
        setJob(JobsService.getCurrentJob());

        const eventHandler = (job: Job | null) => {
            setJob(job);
        }

        JobsService.addEventListener('onCurrentJobChanged', eventHandler);

        return () => {
            JobsService.removeEventListener('onCurrentJobChanged', eventHandler);
        }
    }, [setJob, job]);

    useEffect(() => {
        setJob(JobsService.getCurrentJob());

        const eventHandler = (job: Job | null) => {
            setJob(job);
        }

        JobsService.addEventListener('onCurrentJobNozzleEventsUpdated', eventHandler);

        return () => {
            JobsService.removeEventListener('onCurrentJobNozzleEventsUpdated', eventHandler);
        }
    }, [setJob, job]);

    const set = (jobId: string | null) => {
        JobsService.setCurrentJob(jobId);
    }

    const save = () => {
        if (job) JobsService.saveJob(job);
    }

    const markEventAsViewed = (eventId: string) => {
        if (!job) return;
        const event = job.nozzleEvents.find(e => e.id === eventId);
        if (!event) return;
        event.viewed = true;
    }

    const markAllEventAsViewed = () => {
        if (!job) return;
        job.nozzleEvents.forEach(e => e.viewed = true);
    }

    return {
        job,
        set,
        save,
        markEventAsViewed,
        markAllEventAsViewed,
    }
}