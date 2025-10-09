import styles from './number-input-dialog.module.css';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslate } from '../../hooks/useTranslate';
import { KeyboardNumberInput } from '../keyboard-number-input/keyboard-number-input.component';

export type NumberInputDialogElement = {

}

export type NumberInputDialogProps = {
    label: string,
    title: string,
    onConfirmClick: (value: number) => void,
    onCancelClick: () => void,
    defaultValue?: number,
    unit?: string
    decimals?: number
}

export const NumberInputDialog = forwardRef<NumberInputDialogElement, NumberInputDialogProps>((props, ref) => {
    const translate = useTranslate();

    const [inputValue, setInputValue] = useState(props.defaultValue || 0);

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
        props.onCancelClick();
    };

    const onValueChange = (value: number) => {
        setInputValue(value);
    }

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    {/* <NumberInput
                        label={props.label}
                        className={styles.input}
                        ref={inputRef}
                        value={props.defaultValue}
                    /> */}
                    <KeyboardNumberInput
                        decimals={props.decimals}
                        disabledKeys={['+', '-', '*', '/', '(', ')', '=', '.']}
                        onValueChange={onValueChange}
                        value={props.defaultValue}
                        unit={props.unit}
                    />
                </div>
                <div className={styles.footer}>
                    <button
                        onClick={onConfirmClick}
                        className={styles.button}
                    >
                        {translate('Confirm')}
                    </button>
                    <button
                        onClick={onCancelClick}
                        className={styles.button}
                    >
                        {translate('Cancel')}
                    </button>
                </div>
            </div>
        </div>
    )
});