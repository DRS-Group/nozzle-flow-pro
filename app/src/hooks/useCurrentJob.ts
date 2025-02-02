import { useEffect, useState } from "react";
import { Job } from "../types/job.type";
import { services } from "../dependency-injection";
import { Event } from "../types/event.type";

export function useCurrentJob() {
    const currentJobService = services.currentJobService;

    const [job, setJob] = useState<Job | null>(null);
    const [unviwedTriggeredEvents, setUnviewedTriggeredEvents] = useState<Event[]>([]);

    useEffect(() => {
        currentJobService.getCurrentJob().then(job => {
            setJob(job);
        });

        const eventHandler = (jobId: string | null) => {
            currentJobService.getCurrentJob().then(job => {
                setJob(job);

                if (jobId && job?.nozzleEvents) {
                    const triggeredEvents = job.nozzleEvents.filter(event => event.triggered && !event.viewed);
                    setUnviewedTriggeredEvents(triggeredEvents);
                }
            });
        }

        currentJobService.addEventListener('onCurrentJobChanged', eventHandler);

        return () => {
            currentJobService.removeEventListener('onCurrentJobChanged', eventHandler);
        }
    }, [setJob]);

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
        unviwedTriggeredEvents,
        markEventAsViewed,
        markAllEventsAsViewed
    }
}