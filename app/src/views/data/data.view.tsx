import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import styles from './data.module.css';
import { BarChart } from "../../components/bar-chart/bar-chart.component";
import { SettingsService } from "../../services/settings.service";
import { useTranslate } from "../../hooks/useTranslate";
import { useNavigation } from "../../hooks/useNavigation";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { SimulatedSpeed } from "../../components/simulated-speed/simulated-speen.component";
import { useData } from "../../hooks/useData";

export type DataViewElement = {

}

export type DataViewProps = {

}

export const DataView = forwardRef<DataViewElement, DataViewProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const currentJob = useCurrentJob();

    const data = useData();

    const [isConnectedToWifi, setIsConnectedToWifi] = useState<boolean>(SettingsService.isConnectedToWifi());

    const [shouldSimulateSpeed, setShouldSimulateSpeed] = useState<boolean>(false);
    const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

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

    useEffect(() => {
        const onDemoModeChanged = (state: boolean) => {
            setIsDemoMode(state);
        }

        SettingsService.addEventListener('onDemoModeChanged', onDemoModeChanged);
        SettingsService.getSettingOrDefault('demoMode', false).then((value) => {
            setIsDemoMode(value);
        });
    }, []);

    useImperativeHandle(ref, () => ({

    }), []);

    // const onBarClick = async (nozzleIndex: number) => {
    //     if (nozzles === undefined) return;
    //     const nozzle = nozzles[nozzleIndex];

    //     if (nozzle === null) return;

    //     if (nozzle.ignored) {
    //         setUnignoreNozzleDialogNozzleIndex(nozzleIndex);
    //         setUnignoreNozzleDialogOpen(true);
    //     }
    //     else {
    //         setIgnoreNozzleDialogNozzleIndex(nozzleIndex);
    //         setIgnoreNozzleDialogOpen(true);
    //     }
    // }

    const onSyncClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('nozzles');
    }

    return (
        <>
            {currentJob.job && (<>
                {shouldSimulateSpeed && <SimulatedSpeed />}
                <div className={styles.wrapper}>
                    {data.nozzles.length === 0 &&
                        <div className={styles.syncWrapper}>
                            <span>{translate('There is no registered nozzle.')}</span>
                            <span>{translate('Click the button bellow to go to nozzles page.')}</span>
                            <button className={styles.syncButton} onPointerDown={onSyncClick}>{translate('Nozzles')}</button>
                        </div>
                    }
                    {data.nozzles.length > 0 && (isConnectedToWifi || isDemoMode) &&
                        <BarChart></BarChart>
                    }
                    {!isConnectedToWifi && !isDemoMode &&
                        <div className={styles.wrapper} style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <span>{translate('Not connected to Central Module')}</span>
                        </div>
                    }
                    <span className={styles.jobTitle}>{currentJob.job?.title}</span>
                    <span className={styles.jobExpectedFlow}>{currentJob.job?.expectedFlow} L/ha</span>
                </div>
                {/* {nozzles !== undefined && isConnectedToWifi && (<>
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
                </>)} */}
            </>)
            }
        </>
    )
});