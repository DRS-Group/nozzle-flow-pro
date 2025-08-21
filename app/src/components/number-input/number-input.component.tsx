import { NumberInputDialog } from '../number-input-dialog/number-input-dialog.component';
import styles from './number-input.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type NumberInputElement = {
    getValue: () => string;
}

export type NumberInputProps = {
    label: string;
    className?: string;
    disabled?: boolean;
    value?: number;
    decimals?: number;
    unit?: string;
}

export const NumberInput = forwardRef<NumberInputElement, NumberInputProps>((props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isNumberInputModalOpen, setIsNumberInputModalOpen] = useState(false);

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
        <>
            <div className={`${styles.wrapper} ${props.className}`}>
                <input
                    className={styles.input}
                    type='number'
                    placeholder=' '
                    disabled={props.disabled}
                    ref={inputRef}
                    defaultValue={formatNumber((Number(props.value || '0') * Math.pow(10, props.decimals || 0)).toString())}
                    onInput={onInput}
                    readOnly={true}
                    onPointerDown={() => {
                        setIsNumberInputModalOpen(true);
                    }}
                />
                <label className={styles.label}>{props.label}</label>
            </div>
            {isNumberInputModalOpen &&
                <NumberInputDialog
                decimals={props.decimals}
                    unit={props.unit}
                    label={props.label}
                    title={props.label}
                    defaultValue={props.value}
                    onConfirmClick={(value) => {
                        inputRef.current!.value = formatNumber((value * Math.pow(10, props.decimals || 0)).toString());
                        setIsNumberInputModalOpen(false);
                    }}
                    onCancelClick={() => {
                        setIsNumberInputModalOpen(false);
                    }}
                />
            }
        </>
    )
});