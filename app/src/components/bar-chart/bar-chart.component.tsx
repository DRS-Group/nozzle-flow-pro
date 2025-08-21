import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import styles from './bar-chart.module.css';
import { usePump } from '../../hooks/usePump';
import { useData } from '../../hooks/useData';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { Nozzle } from '../../types/nozzle.type';
import { YesNoDialog } from '../yes-no-dialog/yes-no-dialog.component';
import { useTranslate } from '../../hooks/useTranslate';
import { NozzlesService } from '../../services/nozzles.service';

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
    }, [data.nozzles]);

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
            {currentJob.job &&

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
                        {data.nozzles && data.nozzles.map((nozzle, index) =>
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

    const [nozzle, setNozzle] = useState<Nozzle>(data.nozzles[props.nozzleIndex]);
    const [isOutOfBounds, setIsOutOfBounds] = useState<boolean>(false);

    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);

    useLayoutEffect(() => {
        setNozzle(data.nozzles[props.nozzleIndex]);
    }, [data.nozzles, props.nozzleIndex]);

    useLayoutEffect(() => {
        if (!currentJob.job || !nozzle) return;

        const maxFlow = data.targetValue * (1 + currentJob.job!.tolerance);
        const minFlow = data.targetValue * (1 - currentJob.job!.tolerance);
        const currentFlow = nozzle.pulsesPerMinute / nozzle.pulsesPerLiter;
        setIsOutOfBounds((currentFlow < minFlow) || (currentFlow > maxFlow));
    }, [data.targetValue, currentJob.job, nozzle, nozzle]);

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
        if (!nozzle) return;

        const color = pump.isStabilized ? (isOutOfBounds ? 'red' : TARGET_COLOR) : 'darkgray';
        let height = 0;

        setStyle({
            height: pump.isStabilized ? `${valueToChartPercentage(nozzle.pulsesPerMinute / nozzle.pulsesPerLiter)}%` : '50%',
            opacity: nozzle.ignored ? 0.15 : 1,
            backgroundColor: color
        });
    }, [isOutOfBounds, nozzle, nozzle]);

    return (
        <>
            <div
                className={` ${styles.barWrapper} ${(isOutOfBounds && pump.pumpState !== "off" && pump.isStabilized) ? styles.pulse : ''}`}
                onPointerDown={() => {
                    if (nozzle.ignored)
                        setUnignoreNozzleDialogOpen(true);
                    else
                        setIgnoreNozzleDialogOpen(true);
                }}
                style={{ opacity: style.opacity }}
            >
                <div className={`${styles.bar}`} style={{ ...style, opacity: 1 }}>
                    <span>{nozzle?.name}</span>
                </div>
            </div>

            {ignoreNozzleDialogOpen &&
                <YesNoDialog
                    title={translate('Ignore nozzle')}
                    message={translate('Are you sure you want to ignore this nozzle?')}
                    onYesClick={() => {
                        nozzle.ignored = true;
                        NozzlesService.updateNozzle(nozzle, props.nozzleIndex);

                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen &&
                <YesNoDialog
                    title={translate('Unignore nozzle')}
                    message={translate('Are you sure you want to unignore this nozzle?')}
                    onYesClick={() => {
                        nozzle.ignored = false;
                        NozzlesService.updateNozzle(nozzle, props.nozzleIndex);

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