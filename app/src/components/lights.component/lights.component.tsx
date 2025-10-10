import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import styles from './lights.module.css';
import { usePump } from '../../hooks/usePump';
import { useData } from '../../hooks/useData';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { YesNoDialog } from '../yes-no-dialog/yes-no-dialog.component';
import { useTranslate } from '../../hooks/useTranslate';
import { services } from '../../dependency-injection';
import { IOpticalSensor } from '../../types/optical-sensor';
import { SettingsService } from '../../services/settings.service';

export type LightsElement = {

}

export type LightsProps = {}

export const Lights = forwardRef<LightsElement, LightsProps>((props, ref) => {
    const data = useData();
    const currentJob = useCurrentJob();

    useImperativeHandle(ref, () => ({

    }), []);

    return (
        <>
            {currentJob.job &&
                <div className={styles.wrapper}>
                    {data.opticalSensors && data.opticalSensors.map((opticalSensor, index) =>
                        <Light
                            key={index}
                            opticalSensorIndex={index}
                        />
                    )}
                </div>
            }
        </>
    )
});

type LightElement = {

}

type LightProps = {
    opticalSensorIndex: number;
}

export const Light = forwardRef<LightElement, LightProps>((props, ref) => {
    const translate = useTranslate();
    const pump = usePump();
    const data = useData();
    const [opticalSensor, setOpticalSensor] = useState<IOpticalSensor>(data.opticalSensors[props.opticalSensorIndex]);

    const [ignoreSensorDialogOpen, setIgnoreSensorDialogOpen] = useState<boolean>(false);
    const [unignoreSensorDialogOpen, setUnignoreSensorDialogOpen] = useState<boolean>(false);
    const [color, setColor] = useState<'black' | 'green' | 'yellow' | 'red' | 'redPulse'>('black');

    useLayoutEffect(() => {
        setOpticalSensor(data.opticalSensors[props.opticalSensorIndex]);
    }, [data.opticalSensors, props.opticalSensorIndex]);

    useImperativeHandle(ref, () => ({

    }), []);

    const lightRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (!opticalSensor) return;
        if (!pump.isStabilized)
            setColor('black');
        else if (opticalSensor.lastPulseAge > SettingsService.getTimeBeforeAlert() * 2 || opticalSensor.lastPulseAge === 0) {
            if (pump.pumpState === 'off')
                setColor('red');
            else
                setColor('redPulse');
        }
        else if (opticalSensor.lastPulseAge > SettingsService.getTimeBeforeAlert())
            setColor('yellow')
        else
            setColor('green');

    }, [opticalSensor, pump.pumpState, pump.isStabilized]);

    return (
        <>
            {opticalSensor &&
                <div
                    className={` ${styles.lightWrapper}`}
                    onClick={() => {
                        if (opticalSensor.ignored)
                            setUnignoreSensorDialogOpen(true);
                        else
                            setIgnoreSensorDialogOpen(true);
                    }}
                    data-ignored={opticalSensor.ignored}
                >
                    <div ref={lightRef} className={`${styles.light}`} data-color={color} />
                    <span>{opticalSensor.name}</span>
                </div>
            }

            {ignoreSensorDialogOpen &&
                <YesNoDialog
                    title={`${translate('Ignore')} ${opticalSensor.name}`}
                    message={translate('Are you sure you want to ignore this sensor?')}
                    onYesClick={() => {
                        opticalSensor.ignored = true;
                        services.sensorsService.updateOpticalSensor(opticalSensor, props.opticalSensorIndex);

                        setIgnoreSensorDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreSensorDialogOpen(false);
                    }}
                />
            }
            {unignoreSensorDialogOpen &&
                <YesNoDialog
                    title={`${translate('Unignore')} ${opticalSensor.name}`}
                    message={translate('Are you sure you want to unignore this sensor?')}
                    onYesClick={() => {
                        opticalSensor.ignored = false;
                        services.sensorsService.updateOpticalSensor(opticalSensor, props.opticalSensorIndex)

                        setUnignoreSensorDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setUnignoreSensorDialogOpen(false);
                    }}
                />
            }
        </>
    )
});