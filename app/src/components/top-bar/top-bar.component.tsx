import styles from './top-bar.module.css';
import { forwardRef, useImperativeHandle } from 'react';

export type TopBarElement = {

}

export type TopBarProps = {
    onBackClick: () => void;
    title: string;
}

export const TopBar = forwardRef<TopBarElement, TopBarProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const onBackClick = () => {
        props.onBackClick();
    }

    return (
        <div className={styles.header}>
            <div
                className={styles.backButton}
                onClick={onBackClick}
            >
                <i className='icon-arrow-left'></i>
            </div>
            <span className={styles.title}>{props.title}</span>
        </div>
    )
});