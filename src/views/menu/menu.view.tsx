import styles from './menu.module.css';
import { forwardRef, useImperativeHandle } from 'react';

export type MenuElement = {

}

export type MenuProps = {
    onJobsClick: () => void;
}

export const Menu = forwardRef<MenuElement, MenuProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const onJobsClick = () => {
        props.onJobsClick();
    }

    return (
        <div className={styles.wrapper}>
            <img src='/images/logo_drs.png' className={styles.logo} />
            <div className={styles.itemsWrapper}>
                <div
                    className={styles.item}
                    onClick={onJobsClick}
                >
                    <img src="/images/briefcase.svg" />
                    <span>Jobs</span>
                </div>
                <div className={styles.item}>
                    <img src="/images/nozzle.svg" />
                    <span>Nozzles</span>
                </div>
                <div className={styles.item}>
                    <img src="/images/settings.svg" />
                    <span>Settings</span>
                </div>
            </div>
        </div>
    )
});