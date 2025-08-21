import { useTranslate } from '../../hooks/useTranslate';
import { TextInputDialog } from '../text-input-dialog/text-input-dialog.component';
import styles from './text-input.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type TextInputElement = {
    getValue: () => string;
    focus: () => void;
    setValue: (value: string) => void;
}

export type TextInputProps = {
    label: string;
    className?: string;
    disabled?: boolean;
    value?: string;
    onChange?: (value: string) => void;
    type?: 'text' | 'password';
}

export const TextInput = forwardRef<TextInputElement, TextInputProps>((props, ref) => {
    const translate = useTranslate();
    const inputRef = useRef<HTMLInputElement>(null);

    const [isTextInputModalOpen, setIsTextInputModalOpen] = useState(false);

    useEffect(() => {
        if (props.value) {
            inputRef.current!.value = props.value;
        }
    }, [props.value]);

    useImperativeHandle(ref, () => ({
        getValue: () => {
            return inputRef.current?.value || '';
        },
        focus: () => {
            inputRef.current?.focus();
        },
        setValue: (value: string) => {
            inputRef.current!.value = value;
        }
    }), []);

    return (
        <>
            <div className={`${styles.wrapper} ${props.className}`}>
                <input
                    className={styles.input}
                    type={props.type || 'text'}
                    placeholder=' '
                    disabled={props.disabled}
                    ref={inputRef}
                    defaultValue={props.value || ''}
                    onChange={(e) => props.onChange?.(e.target.value)}
                    readOnly={true}
                    onClick={() => {
                        setIsTextInputModalOpen(true);
                    }}
                />
                <label className={styles.label}>{props.label}</label>
            </div>
            {isTextInputModalOpen &&
                <TextInputDialog
                    title={props.label}
                    label={props.label}
                    onConfirmClick={(value: string) => {
                        inputRef.current!.value = value;
                        setIsTextInputModalOpen(false);
                    }}
                    onCancelClick={() => {
                        setIsTextInputModalOpen(false);
                    }}
                    defaultValue={props.value}
                />
            }
        </>
    )
});