import { ContextMenu, ContextMenuItem } from '../../components/context-menu/context-menu.component';
import { NumberInputDialog } from '../../components/number-input-dialog/number-input-dialog.component';
import { TextInputDialog } from '../../components/text-input-dialog/text-input-dialog.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { YesNoDialog } from '../../components/yes-no-dialog/yes-no-dialog.component';
import { services } from '../../dependency-injection';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useNavigation } from '../../hooks/useNavigation';
import { usePump } from '../../hooks/usePump';
import { useTranslate } from '../../hooks/useTranslate';
import { SettingsService } from '../../services/settings.service';
import { ESPData } from '../../types/ESP-data.type';
import { IFlowmeterSensor } from '../../types/flowmeter-sensor';
import { IOpticalSensor } from '../../types/optical-sensor';
import { ISensor } from '../../types/sensor';
import styles from './nozzles.module.css';
import { forwardRef, useImperativeHandle, useLayoutEffect, useState } from 'react';

export type NozzlesViewElement = {}

export type NozzlesViewProps = {}

export const NozzlesView = forwardRef<NozzlesViewElement, NozzlesViewProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();
    const pump = usePump();

    const [contextMenuNozzleIndex, setContextMenuNozzleIndex] = useState<number | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [menuState, setMenuState] = useState<'closed' | 'open'>('closed');
    const [sensors, setSensors] = useState<ISensor[]>(services.sensorsService.getSensors());
    const [clearNozzlesDialogOpen, setClearNozzlesDialogOpen] = useState<boolean>(false);
    const [syncNozzlesDialogOpen, setSyncNozzlesDialogOpen] = useState<boolean>(false);
    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);
    const [changeNameDialogOpen, setChangeNameDialogOpen] = useState<boolean>(false);
    const [calibrateDialogOpen, setCalibrateDialogOpen] = useState<boolean>(false);
    const [speedDialogOpen, setSpeedDialogOpen] = useState<boolean>(false);
    const [autoCalibratingDialogOpen, setAutoCalibratingDialogOpen] = useState<boolean>(false);
    const [flowRateDialogOpen, setFlowRateDialogOpen] = useState<boolean>(false);
    const [flowRate, setFlowRate] = useState<number>(0);

    const [ignoreNozzleDialogNozzleIndex, setIgnoreNozzleDialogNozzleIndex] = useState<number | null>(null);
    const [unignoreNozzleDialogNozzleIndex, setUnignoreNozzleDialogNozzleIndex] = useState<number | null>(null);
    const [changeNameDialogNozzleIndex, setChangeNameDialogNozzleIndex] = useState<number | null>(null);
    const [calibrateDialogNozzleIndex, setCalibrateDialogNozzleIndex] = useState<number | null>(null);

    const currentJob = useCurrentJob();

    useImperativeHandle(ref, () => ({

    }), []);

    const onNozzleItemClick = (nozzleIndex: number, position: { x: number, y: number }) => {
        setContextMenuNozzleIndex(nozzleIndex);
        setContextMenuPosition(position);
    }

    const onContextMenuBackgroundClick = () => {
        setContextMenuNozzleIndex(null);
        setContextMenuPosition(null);
    }

    const toggleMenu = () => {
        setMenuState(menuState === 'closed' ? 'open' : 'closed');
    }

    const closeMenu = () => {
        setMenuState('closed');
    }

    const onSyncNozzlesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setSyncNozzlesDialogOpen(true);

        closeMenu();
    }

    const onClearNozzlesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setClearNozzlesDialogOpen(true);
        closeMenu();
    }

    const getContextMenuItems = () => {

        let items: ContextMenuItem[] = [];

        if (contextMenuNozzleIndex === null) return [];

        const contextMenuSensor = sensors[contextMenuNozzleIndex];

        items.push({
            label: translate('Rename'),
            onClick: () => {
                setChangeNameDialogNozzleIndex(contextMenuNozzleIndex);
                setChangeNameDialogOpen(true);

                setContextMenuNozzleIndex(null);
                setContextMenuPosition(null);
            },
            icon: <i className="icon-pencil"></i>
        });

        if (contextMenuSensor.ignored) {
            items.push({
                label: translate('Unignore'),
                onClick: () => {
                    setUnignoreNozzleDialogNozzleIndex(contextMenuNozzleIndex);
                    setUnignoreNozzleDialogOpen(true);

                    setContextMenuNozzleIndex(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-volume-high"></i>
            });
        }
        else {
            items.push({
                label: translate('Ignore'),
                onClick: () => {
                    setIgnoreNozzleDialogNozzleIndex(contextMenuNozzleIndex);
                    setIgnoreNozzleDialogOpen(true);

                    setContextMenuNozzleIndex(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-volume-off"></i>
            });
        }

        if (contextMenuSensor.type === 'flowmeter') {
            items.push({
                label: translate('Calibrate'),
                onClick: () => {
                    setCalibrateDialogNozzleIndex(contextMenuNozzleIndex);
                    setCalibrateDialogOpen(true);

                    setContextMenuNozzleIndex(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-speedometer"></i>
            });
        }

        if (contextMenuSensor.type === 'flowmeter') {
            const hasDefaultName = contextMenuSensor.name.startsWith(translate('Flowmeter'));
            const newName = hasDefaultName ? translate('Optical sensor') + (contextMenuSensor.name.split(' ').length > 1 ? ' ' + contextMenuSensor.name.split(' ')[1] : '') : contextMenuSensor.name;
            items.push({
                label: translate('Change to optical sensor'),
                onClick: () => {
                    const newSensor: IOpticalSensor = {
                        name: newName,
                        type: 'optical',
                        ignored: contextMenuSensor.ignored,
                        lastPulseAge: 0
                    }

                    services.sensorsService.updateSensor(newSensor, contextMenuNozzleIndex);
                    setSensors(services.sensorsService.getSensors());

                    setContextMenuNozzleIndex(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-sensor"></i>
            });
        }

        if (contextMenuSensor.type === 'optical') {
            const hasDefaultName = contextMenuSensor.name.startsWith(translate('Optical sensor'));
            const newName = hasDefaultName ? translate('Flowmeter') + (contextMenuSensor.name.split(' ').length > 1 ? ' ' + contextMenuSensor.name.split(' ')[2] : '') : contextMenuSensor.name;
            items.push({
                label: translate('Change to flowmeter'),
                onClick: () => {
                    const newSensor: IFlowmeterSensor = {
                        name: newName,
                        type: 'flowmeter',
                        ignored: contextMenuSensor.ignored,
                        lastPulseAge: 0,
                        pulsesPerLiter: 350,
                        pulsesPerMinute: 0,
                        pulseCount: 0
                    }
                    services.sensorsService.updateSensor(newSensor, contextMenuNozzleIndex);
                    setSensors(services.sensorsService.getSensors());
                    setContextMenuNozzleIndex(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-sensor"></i>
            });
        }

        return items;
    }

    const onBackClick = () => {
        navigation.navigateBack();
    }

    return (
        <>
            <div className={styles.wrapper}>
                {navigation.previousPage === 'menu' &&
                    <TopBar
                        onBackClick={onBackClick}
                        title={translate('Sensors')}
                    />
                }
                <div
                    className={styles.menuButton}
                    onClick={toggleMenu}
                    data-state={menuState}
                >
                    <i className="icon-plus"></i>
                    <div className={`${styles.menuItem} ${styles.refreshButton}`}
                        onClick={onSyncNozzlesClick}
                    >
                        <i className="icon-autorenew"></i>
                    </div>
                    <div className={`${styles.menuItem} ${styles.calibrateButton}`}
                        onClick={() => {
                            setCalibrateDialogOpen(true);
                            setCalibrateDialogNozzleIndex(null);
                        }}
                    >
                        <i className="icon-speedometer"></i>
                    </div>
                    <div className={`${styles.menuItem} ${styles.autoCalibrateButton}`}
                        onClick={() => {
                            setFlowRateDialogOpen(true);
                        }}
                    >
                        <i className="icon-refresh-auto"></i>
                    </div>
                    <div className={`${styles.menuItem} ${styles.clearButton}`}
                        onClick={onClearNozzlesClick}
                    >
                        <i className="icon-broom"></i>
                    </div>
                </div>
                {sensors.length > 0 && (
                    <div className={styles.content}>
                        {sensors.map((sensor, index) => (
                            <NozzleItem
                                key={index}
                                index={index}
                                sensor={sensor}
                                onClick={onNozzleItemClick}
                            />
                        ))}
                    </div>
                )}
                {(sensors === undefined || sensors.length === 0) &&
                    <div className={styles.syncWrapper}>
                        <button className={styles.syncButton} onClick={onSyncNozzlesClick}>{translate('Add nozzles')}</button>
                    </div>
                }
            </div>
            {contextMenuNozzleIndex !== null && contextMenuPosition && (
                <ContextMenu
                    onBackgroundClick={onContextMenuBackgroundClick}
                    position={contextMenuPosition}
                    items={getContextMenuItems()} />
            )}
            {clearNozzlesDialogOpen &&
                <YesNoDialog
                    title={translate('Clear sensors')}
                    message={translate('Are you sure you want to clear all sensors?')}
                    onYesClick={async () => {
                        services.sensorsService.clearSensors();
                        setSensors(services.sensorsService.getSensors());

                        setClearNozzlesDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setClearNozzlesDialogOpen(false);
                    }}
                />
            }
            {syncNozzlesDialogOpen &&
                <NumberInputDialog
                    unit={translate('sensors')}
                    label={translate('Sensor count')}
                    title={translate('Reset sensors')}
                    onConfirmClick={(value) => {
                        const flowmeterSensors = services.sensorsService.generateFlowmeterSensors(value);
                        services.sensorsService.setSensors(flowmeterSensors);
                        setSensors(flowmeterSensors);

                        setSyncNozzlesDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setSyncNozzlesDialogOpen(false);
                    }}
                />
            }
            {ignoreNozzleDialogOpen && ignoreNozzleDialogNozzleIndex !== null &&
                <YesNoDialog
                    title={`${translate('Ignore')} ${sensors[ignoreNozzleDialogNozzleIndex].name}`}
                    message={translate('Are you sure you want to ignore this sensor?')}
                    onYesClick={() => {
                        const sensor = sensors[ignoreNozzleDialogNozzleIndex];
                        sensor.ignored = true;

                        services.sensorsService.updateSensor(sensor, ignoreNozzleDialogNozzleIndex);
                        setSensors(services.sensorsService.getSensors());
                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen && unignoreNozzleDialogNozzleIndex !== null &&
                <YesNoDialog
                    title={`${translate('Unignore ')} ${sensors[unignoreNozzleDialogNozzleIndex].name}`}
                    message={translate('Are you sure you want to unignore this sensor?')}
                    onYesClick={() => {
                        const sensor = sensors[unignoreNozzleDialogNozzleIndex];
                        sensor.ignored = false;

                        services.sensorsService.updateSensor(sensor, unignoreNozzleDialogNozzleIndex);
                        setSensors(services.sensorsService.getSensors());
                        setUnignoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setUnignoreNozzleDialogOpen(false);
                    }}
                />
            }
            {flowRateDialogOpen &&
                <NumberInputDialog
                    unit='L/ha'
                    label={translate('Expected flow')}
                    title={translate('Set expected flow')}
                    defaultValue={currentJob.job != undefined ? (currentJob.job.expectedFlow) : 0}
                    onConfirmClick={(value) => {
                        setFlowRate(value);

                        setFlowRateDialogOpen(false);
                        setSpeedDialogOpen(true);
                    }}
                    onCancelClick={() => {
                        setFlowRateDialogOpen(false);
                    }}
                />
            }
            {speedDialogOpen &&
                <NumberInputDialog
                    unit='km/h'
                    label={translate('Speed')}
                    title={translate('Set speed')}
                    defaultValue={10}
                    onConfirmClick={async (value) => {
                        const currentPumpOverridenState = pump.overriddenState;
                        pump.setOverridden('off');

                        const interval = 10000;
                        await services.dataFetcherService.setInterval(10000);

                        setSpeedDialogOpen(false);
                        setAutoCalibratingDialogOpen(true);

                        setTimeout(async () => {
                            const espData: ESPData = await services.dataFetcherService.fetchData();

                            await services.dataFetcherService.setInterval(SettingsService.getInterval());

                            const nozzleSpacing = currentJob.job?.nozzleSpacing || SettingsService.getNozzleSpacing();
                            const expectedFlow = (value * nozzleSpacing * 100 * flowRate) / 60000;

                            let newSensors = espData.sensors.map((sensor) => {
                                if (sensor.type !== 'flowmeter') return sensor;
                                const flowmeterSensor = sensor as IFlowmeterSensor;
                                const pulsesPerMinute = flowmeterSensor.pulseCount * (60000 / interval);
                                return {
                                    ...flowmeterSensor,
                                    pulsesPerLiter: Math.round(pulsesPerMinute / expectedFlow)
                                };
                            });

                            services.sensorsService.setSensors(newSensors);
                            services.sensorsService.setSensors(services.sensorsService.getSensors());

                            setSensors(services.sensorsService.getSensors());

                            setAutoCalibratingDialogOpen(false);
                            pump.setOverridden(currentPumpOverridenState);
                        }, 10500);
                    }}
                    onCancelClick={() => {
                        setSpeedDialogOpen(false);
                    }}
                />
            }
            {autoCalibratingDialogOpen &&
                <AutoCalibratingDialog />
            }
            {changeNameDialogOpen && changeNameDialogNozzleIndex !== null &&
                <TextInputDialog
                    label={translate('Sensor name')}
                    title={`${translate('Rename')} ${sensors[changeNameDialogNozzleIndex].name}`}
                    onConfirmClick={(name) => {
                        const sensor = sensors[changeNameDialogNozzleIndex];
                        sensor.name = name;
                        services.sensorsService.updateSensor(sensor, changeNameDialogNozzleIndex);
                        setSensors(services.sensorsService.getSensors());

                        setChangeNameDialogOpen(false);
                        setChangeNameDialogNozzleIndex(null);
                    }}
                    onCancelClick={() => {
                        setChangeNameDialogOpen(false);
                        setChangeNameDialogNozzleIndex(null);
                    }}
                />
            }
            {calibrateDialogOpen && calibrateDialogNozzleIndex !== null &&
                <NumberInputDialog
                    unit='pulses/L'
                    label={translate('Pulses/Liter')}
                    title={`${translate('Calibrate')} ${sensors[calibrateDialogNozzleIndex].name}`}
                    onConfirmClick={(value) => {
                        const sensor = sensors[calibrateDialogNozzleIndex] as IFlowmeterSensor;
                        sensor.pulsesPerLiter = value;
                        services.sensorsService.updateSensor(sensor, calibrateDialogNozzleIndex);
                        setSensors(services.sensorsService.getSensors());

                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzleIndex(null);
                    }}
                    onCancelClick={() => {
                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzleIndex(null);
                    }}
                />
            }
            {calibrateDialogOpen && calibrateDialogNozzleIndex === null &&
                <NumberInputDialog
                    unit='pulses/L'
                    label={translate('Pulses/Liter')}
                    title={translate('Calibrate flowmeters')}
                    onConfirmClick={(value) => {
                        const sensors = services.sensorsService.getSensors() as IFlowmeterSensor[];
                        for (let i = 0; i < sensors.length; i++) {
                            sensors[i].pulsesPerLiter = value;
                        }

                        services.sensorsService.setSensors(sensors);
                        setSensors(services.sensorsService.getSensors());
                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzleIndex(null);
                    }}
                    onCancelClick={() => {
                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzleIndex(null);
                    }}
                />
            }
        </>
    )
});

type NozzleItemElement = {

};

type NozzleItemProps = {
    onClick?: (nozzleIndex: number, position: { x: number, y: number }) => void;
    sensor: ISensor;
    index: number;
}

const NozzleItem = forwardRef<NozzleItemElement, NozzleItemProps>((props, ref) => {
    const translate = useTranslate();
    useImperativeHandle(ref, () => ({

    }), []);

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        props.onClick!(props.index, { x, y });
    }

    const getTypeLabel = () => {
        switch (props.sensor.type) {
            case 'flowmeter':
                return translate('Flowmeter');
            case 'optical':
                return translate('Optical sensor');
            default:
                return translate('Unknown');
        }
    }

    return (
        <div className={styles.jobItem} onClick={onClick}>
            <div className={styles.left}>
                <span>{props.sensor.name} {props.sensor.ignored ? <i className="icon-volume-off"></i> : <></>}</span>
                <span>{getTypeLabel()}</span>
            </div>
            {props.sensor.type === 'flowmeter' &&
                <div className={styles.right}>
                    <span>{(props.sensor as IFlowmeterSensor).pulsesPerLiter} {translate('pulses/L')}</span>
                </div>
            }
        </div>
    )
});

export type AutoCalibratingDialogElement = {}

export type AutoCalibratingDialogProps = {

}

export const AutoCalibratingDialog = forwardRef<AutoCalibratingDialogElement, AutoCalibratingDialogProps>((props, ref) => {
    const translate = useTranslate();
    const [progress, setProgress] = useState(0);

    useImperativeHandle(ref, () => ({

    }), []);

    useLayoutEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev === 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.background}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(0.1rem)",
                overflow: "hidden",
                zIndex: 3
            }}
        >
            <div className={styles.wrapper}
                style={{
                    position: "absolute",
                    height: "fit-content",
                    width: "fit-content",

                    backgroundColor: "var(--secondary-color)",

                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",

                    borderRadius: "1rem",
                    overflow: "hidden",

                    maxWidth: "75vw",

                    boxShadow: "0rem 0.1rem 0.25rem 0.25rem rgba(0, 0, 0, 0.15)"
                }}
            >
                <div className={styles.header}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1rem",
                        borderBottom: "1px solid var(--primary-color)",
                        backgroundColor: "var(--primary-color)",
                        width: "100%",
                    }}>
                    <span
                        style={{
                            color: "var(--secondary-font-color)",
                            fontSize: "1.25rem",
                        }}
                    >{translate('Auto calibration')}</span>
                </div>
                <div className={styles.content}
                    style={{
                        padding: "2rem 1rem 3rem 1rem",
                        gap: "1rem"
                    }}
                >
                    <span
                        style={{
                            whiteSpace: "pre-wrap",
                        }}
                    >{translate('Calibrating...')} ({progress.toFixed(0)}%)</span>
                    <div className={styles.progressBar}
                        style={{
                            backgroundColor: "rgb(200, 200, 200)",
                            borderRadius: "0.5rem",
                            overflow: "hidden",
                            height: "0.5rem",
                            width: "25vw"
                        }}
                    >
                        <div className={styles.progress} style={{
                            width: `${progress}%`,
                            height: "100%",
                            backgroundColor: "var(--primary-color)",
                            transition: "width 0.1s"
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
});