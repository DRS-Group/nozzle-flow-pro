import styles from './number-input.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type NumberInputElement = {
    getValue: () => string;
}

export type NumberInputProps = {
    label: string;
    className?: string;
    disabled?: boolean;
    value?: string;
    decimals?: number;
}

export const NumberInput = forwardRef<NumberInputElement, NumberInputProps>((props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        getValue: () => {
            return inputRef.current?.value || '';
        }
    }), []);

    const onInput = (event: React.FormEvent<HTMLInputElement>) => {
        const value: string = formatNumber((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).value = value;

        (event.target as HTMLInputElement).type = 'text';
        (event.target as HTMLInputElement).setSelectionRange(value.length, value.length);
        (event.target as HTMLInputElement).type = 'number';
    }

    const formatNumber = (value: string) => {
        return ((Number(value.replace(/[^0-9]/g, '')) / Math.pow(10, props.decimals || 0)).toFixed(props.decimals || 0)).toString();
    }

    return (
        <div className={`${styles.wrapper} ${props.className}`}>
            <input
                className={styles.input}
                type='number'
                placeholder=' '
                disabled={props.disabled}
                ref={inputRef}
                defaultValue={formatNumber((Number(props.value || '0') * Math.pow(10, props.decimals || 0)).toString())}
                onInput={onInput}
            />
            <label className={styles.label}>{props.label}</label>
        </div>
    )
});