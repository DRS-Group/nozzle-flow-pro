import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './bar-chart.module.css';

const TARGET_COLOR = 'rgb(255, 220, 255)';
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
    onClick?: (dataset: Dataset) => void
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
        return (value) / (props.targetValue * 2) * 100;
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

                    return (
                        <Bar
                            key={dataset.label}
                            height={height}
                            color={color}
                            label={dataset.label}
                            onClick={props.onClick}
                        ></Bar>
                    )
                })}
            </div>
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
    onClick?: (dataset: Dataset) => void;
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
        <div
            className={styles.barWrapper}
            onClick={() => {
                if (props.onClick) props.onClick({ label: props.label, value: props.height });
            }}
        >
            <div className={styles.bar} style={style}>
                <span>{props.label}</span>
            </div>
        </div>
    )
});