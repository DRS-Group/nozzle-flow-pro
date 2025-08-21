import { useTranslate } from '../../hooks/useTranslate';
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
    const translate = useTranslate();

    useImperativeHandle(ref, () => ({

    }), []);

    const onYesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        props.onYesClick();
    };

    const onNoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
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
                        {translate('Yes')}
                    </button>
                    <button
                        onClick={onNoClick}
                        className={styles.button}
                    >
                        {translate('No')}
                    </button>
                </div>
            </div>
        </div>
    )
});