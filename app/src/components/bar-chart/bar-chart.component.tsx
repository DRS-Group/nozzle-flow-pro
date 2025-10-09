import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import styles from './bar-chart.module.css';
import { usePump } from '../../hooks/usePump';
import { useData } from '../../hooks/useData';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { YesNoDialog } from '../yes-no-dialog/yes-no-dialog.component';
import { useTranslate } from '../../hooks/useTranslate';
import { IFlowmeterSensor } from '../../types/flowmeter-sensor';
import { services } from '../../dependency-injection';

const TARGET_COLOR = 'rgb(50, 200, 100)';
const MAX_TARGET_COLOR = 'rgb(255, 0, 0)';
const MIN_TARGET_COLOR = 'rgb(255, 0, 0)';

export type ChartData = {
    datasets: Dataset[]
}

export type BarChartElement = {

}

export type BarChartProps = {}

export const BarChart = forwardRef<BarChartElement, BarChartProps>((props, ref) => {
    const barsWrapperRef = useRef<HTMLDivElement>(null);

    const [gridLinesValues, setGridLinesValues] = useState<number[]>([]);
    const data = useData();
    const currentJob = useCurrentJob();

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        updateGridLinesValues();
    }, [data.flowmeterSensors]);

    const updateGridLinesValues = () => {
        let values: number[] = [];

        const lastValue = data.targetValue * 2;

        const step = lastValue / 10;

        for (let i = 0; i <= 10; i++) {
            values.push(step * i);
        }

        setGridLinesValues(values);
    }

    const valueToChartPercentage = useCallback((value: number) => {
        if (!currentJob.job || !data?.targetValue) return 0;

        const tolerance = currentJob.job!.tolerance * 100;
        let percentage = (value) / (data.targetValue * 2) * 100;
        const minFlowPercentage = 50 - tolerance;
        const maxFlowPercentage = 50 + tolerance;

        function lerp(a: number, b: number, alpha: number) {
            return a + alpha * (b - a);
        }

        let alpha = (percentage - minFlowPercentage) / (maxFlowPercentage - minFlowPercentage);

        let newPercentage = lerp(25, 75, alpha);

        if (newPercentage < minFlowPercentage) {
            alpha = percentage / minFlowPercentage;
            newPercentage = lerp(0, 25, alpha);
            percentage = newPercentage;
        }
        else if (newPercentage > maxFlowPercentage) {
            alpha = (percentage - maxFlowPercentage) / (100 - maxFlowPercentage);
            newPercentage = lerp(75, 100, alpha);
            percentage = newPercentage;
        }
        else {
            percentage = newPercentage;
        }


        return percentage;
    }, [currentJob.job, data.targetValue]);

    return (
        <>
            {currentJob.job && data.flowmeterSensors.length > 0 &&

                <div className={styles.wrapper}>
                    <div className={styles.YAxis}></div>
                    <div className={styles.XAxis}></div>
                    <div className={styles.grid}>
                        {gridLinesValues.map((value, index) => (
                            <div key={index} className={styles.gridLine} style={{ bottom: `${valueToChartPercentage(value)}%` }}>
                                <span>{value.toFixed(3)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.targetLines}>
                        <div className={styles.targetLine} style={{ bottom: `${valueToChartPercentage(data.targetValue)}%` }}>
                            <span>{data.targetValue.toFixed(3)}</span>
                        </div>
                        <div className={styles.maxTargetLine} style={{ bottom: `${valueToChartPercentage(data.targetValue * (1 + currentJob.job!.tolerance))}%` }}>
                            <span>{(data.targetValue * (1 + currentJob.job!.tolerance)).toFixed(3)}</span>
                        </div>
                        <div className={styles.minTargetLine} style={{ bottom: `${valueToChartPercentage(data.targetValue * (1 - currentJob.job!.tolerance))}%` }}>
                            <span>{(data.targetValue * (1 - currentJob.job!.tolerance)).toFixed(3)}</span>
                        </div>
                    </div>

                    <div className={styles.bars} ref={barsWrapperRef}>
                        {data.flowmeterSensors && data.flowmeterSensors.map((flowmeterSensor, index) =>
                            <Bar
                                key={index}
                                nozzleIndex={index}
                            />
                        )}
                    </div>
                </div >
            }
        </>
    )
});

export type Dataset = {
    label: string,
    value: number,
    opacity?: number
}

type BarElement = {

}

type BarProps = {
    nozzleIndex: number;
}

export const Bar = forwardRef<BarElement, BarProps>((props, ref) => {
    const translate = useTranslate();
    const pump = usePump();
    const data = useData();
    const currentJob = useCurrentJob();

    const [flowmeterSensor, setFlowmeterSensor] = useState<IFlowmeterSensor>(data.flowmeterSensors[props.nozzleIndex]);
    const [isOutOfBounds, setIsOutOfBounds] = useState<boolean>(false);

    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);

    useLayoutEffect(() => {
        setFlowmeterSensor(data.flowmeterSensors[props.nozzleIndex]);
    }, [data.flowmeterSensors, props.nozzleIndex]);

    useLayoutEffect(() => {
        if (!currentJob.job || !flowmeterSensor) return;

        const maxFlow = data.targetValue * (1 + currentJob.job!.tolerance);
        const minFlow = data.targetValue * (1 - currentJob.job!.tolerance);
        const currentFlow = flowmeterSensor.pulsesPerMinute / flowmeterSensor.pulsesPerLiter;
        setIsOutOfBounds((currentFlow < minFlow) || (currentFlow > maxFlow));
    }, [data.targetValue, currentJob.job, flowmeterSensor, flowmeterSensor]);

    const valueToChartPercentage = useCallback((value: number) => {
        if (!currentJob.job || !data?.targetValue) return 0;
        const tolerance = currentJob.job!.tolerance * 100;
        let percentage = (value) / (data.targetValue * 2) * 100;
        const minFlowPercentage = 50 - tolerance;
        const maxFlowPercentage = 50 + tolerance;

        function lerp(a: number, b: number, alpha: number) {
            return a + alpha * (b - a);
        }

        let alpha = (percentage - minFlowPercentage) / (maxFlowPercentage - minFlowPercentage);

        let newPercentage = lerp(25, 75, alpha);

        if (newPercentage < minFlowPercentage) {
            alpha = percentage / minFlowPercentage;
            newPercentage = lerp(0, 25, alpha);
            percentage = newPercentage;
        }
        else if (newPercentage > maxFlowPercentage) {
            alpha = (percentage - maxFlowPercentage) / (100 - maxFlowPercentage);
            newPercentage = lerp(75, 100, alpha);
            percentage = newPercentage;
        }
        else {
            percentage = newPercentage;
        }

        return percentage;
    }, [currentJob.job, data.targetValue]);

    useImperativeHandle(ref, () => ({

    }), []);

    const [style, setStyle] = useState({
        height: `0%`,
        opacity: 0,
        backgroundColor: TARGET_COLOR
    });

    useEffect(() => {
        if (!flowmeterSensor) return;

        const color = pump.isStabilized ? (isOutOfBounds ? 'red' : TARGET_COLOR) : 'darkgray';
        let height = 0;

        setStyle({
            height: pump.isStabilized ? `${valueToChartPercentage(flowmeterSensor.pulsesPerMinute / flowmeterSensor.pulsesPerLiter)}%` : '50%',
            opacity: flowmeterSensor.ignored ? 0.15 : 1,
            backgroundColor: color
        });
    }, [isOutOfBounds, flowmeterSensor, flowmeterSensor]);

    return (
        <>
            <div
                className={` ${styles.barWrapper} ${(isOutOfBounds && pump.pumpState !== "off" && pump.isStabilized) ? styles.pulse : ''}`}
                onClick={() => {
                    if (flowmeterSensor.ignored)
                        setUnignoreNozzleDialogOpen(true);
                    else
                        setIgnoreNozzleDialogOpen(true);
                }}
                style={{ opacity: style.opacity }}
            >
                <div className={`${styles.bar}`} style={{ ...style, opacity: 1 }}>
                    <span>{flowmeterSensor?.name}</span>
                </div>
            </div>

            {ignoreNozzleDialogOpen &&
                <YesNoDialog
                    title={`${translate('Ignore')} ${flowmeterSensor.name}`}
                    message={translate('Are you sure you want to ignore this sensor?')}
                    onYesClick={() => {
                        flowmeterSensor.ignored = true;
                        services.sensorsService.updateFlowmeterSensor(flowmeterSensor, props.nozzleIndex);

                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen &&
                <YesNoDialog
                    title={`${translate('Unignore')} ${flowmeterSensor.name}`}
                    message={translate('Are you sure you want to unignore this sensor?')}
                    onYesClick={() => {
                        flowmeterSensor.ignored = false;
                        services.sensorsService.updateFlowmeterSensor(flowmeterSensor, props.nozzleIndex)

                        setUnignoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setUnignoreNozzleDialogOpen(false);
                    }}
                />
            }
        </>
    )
});