import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import styles from './data.module.css';
import { BarChart } from "../../components/bar-chart/bar-chart.component";
import { SettingsService } from "../../services/settings.service";
import { useTranslate } from "../../hooks/useTranslate";
import { useNavigation } from "../../hooks/useNavigation";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { SimulatedSpeed } from "../../components/simulated-speed/simulated-speen.component";
import { useData } from "../../hooks/useData";
import { Lights } from "../../components/lights.component/lights.component";

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
        setShouldSimulateSpeed(SettingsService.getShouldSimulateSpeed());

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
        setIsDemoMode(SettingsService.getSettingOrDefault('demoMode', false));

        const onDemoModeChanged = (state: boolean) => {
            setIsDemoMode(state);
        }

        SettingsService.addEventListener('onDemoModeChanged', onDemoModeChanged);

        return () => {
            SettingsService.removeEventListener('onDemoModeChanged', onDemoModeChanged);
        }
    }, []);

    useImperativeHandle(ref, () => ({

    }), []);

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
                    {(data.flowmeterSensors.length === 0 && data.opticalSensors.length === 0) && (isConnectedToWifi || isDemoMode) &&
                        <div className={styles.syncWrapper}>
                            <span>{translate('There is no registered flowmeter.')}</span>
                            <span>{translate('Click the button bellow to go to sensors page.')}</span>
                            <button className={styles.syncButton} onClick={onSyncClick}>{translate('Sensors')}</button>
                        </div>
                    }
                    {data.opticalSensors.length > 0 && (isConnectedToWifi || isDemoMode) &&
                        <Lights></Lights>
                    }
                    {data.flowmeterSensors.length > 0 && (isConnectedToWifi || isDemoMode) &&
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
            </>)
            }
        </>
    )
});