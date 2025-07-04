import { HexColorPicker } from 'react-colorful';
import styles from './color-input-dialog.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, TextInputElement } from '../text-input/text-input.component';
import { useTranslate } from '../../hooks/useTranslate';

export type ColorInputDialogElement = {

}

export type ColorInputDialogProps = {
    label: string,
    title: string,
    defaultValue?: string;
    onConfirmClick: (color: string) => void,
    onCancelClick: () => void
}

export const ColorInputDialog = forwardRef<ColorInputDialogElement, ColorInputDialogProps>((props, ref) => {
    const translate = useTranslate();
    const [color, setColor] = useState(props.defaultValue || '#000000');
    const hexInputRef = useRef<TextInputElement>(null);
    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        hexInputRef.current?.setValue(color);
    }, [color]);

    const onConfirmClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        props.onConfirmClick(color);
    };

    const onCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        props.onCancelClick();
    };

    const onTextInputChange = (value: string) => {
        setColor(value);
    }

    return (
        <div className={styles.background}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <span>{props.title}</span>
                </div>
                <div className={styles.content}>
                    <HexColorPicker color={color} onChange={setColor} style={{ width: '12rem', height: '12rem' }} />
                    <div className={styles.inputs}>
                        <TextInput label={translate('Hex')} value={color} ref={hexInputRef} onChange={onTextInputChange} />
                        <div className={styles.color} style={{ backgroundColor: color }}></div>
                    </div>
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