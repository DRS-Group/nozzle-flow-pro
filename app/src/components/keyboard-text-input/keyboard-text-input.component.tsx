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
    Period = '.',
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Eight = '8',
    Nine = '9',
    Zero = '0',
    At = '@',
    Hash = '#',
    Dollar = '$',
    Underscore = '_',
    Ampersand = '&',
    Minus = '-',
    Plus = '+',
    OpenParenthesis = '(',
    CloseParenthesis = ')',
    ForwardSlash = '/',
    Asterisk = '*',
    DoubleQuote = '"',
    SingleQuote = "'",
    Colon = ':',
    Semicolon = ';',
    Exclamation = '!',
    Question = '?',
    NormalKeyboard = 'normal',
}

export type KeyboardTextInputElement = {

}

export type KeyboardTextInputProps = {
    disabledKeys?: string[];
    onValueChange?: (value: string) => void;
    value?: string;
}

export const KeyboardTextInput = forwardRef<KeyboardTextInputElement, KeyboardTextInputProps>((props, ref) => {
    const [currentKeyboard, setCurrentKeyboard] = useState<'normal' | 'symbols'>('normal');

    const [shiftState, setShiftState] = useState<'normal' | 'shift' | 'caps'>('normal');
    const [shiftTimeout, setShiftTimeout] = useState<NodeJS.Timeout | null>(null);

    const [inputValue, setInputValue] = useState(props.value || '');

    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const onKeyClick = (key: string) => {
        const nonCharacters = ['shift', 'backspace', 'space', 'enter', 'numbers', 'normal'];
        if (nonCharacters.includes(key)) {
            switch (key) {
                case 'shift':
                    if (shiftState === 'normal') {
                        setShiftState('shift');
                        setShiftTimeout(setTimeout(() => {
                            clearTimeout(shiftTimeout!);
                            setShiftTimeout(null);
                        }, 250));
                    }
                    else if (shiftState === 'shift' && shiftTimeout) {
                        clearTimeout(shiftTimeout);
                        setShiftTimeout(null);
                        setShiftState('caps');
                    }
                    else if (shiftState === 'caps' || shiftState === 'shift') {
                        setShiftState('normal');
                    }
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
                    setCurrentKeyboard(currentKeyboard === 'normal' ? 'symbols' : 'normal');
                    break;
                case 'normal':
                    setCurrentKeyboard('normal');
                    break;
            }
            return;
        }
        else {
            setInputValue(inputValue + (['shift', 'caps'].includes(shiftState) ? key.toUpperCase() : key.toLowerCase()));
            if (shiftState === 'shift')
                setShiftState('normal');
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

    const getKeyboardRow = (keys: KeyboardKey[] | KeyboardKey[]) => {
        return (
            <div className={styles.row}>
                {keys.map(key => {
                    let displayKey: string | JSX.Element = ['shift', 'caps'].includes(shiftState) && key.length === 1 ? key.toUpperCase() : key.toLowerCase();

                    if (key === KeyboardKey.Numbers)
                        displayKey = '123';

                    if (key === KeyboardKey.NormalKeyboard)
                        displayKey = 'ABC';

                    if (key === KeyboardKey.Backspace)
                        displayKey = <i className='icon-backspace' />;

                    if (key === KeyboardKey.Enter)
                        displayKey = <i className='icon-keyboard-return' />;

                    if (key === KeyboardKey.Shift && shiftState === 'normal')
                        displayKey = <i className='icon-shift-normal' />;

                    if (key === KeyboardKey.Shift && shiftState === 'shift')
                        displayKey = <i className='icon-shift-shifted' />;

                    if (key === KeyboardKey.Shift && shiftState === 'caps')
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
                {currentKeyboard === 'normal' &&
                    <>
                        {getKeyboardRow([KeyboardKey.Q, KeyboardKey.W, KeyboardKey.E, KeyboardKey.R, KeyboardKey.T, KeyboardKey.Y, KeyboardKey.U, KeyboardKey.I, KeyboardKey.O, KeyboardKey.P])}
                        {getKeyboardRow([KeyboardKey.A, KeyboardKey.S, KeyboardKey.D, KeyboardKey.F, KeyboardKey.G, KeyboardKey.H, KeyboardKey.J, KeyboardKey.K, KeyboardKey.L])}
                        {getKeyboardRow([KeyboardKey.Shift, KeyboardKey.Z, KeyboardKey.X, KeyboardKey.C, KeyboardKey.V, KeyboardKey.B, KeyboardKey.N, KeyboardKey.M, KeyboardKey.Backspace])}
                        {getKeyboardRow([KeyboardKey.Numbers, KeyboardKey.Comma, KeyboardKey.Space, KeyboardKey.Period, KeyboardKey.Enter])}
                    </>
                }
                {currentKeyboard === 'symbols' &&
                    <>
                        {getKeyboardRow([KeyboardKey.One, KeyboardKey.Two, KeyboardKey.Three, KeyboardKey.Four, KeyboardKey.Five, KeyboardKey.Six, KeyboardKey.Seven, KeyboardKey.Eight, KeyboardKey.Nine, KeyboardKey.Zero])}
                        {getKeyboardRow([KeyboardKey.At, KeyboardKey.Hash, KeyboardKey.Dollar, KeyboardKey.Underscore, KeyboardKey.Ampersand, KeyboardKey.Minus, KeyboardKey.Plus, KeyboardKey.OpenParenthesis, KeyboardKey.CloseParenthesis, KeyboardKey.ForwardSlash])}
                        {getKeyboardRow([KeyboardKey.Asterisk, KeyboardKey.DoubleQuote, KeyboardKey.SingleQuote, KeyboardKey.Colon, KeyboardKey.Semicolon, KeyboardKey.Exclamation, KeyboardKey.Question, KeyboardKey.Backspace])}
                        {getKeyboardRow([KeyboardKey.NormalKeyboard, KeyboardKey.Comma, KeyboardKey.Space, KeyboardKey.Period, KeyboardKey.Enter])}
                    </>
                }
            </div>
        </div>
    )
});