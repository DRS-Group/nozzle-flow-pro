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
    onCancelClick: () => void
}

export const TextInputDialog = forwardRef<TextInputDialogElement, TextInputDialogProps>((props, ref) => {
    const inputRef = useRef<TextInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onConfirmClick = () => {
        const name = inputRef.current!.getValue();
        props.onConfirmClick(name);
    };

    const onCancelClick = () => {
        props.onCancelClick();
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
                    />
                </div>
                <div className={styles.footer}>
                    <button
                        onClick={onConfirmClick}
                        className={styles.button}
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancelClick}
                        className={styles.button}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
});