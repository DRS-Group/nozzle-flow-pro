import styles from './text-input.module.css';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export type TextInputElement = {
    getValue: () => string;
    focus: () => void;
}

export type TextInputProps = {
    label: string;
    className?: string;
    disabled?: boolean;
    value?: string;
}

export const TextInput = forwardRef<TextInputElement, TextInputProps>((props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        getValue: () => {
            return inputRef.current?.value || '';
        },
        focus: ()=>{
            inputRef.current?.focus();
        }
    }), []);

    return (
        <div className={`${styles.wrapper} ${props.className}`}>
            <input
                className={styles.input}
                type='text'
                placeholder=' '
                disabled={props.disabled}
                ref={inputRef}
                defaultValue={props.value}
            />
            <label className={styles.label}>{props.label}</label>
        </div>
    )
});