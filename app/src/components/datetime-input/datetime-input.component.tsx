import styles from './datetime-input.module.css';
import { forwardRef, useImperativeHandle } from 'react';

export type DateTimeInputElement = {

}

export type DateTimeInputProps = {
    label: string;
    className?: string;
    disabled?: boolean;
    value?: string;
}

export const DateTimeInput = forwardRef<DateTimeInputElement, DateTimeInputProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <div className={`${styles.wrapper} ${props.className}`}>
            <input
                className={styles.input}
                type='datetime-local'
                placeholder=' '
                disabled={props.disabled}
                defaultValue={props.value}
            />
            <label className={styles.label}>{props.label}</label>
        </div>
    )
});