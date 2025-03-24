import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './keyboard-number-input.module.css';

enum KeyboardKey {
    One = "1",
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Zero = "0",
    Backspace = 'backspace',
    Equals = '=',
    Plus = '+',
    Minus = '-',
    Asterisk = '*',
    Slash = '/',
    Period = '.',
    OpenParenthesis = '(',
    CloseParenthesis = ')',
}

export type KeyboardNumberInputElement = {
    setValue: (value: number) => void;
}

export type KeyboardNumberInputProps = {
    disabledKeys?: string[];
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    value?: number;
    unit?: string;
    decimals?: number;
}

export const KeyboardNumberInput = forwardRef<KeyboardNumberInputElement, KeyboardNumberInputProps>((props, ref) => {
    const [inputValue, setInputValue] = useState<string>(props.value?.toFixed(props.decimals || 0) || Number(0).toFixed(props.decimals || 0));
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        setValue: (value: number) => {
            setInputValue(value.toFixed(props.decimals || 0));
        }
    }), [setInputValue]);

    const formatNumber = (value: string) => {
        value = value.replace(/[^0-9]/g, '');
        let numberValue = Number(value) / Math.pow(10, props.decimals || 0);
        return numberValue.toFixed(props.decimals || 0)
    }

    const onKeyClick = (key: string) => {
        let oldValue = inputValue;
        oldValue = oldValue.replace(/[^0-9]/g, '');

        let newValue = '';
        switch (key) {
            case KeyboardKey.Backspace:
                newValue = oldValue.slice(0, -1);
                break;
            case KeyboardKey.Equals:
                newValue = eval(oldValue).toString();
                break;
            default:
                newValue = oldValue + key;
                break;
        }

        newValue = newValue || Number(0).toFixed(props.decimals || 0);

        newValue = formatNumber(newValue);

        setInputValue(newValue);
    }

    useEffect(() => {
        if (inputRef.current)
            inputRef.current.value = inputValue;

        if (props.onValueChange)
            props.onValueChange(Number(inputValue));
    }, [inputValue]);


    return (
        <div className={styles.keyboardNumberInput}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    ref={inputRef}
                    defaultValue={formatNumber((props.value || 0).toString())}
                    disabled={props.disabled}
                    inputMode='none'
                />
                <span>{props.unit}</span>
            </div>
            <div className={styles.keyboard}>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Plus} onClick={() => onKeyClick(KeyboardKey.Plus)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Plus)}>+</button>
                    <button data-key={KeyboardKey.One} onClick={() => onKeyClick(KeyboardKey.One)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.One)}>1</button>
                    <button data-key={KeyboardKey.Two} onClick={() => onKeyClick(KeyboardKey.Two)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Two)}>2</button>
                    <button data-key={KeyboardKey.Three} onClick={() => onKeyClick(KeyboardKey.Three)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Three)}>3</button>
                    <button data-key={KeyboardKey.OpenParenthesis} onClick={() => onKeyClick(KeyboardKey.OpenParenthesis)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.OpenParenthesis)}>(</button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Minus} onClick={() => onKeyClick(KeyboardKey.Minus)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Minus)}>-</button>
                    <button data-key={KeyboardKey.Four} onClick={() => onKeyClick(KeyboardKey.Four)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Four)}>4</button>
                    <button data-key={KeyboardKey.Five} onClick={() => onKeyClick(KeyboardKey.Five)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Five)}>5</button>
                    <button data-key={KeyboardKey.Six} onClick={() => onKeyClick(KeyboardKey.Six)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Six)}>6</button>
                    <button data-key={KeyboardKey.CloseParenthesis} onClick={() => onKeyClick(KeyboardKey.CloseParenthesis)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.CloseParenthesis)}>)</button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Asterisk} onClick={() => onKeyClick(KeyboardKey.Asterisk)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Asterisk)}>*</button>
                    <button data-key={KeyboardKey.Seven} onClick={() => onKeyClick(KeyboardKey.Seven)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Seven)}>7</button>
                    <button data-key={KeyboardKey.Eight} onClick={() => onKeyClick(KeyboardKey.Eight)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Eight)}>8</button>
                    <button data-key={KeyboardKey.Nine} onClick={() => onKeyClick(KeyboardKey.Nine)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Nine)}>9</button>
                    <button data-key={KeyboardKey.Backspace} onClick={() => onKeyClick(KeyboardKey.Backspace)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Backspace)}><i className='icon-backspace' /></button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Slash} onClick={() => onKeyClick(KeyboardKey.Slash)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Slash)}>/</button>
                    <button data-key={KeyboardKey.Period} onClick={() => onKeyClick(KeyboardKey.Period)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Period)}>.</button>
                    <button data-key={KeyboardKey.Zero} onClick={() => onKeyClick(KeyboardKey.Zero)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Zero)}>0</button>
                    <button data-key={KeyboardKey.Equals} onClick={() => onKeyClick(KeyboardKey.Equals)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Equals)}>=</button>
                </div>
            </div>
        </div>
    );
})