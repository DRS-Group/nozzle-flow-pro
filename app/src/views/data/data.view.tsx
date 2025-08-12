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
import { SimulatedSpeed } from "../../components/simulated-speed/simulated-speen.component";

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

    const [isConnectedToWifi, setIsConnectedToWifi] = useState<boolean>(SettingsService.isConnectedToWifi());

    const [shouldSimulateSpeed, setShouldSimulateSpeed] = useState<boolean>(false);

    useEffect(() => {
        SettingsService.getShouldSimulateSpeed().then((value) => {
            setShouldSimulateSpeed(value);
        });

        const onShouldSimulateSpeedChange = (state: boolean) => {
            setShouldSimulateSpeed(state);
        }

        SettingsService.addEventListener('onShouldSimulateSpeedChange', onShouldSimulateSpeedChange);
        return () => {
            SettingsService.removeEventListener('onShouldSimulateSpeedChange', onShouldSimulateSpeedChange);
        }
    }, []);

    useEffect(() => {
        const onNetworkStatusChange = (state: boolean) => {
            setIsConnectedToWifi(state);
        }

        SettingsService.addEventListener('onNetworkStatusChange', onNetworkStatusChange);
        return () => {
            SettingsService.removeEventListener('onNetworkStatusChange', onNetworkStatusChange);
        }
    }, []);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        if (nozzles === undefined) return;

        const newChartData = nozzles.map((nozzle: Nozzle) => {
            return {
                label: nozzle.name,
                value: nozzle.pulsesPerMinute / nozzle.pulsesPerLiter,
                opacity: nozzle.ignored ? 0.15 : 1
            } as Dataset;
        });

        setChartData({ datasets: newChartData });
    }, [nozzles]);

    useEffect(() => {
        const eventHandler = async (data: any) => {
            const nozzles: Nozzle[] = data.nozzles;
            const speed: number = data.speed;
            if (!nozzles) return;

            setNozzles([...nozzles]);
            setSpeed(speed);
            setNozzleSpacing(await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6));
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

    const onSyncClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('nozzles');
    }

    const calculateTargetValue = () => {
        if (currentJob.job === null) return 0;

        const expectedFlow = currentJob.job.expectedFlow;

        return (speed * 3.6 * nozzleSpacing * 100 * expectedFlow) / 60000;
    }

    return (
        <>
            {currentJob.job && (<>
                {shouldSimulateSpeed && <SimulatedSpeed />}
                <div className={styles.wrapper}>
                    {nozzles !== undefined && isConnectedToWifi && (<>
                        {
                            nozzles.length >= 1 &&
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
                    </>)
                    }
                    {
                        isConnectedToWifi && currentJob.job && nozzles === undefined && (
                            <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <span>{translate('Loading...')}</span>
                            </div>
                        )
                    }
                    {
                        !isConnectedToWifi &&
                        <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <span>{translate('Not connected to Central Module')}</span>
                        </div>
                    }
                    <span className={styles.jobTitle}>{currentJob.job?.title}</span>
                    <span className={styles.jobExpectedFlow}>{currentJob.job?.expectedFlow} L/ha</span>
                </div>
                {nozzles !== undefined && isConnectedToWifi && (<>
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
            </>)
            }
        </>
    )
});