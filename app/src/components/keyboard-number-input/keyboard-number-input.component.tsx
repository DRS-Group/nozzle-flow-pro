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

    const onKeyClick = (e: React.PointerEvent<HTMLButtonElement>, key: string) => {
        e.preventDefault();
        e.stopPropagation();

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
                    <button data-key={KeyboardKey.Plus} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Plus)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Plus)}>+</button>
                    <button data-key={KeyboardKey.One} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.One)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.One)}>1</button>
                    <button data-key={KeyboardKey.Two} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Two)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Two)}>2</button>
                    <button data-key={KeyboardKey.Three} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Three)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Three)}>3</button>
                    <button data-key={KeyboardKey.OpenParenthesis} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.OpenParenthesis)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.OpenParenthesis)}>(</button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Minus} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Minus)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Minus)}>-</button>
                    <button data-key={KeyboardKey.Four} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Four)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Four)}>4</button>
                    <button data-key={KeyboardKey.Five} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Five)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Five)}>5</button>
                    <button data-key={KeyboardKey.Six} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Six)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Six)}>6</button>
                    <button data-key={KeyboardKey.CloseParenthesis} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.CloseParenthesis)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.CloseParenthesis)}>)</button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Asterisk} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Asterisk)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Asterisk)}>*</button>
                    <button data-key={KeyboardKey.Seven} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Seven)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Seven)}>7</button>
                    <button data-key={KeyboardKey.Eight} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Eight)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Eight)}>8</button>
                    <button data-key={KeyboardKey.Nine} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Nine)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Nine)}>9</button>
                    <button data-key={KeyboardKey.Backspace} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Backspace)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Backspace)}><i className='icon-backspace' /></button>
                </div>
                <div className={styles.row}>
                    <button data-key={KeyboardKey.Slash} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Slash)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Slash)}>/</button>
                    <button data-key={KeyboardKey.Period} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Period)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Period)}>.</button>
                    <button data-key={KeyboardKey.Zero} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Zero)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Zero)}>0</button>
                    <button data-key={KeyboardKey.Equals} onPointerDown={(e: React.PointerEvent<HTMLButtonElement>) => onKeyClick(e, KeyboardKey.Equals)} disabled={props.disabled || props.disabledKeys?.includes(KeyboardKey.Equals)}>=</button>
                </div>
            </div>
        </div>
    );
})