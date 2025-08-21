import { useLayoutEffect, useState } from "react";
import { services } from "../dependency-injection";
import { Nozzle } from "../types/nozzle.type";
import { ESPData } from "../types/ESP-data.type";
import { useCurrentJob } from "./useCurrentJob";
import { SettingsService } from "../services/settings.service";

const calculateTargetValue = (expectedFlow: number, speed: number, nozzleSpacing: number) => {
    return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
};

export function useData() {
    const currentJob = useCurrentJob();

    const [nozzles, setNozzles] = useState<Nozzle[]>([]);
    const [speed, setSpeed] = useState<number>(0);
    const [targetValue, setTargetValue] = useState<number>(0);
    const [nozzleSpacing, setNozzleSpacing] = useState<number>(0.6);

    useLayoutEffect(() => {
        SettingsService.getSettingOrDefault("nozzleSpacing", 0.6).then((spacing) => {
            setNozzleSpacing(spacing);
        });
    }, []);

    useLayoutEffect(() => {
        const eventHandler = async (data: ESPData) => {
            const nozzles: Nozzle[] = data.nozzles;
            const speed: number = data.speed;
            if (!nozzles) return;

            setNozzles([...nozzles]);
            setSpeed(speed);
            if (currentJob.job) {
                setTargetValue(calculateTargetValue(currentJob.job?.expectedFlow, speed, nozzleSpacing));
            }
        }

        services.dataFetcherService.addEventListener('onDataFetched', eventHandler);

        return () => {
            services.dataFetcherService.removeEventListener('onDataFetched', eventHandler);
        }
    }, [currentJob.job, nozzleSpacing]);

    return {
        nozzles,
        speed,
        targetValue
    };
}