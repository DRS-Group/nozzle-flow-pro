import { useTranslate } from '../../hooks/useTranslate';
import { SoundsService } from '../../services/sounds.service';
import { IEvent } from '../../types/event.type';
import styles from './alert-modal.module.css';
import { forwardRef, useEffect, useImperativeHandle } from 'react';

export type AlertModalElement = {

}

export type AlertModalProps = {
    event: IEvent;
    onOkClick?: () => void;
    onOkForAllClick?: () => void;
    totalEvents?: number;
}

export const AlertModal = forwardRef<AlertModalElement, AlertModalProps>((props, ref) => {
    const translate = useTranslate();

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        SoundsService.playAlertSound();

        const interval = setInterval(() => {
            SoundsService.playAlertSound();
        }, 650);

        return () => {
            clearInterval(interval);
        }

    }, [props.event]);

    const onOkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        props.onOkClick?.();
    };

    const onOkForAllClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        props.onOkForAllClick?.();
    };

    return (
        <div className={styles.alertModalBackground}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.event.title}</span>
                </div>
                <div className={styles.content}>
                    <span dangerouslySetInnerHTML={{ __html: props.event.description }}></span>
                </div>
                <div className={styles.footer}>
                    <button onClick={onOkClick}>{translate('Ok')}</button>
                    {props.totalEvents! > 1 &&
                        <button onClick={onOkForAllClick}>{translate('Ok for all')} ({props.totalEvents})</button>
                    }
                </div>
            </div>
        </div>
    )
});