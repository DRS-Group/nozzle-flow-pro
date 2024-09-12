import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react"
import styles from './data.module.css';
import { BarChart, ChartData, Dataset } from "../../components/bar-chart/bar-chart.component";
import { DataFecherService } from "../../services/data-fetcher.service";
import { Nozzle } from "../../models/nozzle.model";
import { NozzlesContext } from "../../App";

export type DataViewElement = {

}

export type DataViewProps = {
    onSyncClick: () => void;
}

export const DataView = forwardRef<DataViewElement, DataViewProps>((props, ref) => {

    const nozzles: Nozzle[] | undefined = useContext<Nozzle[] | undefined>(NozzlesContext);

    const [chartData, setChartData] = useState<ChartData>({ datasets: [] });

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        if (nozzles === undefined) return;

        const newChartData = nozzles.map((nozzle: Nozzle) => {
            return {
                label: nozzle.id,
                value: nozzle.flow
            } as Dataset;
        });

        setChartData({ datasets: newChartData });
    }, [nozzles]);

    return (
        <div className={styles.wrapper}>
            {nozzles != undefined && nozzles.length >= 1 &&
                <BarChart
                    chartData={chartData}
                    targetValue={2.5}
                    tolerance={0.05}
                ></BarChart>
            }
            {nozzles === undefined &&
                <div className={styles.syncWrapper}>
                    <span>There is no synchronized nozzle.</span>
                    <span>Click the button bellow to synchronize.</span>
                    <button className={styles.syncButton} onClick={() => {
                        props.onSyncClick();
                    }}>Synchronize</button>
                </div>
            }
        </div >
    )
});