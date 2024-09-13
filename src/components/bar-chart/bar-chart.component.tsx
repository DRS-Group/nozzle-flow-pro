import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './bar-chart.module.css';

const TARGET_COLOR = 'rgb(255, 220, 255)';
const MAX_TARGET_COLOR = 'rgb(0, 207, 0)';
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
}

export const BarChart = forwardRef<BarChartElement, BarChartProps>((props, ref) => {
    const barsWrapperRef = useRef<HTMLDivElement>(null);

    const [minValue, setMinValue] = useState<number | undefined>(undefined);
    const [maxValue, setMaxValue] = useState<number | undefined>(undefined);
    const [gridLinesValues, setGridLinesValues] = useState<number[]>([]);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        updateMinAndMaxValues();
    }, [props.chartData.datasets]);

    useEffect(() => {
        updateGridLinesValues();
    }, [minValue, maxValue]);

    const updateMinAndMaxValues = () => {
        let min = Infinity;
        let max = -Infinity;

        for (const item of props.chartData.datasets) {
            if (item.value < min) {
                min = item.value;
            }
            if (item.value > max) {
                max = item.value;
            }
        }

        if (min !== Infinity && max !== -Infinity) {
            setMinValue(min);
            setMaxValue(max);
        }
        else {
            setMinValue(undefined);
            setMaxValue(undefined);
        }
    }

    const updateGridLinesValues = () => {
        if (minValue !== undefined && maxValue !== undefined) {
            const values: number[] = [];
            const step = (maxValue * 1.1 - minValue * 0.9) / 10;

            for (let i = 0; i <= 10; i++) {
                const value = minValue * 0.9 + step * i;
                values.push(value);
            }

            setGridLinesValues(values);
        }
        else {
            setGridLinesValues([]);
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.YAxis}></div>
            <div className={styles.XAxis}></div>
            <div className={styles.grid}>
                {gridLinesValues.map((value, index) => (
                    <div key={index} className={styles.gridLine} style={{ bottom: `${(value - minValue! * 0.9) / (maxValue! * 1.1 - minValue! * 0.9) * 100}%` }}>
                        <span>{value.toFixed(3)}</span>
                    </div>
                ))}
            </div>
            <div className={styles.targetLines}>
                <div className={styles.targetLine} style={{ bottom: `${(props.targetValue - minValue! * 0.9) / (maxValue! * 1.1 - minValue! * 0.9) * 100}%` }}>
                    <span>{props.targetValue.toFixed(3)}</span>
                </div>
                <div className={styles.maxTargetLine} style={{ bottom: `${(props.targetValue * (1 + props.tolerance) - minValue! * 0.9) / (maxValue! * 1.1 - minValue! * 0.9) * 100}%` }}>
                    <span>{(props.targetValue * (1 + props.tolerance)).toFixed(3)}</span>
                </div>
                <div className={styles.minTargetLine} style={{ bottom: `${(props.targetValue * (1 - props.tolerance) - minValue! * 0.9) / (maxValue! * 1.1 - minValue! * 0.9) * 100}%` }}>
                    <span>{(props.targetValue * (1 - props.tolerance)).toFixed(3)}</span>
                </div>
            </div>
            {minValue !== undefined && maxValue !== undefined && (
                <div className={styles.bars} ref={barsWrapperRef}>
                    {props.chartData.datasets.map((dataset, index) => {
                        const value = dataset.value;
                        const height = (value - minValue * 0.9) / (maxValue! * 1.1 - minValue! * 0.9);
                        const color = (value > props.targetValue * (1 + props.tolerance)) ? MAX_TARGET_COLOR : (value < props.targetValue * (1 - props.tolerance)) ? MIN_TARGET_COLOR : TARGET_COLOR;

                        return (
                            <Bar
                                key={dataset.label}
                                height={height}
                                color={color}
                                label={dataset.label}
                            ></Bar>
                        )
                    })}
                </div>
            )}
        </div >
    )
});

export type Dataset = {
    label: string,
    value: number
}

type BarElement = {

}

type BarProps = {
    height: number;
    color: string;
    label: string;
}

export const Bar = forwardRef<BarElement, BarProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const [style, setStyle] = useState({
        height: `${props.height * 100}%`,
        backgroundColor: props.color
    });

    useEffect(() => {
        setStyle({
            ...style,
            height: `${props.height * 100}%`,
        });
    }, [props.height]);

    useEffect(() => {
        setStyle({
            ...style,
            backgroundColor: props.color
        });
    }, [props.color]);

    return (
        <div className={styles.bar} style={style}>
            <span>{props.label}</span>
        </div>
    )
});