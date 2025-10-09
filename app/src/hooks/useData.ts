import { useLayoutEffect, useMemo, useState } from "react";
import { services } from "../dependency-injection";
import { ESPData } from "../types/ESP-data.type";
import { useCurrentJob } from "./useCurrentJob";
import { SettingsService } from "../services/settings.service";
import { ISensor } from "../types/sensor";
import { IFlowmeterSensor } from "../types/flowmeter-sensor";
import { IOpticalSensor } from "../types/optical-sensor";

const calculateTargetValue = (expectedFlow: number, speed: number, nozzleSpacing: number) => {
    return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
};

export function useData() {
    const currentJob = useCurrentJob();

    const [sensors, setSensors] = useState<ISensor[]>([]);
    const [speed, setSpeed] = useState<number>(0);
    const [targetValue, setTargetValue] = useState<number>(0);
    const [nozzleSpacing, setNozzleSpacing] = useState<number>(0.6);

    useLayoutEffect(() => {
        setNozzleSpacing(SettingsService.getSettingOrDefault("nozzleSpacing", 0.6));
    }, []);

    useLayoutEffect(() => {
        const eventHandler = async (data: ESPData) => {
            const sensors: ISensor[] = data.sensors;
            const speed: number = data.speed;
            if (!sensors) return;

            setSensors([...sensors]);
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

    const flowmeterSensors = useMemo(
        () => sensors.filter((s): s is IFlowmeterSensor => s.type === 'flowmeter'),
        [sensors]
    );

    const opticalSensors = useMemo(
        () => sensors.filter((s): s is IOpticalSensor => s.type === 'optical'),
        [sensors]
    );

    return {
        flowmeterSensors,
        opticalSensors,
        speed,
        targetValue
    };
}