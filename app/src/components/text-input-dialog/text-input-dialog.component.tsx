import { useTranslate } from '../../hooks/useTranslate';
import { KeyboardTextInput } from '../keyboard-text-input/keyboard-text-input.component';
import { TextInput, TextInputElement } from '../text-input/text-input.component';
import styles from './text-input-dialog.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

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
    const translate = useTranslate();

    const [inputValue, setInputValue] = useState(props.defaultValue || '');

    useImperativeHandle(ref, () => ({

    }), []);

    const onConfirmClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        props.onConfirmClick(inputValue);
    };

    const onCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        props.onCancelClick!();
    };

    const onValueChange = (value: string) => {
        setInputValue(value);
    }

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    {/* <TextInput
                        label={props.label}
                        className={styles.input}
                        ref={inputRef}
                        value={props.defaultValue}
                        type={props.type}
                    /> */}
                    <KeyboardTextInput
                        disabledKeys={['enter']}
                        onValueChange={onValueChange}
                        value={props.defaultValue}
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