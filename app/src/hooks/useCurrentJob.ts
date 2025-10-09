import { useLayoutEffect, useState } from "react";
import { Job } from "../types/job.type";
import { services } from "../dependency-injection";
import { IEvent } from "../types/event.type";

export function useCurrentJob() {
    const currentJobService = services.currentJobService;

    const [job, setJob] = useState<Job | null>(null);
    const [unviewedTriggeredEvents, setUnviewedTriggeredEvents] = useState<IEvent[]>([]);

    useLayoutEffect(() => {
        currentJobService.getCurrentJob().then(job => {
            setJob(job);
        });

        const eventHandler = (jobId: string | null) => {
            currentJobService.getCurrentJob().then(job => {
                setJob(job);

                if (jobId && job?.events) {
                    const triggeredEvents = job.events.filter(event => event.triggered && !event.viewed);
                    setUnviewedTriggeredEvents(triggeredEvents);
                }
            });
        }

        currentJobService.addEventListener('onCurrentJobChanged', eventHandler);

        return () => {
            currentJobService.removeEventListener('onCurrentJobChanged', eventHandler);
        }
    }, [currentJobService]);

    const set = (jobId: string | null) => {
        currentJobService.setCurrentJob(jobId);
    }

    const markEventAsViewed = (eventId: string) => {
        currentJobService.markEventAsViewed(eventId);
    }

    const markAllEventsAsViewed = () => {
        currentJobService.markAllEventsAsViewed();
    }


    return {
        job,
        set,
        unviewedTriggeredEvents,
        markEventAsViewed,
        markAllEventsAsViewed
    }
}