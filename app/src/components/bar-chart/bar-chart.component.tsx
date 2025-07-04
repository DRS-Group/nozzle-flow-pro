import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './bar-chart.module.css';

const TARGET_COLOR = 'rgb(50, 200, 100)';
const MAX_TARGET_COLOR = 'rgb(255, 0, 0)';
const MIN_TARGET_COLOR = 'rgb(255, 0, 0)';

export type ChartData = {
    datasets: Dataset[]
}

export type BarChartElement = {

}

export type BarChartProps = {
    chartData: ChartData,
    barsGap?: number,
    targetValue: number,
    tolerance: number
    onClick?: (nozzleIndex: number) => void
}

export const BarChart = forwardRef<BarChartElement, BarChartProps>((props, ref) => {
    const barsWrapperRef = useRef<HTMLDivElement>(null);

    const [gridLinesValues, setGridLinesValues] = useState<number[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        updateGridLinesValues();
    }, [props.chartData]);

    const updateGridLinesValues = () => {
        let values: number[] = [];

        const targetValue = props.targetValue;
        const lastValue = props.targetValue * 2;

        const step = lastValue / 10;

        for (let i = 0; i <= 10; i++) {
            values.push(step * i);
        }

        setGridLinesValues(values);
    }

    const valueToChartPercentage = (value: number) => {
        const tolerance = props.tolerance * 100;
        let percentage = (value) / (props.targetValue * 2) * 100;
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
    }

    return (
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
                <div className={styles.targetLine} style={{ bottom: `${valueToChartPercentage(props.targetValue)}%` }}>
                    <span>{props.targetValue.toFixed(3)}</span>
                </div>
                <div className={styles.maxTargetLine} style={{ bottom: `${valueToChartPercentage(props.targetValue * (1 + props.tolerance))}%` }}>
                    <span>{(props.targetValue * (1 + props.tolerance)).toFixed(3)}</span>
                </div>
                <div className={styles.minTargetLine} style={{ bottom: `${valueToChartPercentage(props.targetValue * (1 - props.tolerance))}%` }}>
                    <span>{(props.targetValue * (1 - props.tolerance)).toFixed(3)}</span>
                </div>
            </div>

            <div className={styles.bars} ref={barsWrapperRef}>
                {props.chartData.datasets.map((dataset, index) => {
                    const value = dataset.value;
                    const height = valueToChartPercentage(value) / 100;
                    const color = (value > props.targetValue * (1 + props.tolerance)) ? MAX_TARGET_COLOR : (value < props.targetValue * (1 - props.tolerance)) ? MIN_TARGET_COLOR : TARGET_COLOR;

                    const pulse = dataset.value > props.targetValue * (1 + props.tolerance) || dataset.value < props.targetValue * (1 - props.tolerance);

                    function randomNumber(min: number, max: number) { // min and max included 
                        return (Math.random() * (max - min) + min);
                    }

                    return (
                        <Bar
                            key={dataset.label}
                            height={height * randomNumber(1, 1.000001)}
                            color={color}
                            opacity={dataset.opacity}
                            label={dataset.label}
                            pulse={pulse}
                            onClick={props.onClick}
                            nozzleIndex={index}
                        ></Bar>
                    )
                })}
            </div>
        </div >
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
    height: number;
    color: string;
    opacity?: number;
    label: string;
    onClick?: (nozzleIndex: number) => void;
    nozzleIndex: number;
    pulse?: boolean;
}

export const Bar = forwardRef<BarElement, BarProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const [style, setStyle] = useState({
        height: `${props.height * 100}%`,
        backgroundColor: props.color,
        opacity: props.opacity || 1
    });

    useEffect(() => {
        setStyle({
            height: `${props.height * 100}%`,
            opacity: props.opacity || 1,
            backgroundColor: style.backgroundColor
        });
    }, [props.height, props.opacity]);

    useEffect(() => {
        setStyle({
            height: style.height,
            opacity: style.opacity,
            backgroundColor: props.color
        });
    }, [props.color]);

    return (
        <div
            className={` ${styles.barWrapper} ${props.pulse ? styles.pulse : ''}`}
            onClick={() => {
                if (props.onClick) props.onClick(props.nozzleIndex);
            }}
        >
            <div className={`${styles.bar}`} style={style}>
                <span>{props.label}</span>
            </div>
        </div>
    )
});