import { useTranslate } from '../../hooks/useTranslate';
import { TextInput, TextInputElement } from '../text-input/text-input.component';
import styles from './text-input-dialog.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type TextInputDialogElement = {

}

export type TextInputDialogProps = {
    label: string,
    title: string,
    defaultValue?: string;
    onConfirmClick: (value: string) => void,
    onCancelClick?: () => void,
    type?: 'text' | 'password';
}

export const TextInputDialog = forwardRef<TextInputDialogElement, TextInputDialogProps>((props, ref) => {
    const inputRef = useRef<TextInputElement>(null);
    const translate = useTranslate();

    useImperativeHandle(ref, () => ({

    }), []);

    const onConfirmClick = () => {
        const name = inputRef.current!.getValue();
        props.onConfirmClick(name);
    };

    const onCancelClick = () => {
        props.onCancelClick!();
    };

    useEffect(() => {
        inputRef?.current?.focus();
    })

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    <TextInput
                        label={props.label}
                        className={styles.input}
                        ref={inputRef}
                        value={props.defaultValue}
                        type={props.type}
                    />
                </div>
                <div className={styles.footer}>
                    <button
                        onClick={onConfirmClick}
                        className={styles.button}
                    >
                        {translate('Confirm')}
                    </button>
                    {
                        props.onCancelClick &&
                        <button
                            onClick={onCancelClick}
                            className={styles.button}
                        >
                            {translate('Cancel')}
                        </button>
                    }
                </div>
            </div>
        </div>
    )
});