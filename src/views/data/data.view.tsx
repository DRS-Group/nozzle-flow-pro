import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react"
import styles from './data.module.css';
import { BarChart, ChartData, Dataset } from "../../components/bar-chart/bar-chart.component";
import { DataFecherService } from "../../services/data-fetcher.service";
import { Nozzle } from "../../types/nozzle.type";
import { JobContext } from "../../App";
import { NozzlesService } from "../../services/nozzles.service";
import { YesNoDialog } from "../../components/yes-no-dialog/yes-no-dialog.component";
import { SettingsService } from "../../services/settings.service";

export type DataViewElement = {

}

export type DataViewProps = {

}

export const DataView = forwardRef<DataViewElement, DataViewProps>((props, ref) => {

    const { currentJob, setCurrentJob } = useContext<any>(JobContext);

    const [chartData, setChartData] = useState<ChartData>({ datasets: [] });
    const [nozzles, setNozzles] = useState<Nozzle[] | undefined>(undefined);
    const [speed, setSpeed] = useState<number>(0);
    const [nozzleSpacing, setNozzleSpacing] = useState<number>(0.1);

    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);
    const [ignoreNozzleDialogNozlle, setIgnoreNozzleDialogNozzle] = useState<Nozzle | null>(null);
    const [unignoreNozzleDialogNozlle, setUnignoreNozzleDialogNozzle] = useState<Nozzle | null>(null);


    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        if (nozzles === undefined) return;

        const newChartData = nozzles.map((nozzle: Nozzle) => {
            return {
                label: nozzle.name,
                value: nozzle.flow,
                id: nozzle.id,
                opacity: nozzle.ignored ? 0.5 : 1
            } as Dataset;
        });

        setChartData({ datasets: newChartData });
    }, [nozzles]);

    useEffect(() => {
        const eventHandler = async (data: any) => {
            const nozzles: Nozzle[] = data.nozzles;
            const speed: number = data.speed;
            if (!nozzles) return;

            setNozzles(nozzles);
            setSpeed(speed);
            setNozzleSpacing(await SettingsService.getSettingOrDefault('nozzleSpacing', 0.1));
        }

        DataFecherService.addEventListener('onDataFetched', eventHandler);

        return () => {
            DataFecherService.removeEventListener('onDataFetched', eventHandler);
        }
    }, [setNozzles, setSpeed, setNozzleSpacing]);

    const onBarClick = async (dataset: Dataset) => {
        const nozzleId = dataset.id;
        const nozzle = await NozzlesService.getNozzleById(nozzleId);

        if (nozzle === null) return;

        if (nozzle.ignored) {
            setUnignoreNozzleDialogNozzle(nozzle);
            setUnignoreNozzleDialogOpen(true);
        }
        else {
            setIgnoreNozzleDialogNozzle(nozzle);
            setIgnoreNozzleDialogOpen(true);
        }
    }

    const onSyncClick = () => {
        DataFecherService.syncNozzles();
    }

    const calculateTargetValue = () => {
        // Nozzle expected flow in liters per second;
        const expectedFlow = currentJob.expectedFlow;

        return (speed * nozzleSpacing * expectedFlow) / 1;
    }

    return (
        <>
            <div className={styles.wrapper}>
                {nozzles != undefined && nozzles.length >= 1 &&
                    <BarChart
                        chartData={chartData}
                        targetValue={calculateTargetValue()}
                        tolerance={0.05}
                        onClick={onBarClick}
                    ></BarChart>
                }
                {nozzles === undefined || nozzles.length === 0 &&
                    <div className={styles.syncWrapper}>
                        <span>There is no synchronized nozzle.</span>
                        <span>Click the button bellow to synchronize.</span>
                        <button className={styles.syncButton} onClick={onSyncClick}>Synchronize</button>
                    </div>
                }
                <span className={styles.jobTitle}>{currentJob.title}</span>
            </div >
            {ignoreNozzleDialogOpen &&
                <YesNoDialog
                    title='Ignore nozzle'
                    message='Are you sure you want to ignore this nozzle?'
                    onYesClick={() => {
                        ignoreNozzleDialogNozlle!.ignored = true;
                        NozzlesService.updateNozzle(ignoreNozzleDialogNozlle!);

                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen &&
                <YesNoDialog
                    title='Unignore nozzle'
                    message='Are you sure you want to unignore this nozzle?'
                    onYesClick={() => {
                        unignoreNozzleDialogNozlle!.ignored = false;
                        NozzlesService.updateNozzle(unignoreNozzleDialogNozlle!);

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