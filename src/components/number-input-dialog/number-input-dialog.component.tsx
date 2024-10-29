import styles from './number-input-dialog.module.css';
import { NumberInput, NumberInputElement } from '../number-input/number-input.component';
import { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { useTranslate } from '../../App';
import { TranslationServices } from '../../services/translations.service';

export type NumberInputDialogElement = {

}

export type NumberInputDialogProps = {
    label: string,
    title: string,
    onConfirmClick: (value: number) => void,
    onCancelClick: () => void
}

export const NumberInputDialog = forwardRef<NumberInputDialogElement, NumberInputDialogProps>((props, ref) => {
    const translate = useTranslate();
    const inputRef = useRef<NumberInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onConfirmClick = () => {
        const value = parseFloat(inputRef.current!.getValue());
        props.onConfirmClick(value);
    };

    const onCancelClick = () => {
        props.onCancelClick();
    };

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    <NumberInput
                        label={props.label}
                        className={styles.input}
                        ref={inputRef}
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