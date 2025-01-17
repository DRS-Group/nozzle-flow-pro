import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react"
import styles from './data.module.css';
import { BarChart, ChartData, Dataset } from "../../components/bar-chart/bar-chart.component";
import { DataFecherService } from "../../services/data-fetcher.service";
import { Nozzle } from "../../types/nozzle.type";
import { NozzlesService } from "../../services/nozzles.service";
import { YesNoDialog } from "../../components/yes-no-dialog/yes-no-dialog.component";
import { SettingsService } from "../../services/settings.service";
import { useTranslate } from "../../hooks/useTranslate";
import { useNavigation } from "../../hooks/useNavigation";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { services } from "../../dependency-injection";

export type DataViewElement = {

}

export type DataViewProps = {

}

export const DataView = forwardRef<DataViewElement, DataViewProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const currentJob = useCurrentJob();

    const [chartData, setChartData] = useState<ChartData>({ datasets: [] });
    const [nozzles, setNozzles] = useState<Nozzle[] | undefined>(undefined);
    const [speed, setSpeed] = useState<number>(0);
    const [nozzleSpacing, setNozzleSpacing] = useState<number>(0.1);

    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);
    const [ignoreNozzleDialogNozlleIndex, setIgnoreNozzleDialogNozzleIndex] = useState<number | null>(null);
    const [unignoreNozzleDialogNozlleIndex, setUnignoreNozzleDialogNozzleIndex] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        if (nozzles === undefined) return;

        const newChartData = nozzles.map((nozzle: Nozzle) => {
            return {
                label: nozzle.name,
                value: nozzle.flow,
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

        services.dataFetcherService.addEventListener('onDataFetched', eventHandler);

        return () => {
            services.dataFetcherService.removeEventListener('onDataFetched', eventHandler);
        }
    }, [setNozzles, setSpeed, setNozzleSpacing]);

    const onBarClick = async (nozzleIndex: number) => {
        if (nozzles === undefined) return;
        const nozzle = nozzles[nozzleIndex];

        if (nozzle === null) return;

        if (nozzle.ignored) {
            setUnignoreNozzleDialogNozzleIndex(nozzleIndex);
            setUnignoreNozzleDialogOpen(true);
        }
        else {
            setIgnoreNozzleDialogNozzleIndex(nozzleIndex);
            setIgnoreNozzleDialogOpen(true);
        }
    }

    const onSyncClick = () => {
        navigation.navigate('nozzles');
    }

    const calculateTargetValue = () => {
        if (currentJob.job === null) return 0;
        // Nozzle expected flow in liters per second;
        const expectedFlow = currentJob.job.expectedFlow;

        return (speed * nozzleSpacing * expectedFlow) / 1;
    }

    return (
        <>
            {currentJob.job && nozzles !== undefined && (<>
                <div className={styles.wrapper}>
                    {nozzles.length >= 1 &&
                        <BarChart
                            chartData={chartData}
                            targetValue={calculateTargetValue()}
                            tolerance={currentJob.job!.tolerance}
                            onClick={onBarClick}
                        ></BarChart>
                    }
                    {nozzles.length === 0 &&
                        <div className={styles.syncWrapper}>
                            <span>{translate('There is no registered nozzle.')}</span>
                            <span>{translate('Click the button bellow to go to nozzles page.')}</span>
                            <button className={styles.syncButton} onClick={onSyncClick}>{translate('Nozzles')}</button>
                        </div>
                    }
                    <span className={styles.jobTitle}>{currentJob.job?.title}</span>
                </div >
                {ignoreNozzleDialogOpen &&
                    <YesNoDialog
                        title={translate('Ignore nozzle')}
                        message={translate('Are you sure you want to ignore this nozzle?')}
                        onYesClick={() => {
                            if (ignoreNozzleDialogNozlleIndex === null) return;
                            const nozzle = nozzles[ignoreNozzleDialogNozlleIndex];
                            nozzle.ignored = true;
                            NozzlesService.updateNozzle(nozzle, ignoreNozzleDialogNozlleIndex);

                            setIgnoreNozzleDialogOpen(false);
                            setIgnoreNozzleDialogNozzleIndex(null);
                        }}

                        onNoClick={() => {
                            setIgnoreNozzleDialogOpen(false);
                            setIgnoreNozzleDialogNozzleIndex(null);
                        }}
                    />
                }
                {unignoreNozzleDialogOpen &&
                    <YesNoDialog
                        title={translate('Unignore nozzle')}
                        message={translate('Are you sure you want to unignore this nozzle?')}
                        onYesClick={() => {
                            if (unignoreNozzleDialogNozlleIndex === null) return;
                            const nozzle = nozzles[unignoreNozzleDialogNozlleIndex];
                            nozzle.ignored = false;
                            NozzlesService.updateNozzle(nozzle, unignoreNozzleDialogNozlleIndex);

                            setUnignoreNozzleDialogOpen(false);
                            setUnignoreNozzleDialogNozzleIndex(null);
                        }}

                        onNoClick={() => {
                            setUnignoreNozzleDialogOpen(false);
                            setUnignoreNozzleDialogNozzleIndex(null);
                        }}
                    />
                }
            </>)}
            {currentJob.job && nozzles === undefined && (
                <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <span>{translate('Loading...')}</span>
                </div>
            )}
        </>
    )
});