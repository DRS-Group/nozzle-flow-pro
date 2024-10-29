import { forwardRef, useContext, useImperativeHandle, useState } from "react"
import styles from './side-menu.module.css';
import { ToggleButton } from "../toggle-button/toggle-button.component";
import { JobContext, NavFunctionsContext, useTranslate } from "../../App";

export type SideMenuElement = {

}

export type SideMenuProps = {
    onActiveChange: (active: 'on' | 'off' | 'auto') => void;
}

export const SideMenu = forwardRef<SideMenuElement, SideMenuProps>((props, ref) => {
    const translate = useTranslate();
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext(JobContext);

    const onAnyItemClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget;
        document.querySelectorAll(`.${styles.menuItem}`).forEach((el) => {
            el.removeAttribute('data-current');
        });

        target.setAttribute('data-current', 'true');
    }

    const onDataClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentPage('dataView');
        onAnyItemClick(e);
    }

    const onNozzlesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentPage('nozzles');
        onAnyItemClick(e);
    }

    const onLogsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentPage('logs');
        onAnyItemClick(e);
    }

    const onSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentPage('settings');
        onAnyItemClick(e);
    }

    const onStopClick = () => {
        setCurrentPage('menu');
        setCurrentJob(null);
    }

    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <div className={styles.wrapper}>
            <ToggleButton
                onStateChange={props.onActiveChange}
            />
            <span className={styles.follow}></span>
            <div className={styles.content}>
                <button className={styles.menuItem} data-current="true" onClick={onDataClick}><i className="icon-chart-bar"></i><span>{translate('Data')}</span></button>
                <button className={styles.menuItem} onClick={onNozzlesClick}><i className="icon-nozzle"></i><span>{translate('Nozzles')}</span></button>
                <button className={styles.menuItem} onClick={onLogsClick}><i className="icon-file-clock-outline"></i><span>{translate('Logs')}</span></button>
                <button className={styles.menuItem} onClick={onSettingsClick}><i className="icon-cog"></i><span>{translate('Settings')}</span></button>
            </div>
            <button className={styles.stopButton} onClick={onStopClick}><i className="icon-stop"></i><span>{translate('Stop')}</span></button>
        </div>
    )
});