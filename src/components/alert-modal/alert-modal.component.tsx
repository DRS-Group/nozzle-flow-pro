import { SoundsService } from '../../services/sounds.service';
import { Event } from '../../types/event.type';
import styles from './alert-modal.module.css';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export type AlertModalElement = {

}

export type AlertModalProps = {
    event: Event;
    onOkClick?: () => void;
    onOkForAllClick?: () => void;
    totalEvents?: number;
}

export const AlertModal = forwardRef<AlertModalElement, AlertModalProps>((props, ref) => {
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

    return (
        <div className={styles.alertModalBackground}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.event.title}</span>
                </div>
                <div className={styles.content}>
                    <span>{props.event.getModalMessage}</span>
                </div>
                <div className={styles.footer}>
                    <button onClick={props.onOkClick}>Ok</button>
                    {props.totalEvents! > 1 &&
                        <button onClick={props.onOkForAllClick}>Ok for all ({props.totalEvents})</button>
                    }
                </div>
            </div>
        </div>
    )
});