import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import styles from './bottom-menu.module.css';
import { ToggleButton } from "../toggle-button/toggle-button.component";
import { useTranslate } from "../../hooks/useTranslate";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { useNavigation } from "../../hooks/useNavigation";
import { usePump } from "../../hooks/usePump";
import { SoundsService } from "../../services/sounds.service";
import { SettingsService } from "../../services/settings.service";

export type BottomMenuElement = {

}

export type BottomMenuProps = {
}

export const BottomMenu = forwardRef<BottomMenuElement, BottomMenuProps>((props, ref) => {
    const translate = useTranslate();
    const currentJob = useCurrentJob();
    const navigation = useNavigation();
    const pump = usePump();

    const [timeoutHandle, setTimeoutHandle] = useState<NodeJS.Timeout | null>(null);

    const [wifiQuality, setWifiQuality] = useState<number>(0);
    const [isConnectedToWifi, setIsConnectedToWifi] = useState<boolean>(SettingsService.isConnectedToWifi());

    useEffect(() => {
        setWifiQuality(SettingsService.getWifiQuality());

        const eventListener = async (quality: number) => {
            setWifiQuality(quality);
        }

        SettingsService.addEventListener('onWifiQualityChanged', eventListener);

        return () => {
            SettingsService.removeEventListener('onWifiQualityChanged', eventListener);
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


    const onDataClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('dataView');
    }

    const onNozzlesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('nozzles');

    }

    const onLogsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('logs');
    }

    const onSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigation.navigate('settings');

    }

    const onPumpActiveButtonChange = (active: 'on' | 'off' | 'auto') => {
        pump.setOverridden(active);
    }

    const stopButton_onClick = () => {
        SoundsService.playClickSound();
        const timer = setTimeout(() => {
            SoundsService.playClickSound();
            navigation.navigate('menu');
            currentJob.set(null);
        }, 1000);

        setTimeoutHandle(timer);
    }

    const stopButton_onPointerLeave = () => {
        clearTimeout(timeoutHandle!);
    }

    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <div className={styles.wrapper}>
            <ToggleButton
                onStateChange={onPumpActiveButtonChange}
                state={pump.overriddenState}
            />
            <div className={styles.content}>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'dataView'} onClick={onDataClick}><i className="icon-chart-bar"></i><span>{translate('Data')}</span></button>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'nozzles'} onClick={onNozzlesClick}><i className="icon-nozzle"></i><span>{translate('Sensors')}</span></button>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'logs'} onClick={onLogsClick}><i className="icon-file-clock-outline"></i><span>{translate('Logs')}</span></button>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'settings'} onClick={onSettingsClick}><i className="icon-cog"></i><span>{translate('Settings')}</span></button>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '1rem',
                    color: 'white',
                }}
            >
                <i
                    className={
                        !isConnectedToWifi
                            ? 'icon-wifi-strength-none'
                            : wifiQuality >= 75
                                ? 'icon-wifi-strength-4'
                                : wifiQuality >= 50
                                    ? 'icon-wifi-strength-3'
                                    : wifiQuality >= 25
                                        ? 'icon-wifi-strength-2'
                                        : wifiQuality > 0
                                            ? 'icon-wifi-strength-1'
                                            : 'icon-wifi-strength-0'
                    }
                    style={{
                        color: 'inherit'
                    }}
                ></i>
                <span
                    style={{
                        color: 'inherit',
                        fontSize: '0.75rem'
                    }}
                >{wifiQuality}%</span>
            </div>
            <button className={styles.stopButton} onPointerDown={stopButton_onClick} onPointerLeave={stopButton_onPointerLeave}><i className="icon-stop"></i><span>{translate('Stop')}</span></button>
        </div>
    )
});