import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react"
import styles from './bottom-menu.module.css';
import { ToggleButton } from "../toggle-button/toggle-button.component";
import { useTranslate } from "../../hooks/useTranslate";
import { NavigationService } from "../../services/navigation.service";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { useNavigation } from "../../hooks/useNavigation";
import { usePump } from "../../hooks/usePump";
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

    const onDataClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        navigation.navigate('dataView');

    }

    const onNozzlesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        navigation.navigate('nozzles');

    }

    const onLogsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        navigation.navigate('logs');

    }

    const onSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        navigation.navigate('settings');

    }

    const onStopClick = () => {
        navigation.navigate('menu');
        currentJob.set(null);
    }

    const onPumpActiveButtonChange = (active: 'on' | 'off' | 'auto') => {
        pump.setOverridden(active);
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
                <button className={styles.menuItem} data-current={navigation.currentPage === 'nozzles'} onClick={onNozzlesClick}><i className="icon-nozzle"></i><span>{translate('Nozzles')}</span></button>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'logs'} onClick={onLogsClick}><i className="icon-file-clock-outline"></i><span>{translate('Logs')}</span></button>
                <button className={styles.menuItem} data-current={navigation.currentPage === 'settings'} onClick={onSettingsClick}><i className="icon-cog"></i><span>{translate('Settings')}</span></button>
            </div>
            <button className={styles.stopButton} onClick={onStopClick}><i className="icon-stop"></i><span>{translate('Stop')}</span></button>
        </div>
    )
});