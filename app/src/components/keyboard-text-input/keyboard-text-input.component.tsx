import styles from './keyboard-text-input.module.css';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

enum KeyboardKey {
    Q = 'Q',
    W = 'W',
    E = 'E',
    R = 'R',
    T = 'T',
    Y = 'Y',
    U = 'U',
    I = 'I',
    O = 'O',
    P = 'P',
    A = 'A',
    S = 'S',
    D = 'D',
    F = 'F',
    G = 'G',
    H = 'H',
    J = 'J',
    K = 'K',
    L = 'L',
    Z = 'Z',
    X = 'X',
    C = 'C',
    V = 'V',
    B = 'B',
    N = 'N',
    M = 'M',
    Shift = 'shift',
    Backspace = 'backspace',
    Space = 'space',
    Enter = 'enter',
    Numbers = 'numbers',
    Comma = ',',
    Period = '.'
}

export type KeyboardTextInputElement = {

}

export type KeyboardTextInputProps = {
    disabledKeys?: string[];
    onValueChange?: (value: string) => void;
    value?: string;
}

export const KeyboardTextInput = forwardRef<KeyboardTextInputElement, KeyboardTextInputProps>((props, ref) => {
    const [isShift, setIsShift] = useState(false);
    const [inputValue, setInputValue] = useState(props.value || '');

    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onKeyClick = (key: string) => {
        const nonCharacters = ['shift', 'backspace', 'space', 'enter', 'numbers'];
        if (nonCharacters.includes(key)) {
            switch (key) {
                case 'shift':
                    setIsShift(!isShift);
                    break;
                case 'backspace':
                    setInputValue(inputValue.slice(0, -1));
                    break;
                case 'space':
                    setInputValue(inputValue + ' ');
                    break;
                case 'enter':
                    break;
                case 'numbers':
                    break;
            }
            return;
        }
        else {
            setInputValue(inputValue + (isShift ? key.toUpperCase() : key.toLowerCase()));
            setIsShift(false);
        }
    }

    useEffect(() => {
        if (inputRef.current)
            inputRef.current.value = inputValue + '|';

        if (props.onValueChange)
            props.onValueChange(inputValue);
    }, [inputValue]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (inputRef.current) {
                if (inputRef.current.value[inputRef.current.value.length - 1] === '|')
                    inputRef.current.value = inputRef.current.value.slice(0, -1);
                else
                    inputRef.current.value += '|';
            }
        }, 750);
        return () => clearInterval(interval);
    }, []);

    const getKeyboardRow = (keys: KeyboardKey[]) => {
        return (
            <div className={styles.row}>
                {keys.map(key => {
                    let displayKey: string | JSX.Element = isShift && key.length === 1 ? key.toUpperCase() : key.toLowerCase();

                    if (key === KeyboardKey.Numbers)
                        displayKey = '123';

                    if (key === KeyboardKey.Backspace)
                        displayKey = <i className='icon-backspace' />;

                    if (key === KeyboardKey.Enter)
                        displayKey = <i className='icon-keyboard-return' />;

                    if (key === KeyboardKey.Shift && !isShift)
                        displayKey = <i className='icon-shift' />;

                    if (key === KeyboardKey.Shift && isShift)
                        displayKey = <i className='icon-caps' />;

                    return (
                        <button key={key} data-key={key} onClick={() => onKeyClick(key)} disabled={props.disabledKeys?.includes(key)}>{displayKey}</button>
                    )
                })}
            </div>
        )
    }

    return (
        <div className={styles.keyboardTextInput}>
            <input
                type="text"
                ref={inputRef}
                defaultValue={props.value}
            />
            <div className={styles.keyboard}>
                {getKeyboardRow([KeyboardKey.Q, KeyboardKey.W, KeyboardKey.E, KeyboardKey.R, KeyboardKey.T, KeyboardKey.Y, KeyboardKey.U, KeyboardKey.I, KeyboardKey.O, KeyboardKey.P])}
                {getKeyboardRow([KeyboardKey.A, KeyboardKey.S, KeyboardKey.D, KeyboardKey.F, KeyboardKey.G, KeyboardKey.H, KeyboardKey.J, KeyboardKey.K, KeyboardKey.L])}
                {getKeyboardRow([KeyboardKey.Shift, KeyboardKey.Z, KeyboardKey.X, KeyboardKey.C, KeyboardKey.V, KeyboardKey.B, KeyboardKey.N, KeyboardKey.M, KeyboardKey.Backspace])}
                {getKeyboardRow([KeyboardKey.Numbers, KeyboardKey.Comma, KeyboardKey.Space, KeyboardKey.Period, KeyboardKey.Enter])}
            </div>
        </div>
    )
});