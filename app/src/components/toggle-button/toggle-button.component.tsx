import { usePump } from '../../hooks/usePump';
import { SoundsService } from '../../services/sounds.service';
import styles from './toggle-button.module.css';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export type ToggleButtonElement = {

}

export type ToggleButtonProps = {
    state?: "on" | "off" | "auto";
    onStateChange: (state: "on" | "off" | "auto") => void;
}

export const ToggleButton = forwardRef<ToggleButtonElement, ToggleButtonProps>((props, ref) => {
    const [buttonState, setButtonState] = useState<"on" | "off" | "auto">(props.state || "auto");
    const [timeoutHandle, setTimeoutHandle] = useState<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        setButtonState(props.state || "auto");
    }, [props.state]);

    const { pumpState } = usePump();

    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        SoundsService.playClickSound();
        const timer = setTimeout(() => {
            SoundsService.playClickSound();

            if (buttonState !== "auto") {
                setButtonState("auto");
                props.onStateChange("auto");
            }
            else {
                setButtonState("off");
                props.onStateChange("off");
            }
        }, 1000);

        setTimeoutHandle(timer);
    }

    const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        clearTimeout(timeoutHandle!);
    }

    const onClick = () => {
        if (buttonState === "off") {
            setButtonState("on");
            props.onStateChange("on");
        }
        else if (buttonState === "on") {
            setButtonState("off");
            props.onStateChange("off");
        }
    }

    const getLabel = () => {
        switch (buttonState) {
            case "off":
                return "Off";
            case "on":
                return "On";
            case "auto":
                return "Auto";
        }
    }

    return (
        <div
            className={styles.toggleButton}
            data-state={buttonState}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={onClick}
        >
            <div className={styles.light} data-pumpState={pumpState}></div>
            <span className={styles.label}>{getLabel()}</span>
        </div>
    )
});