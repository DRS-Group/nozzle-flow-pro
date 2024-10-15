import { NavFunctionsContext } from '../../App';
import { DataFecherService } from '../../services/data-fetcher.service';
import { SettingsService } from '../../services/settings.service';
import styles from './menu.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type MenuElement = {

}

export type MenuProps = {
    onJobsClick: () => void;
    onNozzlesClick: () => void;
}

export const Menu = forwardRef<MenuElement, MenuProps>((props, ref) => {
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);
    const [logo, setLogo] = useState<string>('');

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        SettingsService.getLogoUri().then((logo) => {
            setLogo(logo);
        });
    }, []);

    const onJobsClick = () => {
        props.onJobsClick();
    }

    const onNozzlesClick = () => {
        props.onNozzlesClick();
    }

    const onSettingsClick = () => {
        setCurrentPage('settings');
    }

    return (
        <div className={styles.wrapper}>
            <img src={logo} className={styles.logo} />
            <div className={styles.itemsWrapper}>
                <div
                    className={styles.item}
                    onClick={onJobsClick}
                >
                    <img src="/images/briefcase.svg" />
                    <span>Jobs</span>
                </div>
                <div className={styles.item}
                    onClick={onNozzlesClick}
                >
                    <img src="/images/nozzle.svg" />
                    <span>Nozzles</span>
                </div>
                <div className={styles.item}
                    onClick={onSettingsClick}
                >
                    <img src="/images/settings.svg" />
                    <span>Settings</span>
                </div>
            </div>
        </div>
    )
});