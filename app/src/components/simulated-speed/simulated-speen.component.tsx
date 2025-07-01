import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styles from './simulated-speed.module.css';
import { SettingsService } from '../../services/settings.service';

export type SimulatedSpeedElement = {

}

export type SimulatedSpeedProps = {

}

export const SimulatedSpeed = forwardRef<SimulatedSpeedElement, SimulatedSpeedProps>((props, ref) => {

    const [speed, setSpeed] = useState<number>(0);
    const rangeRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setSpeed(value);
        SettingsService.setSimulatedSpeed(value);
    };

    useEffect(() => {
        SettingsService.getSimulatedSpeed().then((value) => {
            rangeRef.current!.value = value.toString();
            setSpeed(value);
        });
    }, []);

    return (
        <div className={styles.wrapper}>
            <div className={styles.speed}>
                <span className={styles.value}>{speed.toFixed(1)}</span>
                <span className={styles.unit}> km/h</span>
            </div>
            <input ref={rangeRef} type="range" min="0" max="16" step="0.5" className={styles.range} onChange={handleSpeedChange} />
        </div>
    );
})