import styles from './yes-no-dialog.module.css';
import { forwardRef, useImperativeHandle } from 'react';

export type DialogElement = {

}

export type DialogProps = {
    message: string,
    title: string,
    onYesClick: () => void,
    onNoClick: () => void
}

export const YesNoDialog = forwardRef<DialogElement, DialogProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const onYesClick = () => {
        props.onYesClick();
    };

    const onNoClick = () => {
        props.onNoClick();
    };

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    <span>{props.message}</span>
                </div>
                <div className={styles.footer}>
                    <button
                        onClick={onYesClick}
                        className={styles.button}
                    >
                        Yes
                    </button>
                    <button
                        onClick={onNoClick}
                        className={styles.button}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    )
});