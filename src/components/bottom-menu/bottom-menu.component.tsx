import { forwardRef, useContext, useImperativeHandle, useState } from "react"
import styles from './bottom-menu.module.css';
import { ToggleButton } from "../toggle-button/toggle-button.component";
import { useTranslate } from "../../hooks/useTranslate";
import { NavigationService } from "../../services/navigation.service";
import { useCurrentJob } from "../../hooks/useCurrentJob";
import { useNavigation } from "../../hooks/useNavigation";

export type BottomMenuElement = {

}

export type BottomMenuProps = {
    onActiveChange: (active: 'on' | 'off' | 'auto') => void;
}

export const BottomMenu = forwardRef<BottomMenuElement, BottomMenuProps>((props, ref) => {
    const translate = useTranslate();
    const currentJob = useCurrentJob();
    const navigation = useNavigation();


    // const onAnyItemClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    //     const target = e.currentTarget;
    //     document.querySelectorAll(`.${styles.menuItem}`).forEach((el) => {
    //         el.removeAttribute('data-current');
    //     });

    //     target.setAttribute('data-current', 'true');
    // }

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

    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <div className={styles.wrapper}>
            <ToggleButton
                onStateChange={props.onActiveChange}
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