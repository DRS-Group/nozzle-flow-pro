import { forwardRef, useContext, useImperativeHandle, useState } from "react"
import styles from './side-menu.module.css';
import { ToggleButton } from "../toggle-button/toggle-button.component";
import { JobContext, NavFunctionsContext } from "../../App";

export type SideMenuElement = {

}

export type SideMenuProps = {

}

export const SideMenu = forwardRef<SideMenuElement, SideMenuProps>((props, ref) => {
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);
    const { currentJob, setCurrentJob } = useContext(JobContext);

    const [followTranslateX, setFollowTranslateX] = useState('0vw');

    const onAnyItemClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget;
        setFollowTranslateX(`${target.offsetLeft + target.offsetWidth / 2}px`);
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

    const onStopClick = () => {
        setCurrentJob(null);
        setCurrentPage('menu');
    }

    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <div className={styles.wrapper} style={{
            "--translateX": followTranslateX
        } as React.CSSProperties}>
            <ToggleButton />
            <span className={styles.follow}></span>
            <div className={styles.content}>
                <button className={styles.menuItem} data-current="true" onClick={onDataClick}><i className="icon-chart-bar"></i><span>Data</span></button>
                <button className={styles.menuItem} onClick={onNozzlesClick}><i className="icon-nozzle"></i><span>Nozzles</span></button>
                <button className={styles.menuItem} onClick={onAnyItemClick}><i className="icon-file-clock-outline"></i><span>Logs</span></button>
                <button className={styles.menuItem} onClick={onAnyItemClick}><i className="icon-cog"></i><span>Settings</span></button>
            </div>
            <button className={styles.stopButton} onClick={onStopClick}><i className="icon-stop"></i><span>Stop</span></button>
        </div>
    )
});