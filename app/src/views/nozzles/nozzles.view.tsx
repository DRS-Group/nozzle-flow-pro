import { ContextMenu, ContextMenuItem } from '../../components/context-menu/context-menu.component';
import { NumberInputDialog } from '../../components/number-input-dialog/number-input-dialog.component';
import { TextInputDialog } from '../../components/text-input-dialog/text-input-dialog.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { YesNoDialog } from '../../components/yes-no-dialog/yes-no-dialog.component';
import { services } from '../../dependency-injection';
import { useCurrentJob } from '../../hooks/useCurrentJob';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslate } from '../../hooks/useTranslate';
import { DataFecherService } from '../../services/data-fetcher.service';
import { NozzlesService } from '../../services/nozzles.service';
import { SettingsService } from '../../services/settings.service';
import { ESPData } from '../../types/ESP-data.type';
import { Nozzle } from '../../types/nozzle.type';
import styles from './nozzles.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type NozzlesViewElement = {}

export type NozzlesViewProps = {}

export const NozzlesView = forwardRef<NozzlesViewElement, NozzlesViewProps>((props, ref) => {
    const translate = useTranslate();
    const navigation = useNavigation();

    const [contextMenuNozzleIndex, setContextMenuNozzleIndex] = useState<number | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [menuState, setMenuState] = useState<'closed' | 'open'>('closed');
    const [nozzles, setNozzles] = useState<Nozzle[]>([]);
    const [clearNozzlesDialogOpen, setClearNozzlesDialogOpen] = useState<boolean>(false);
    const [syncNozzlesDialogOpen, setSyncNozzlesDialogOpen] = useState<boolean>(false);
    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);
    const [changeNameDialogOpen, setChangeNameDialogOpen] = useState<boolean>(false);
    const [calibrateDialogOpen, setCalibrateDialogOpen] = useState<boolean>(false);
    const [speedDialogOpen, setSpeedDialogOpen] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(0);
    const [flowRateDialogOpen, setFlowRateDialogOpen] = useState<boolean>(false);
    const [flowRate, setFlowRate] = useState<number>(0);

    const [ignoreNozzleDialogNozzleIndex, setIgnoreNozzleDialogNozzleIndex] = useState<number | null>(null);
    const [unignoreNozzleDialogNozzleIndex, setUnignoreNozzleDialogNozzleIndex] = useState<number | null>(null);
    const [changeNameDialogNozzleIndex, setChangeNameDialogNozzleIndex] = useState<number | null>(null);
    const [calibrateDialogNozzleIndex, setCalibrateDialogNozzleIndex] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        NozzlesService.getNozzles().then((nozzles) => {
            setNozzles(nozzles);
        });
    }, []);

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

        const contextMenuNozzle = nozzles[contextMenuNozzleIndex];

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

        if (contextMenuNozzle.ignored) {
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

        items.push({
            label: translate('Calibrate'),
            onClick: () => {
                setCalibrateDialogNozzleIndex(contextMenuNozzleIndex);
                setCalibrateDialogOpen(true);

                setContextMenuNozzleIndex(null);
                setContextMenuPosition(null);
            },
            icon: <i className="icon-speedometer-black"></i>
        });

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
                        title={translate('Nozzles')}
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
                        <i className="icon-speedometer-black"></i>
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
                {nozzles.length > 0 && (
                    <div className={styles.content}>
                        {nozzles.map((nozzle, index) => (
                            <NozzleItem
                                key={index}
                                index={index}
                                nozzle={nozzle}
                                onClick={onNozzleItemClick}
                            />
                        ))}
                    </div>
                )}
                {nozzles === undefined || nozzles.length === 0 &&
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
                    title={translate('Clear nozzles')}
                    message={translate('Are you sure you want to clear all nozzles?')}
                    onYesClick={async () => {
                        NozzlesService.clearNozzles();
                        NozzlesService.getNozzles().then((nozzles) => {
                            setNozzles(nozzles);
                        });

                        setClearNozzlesDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setClearNozzlesDialogOpen(false);
                    }}
                />
            }
            {syncNozzlesDialogOpen &&
                <NumberInputDialog
                    unit='nozzles'
                    label={translate('Nozzle count')}
                    title={translate('Reset nozzles')}
                    onConfirmClick={(value) => {
                        NozzlesService.generateNozzles(value).then((nozzles) => {
                            setNozzles(nozzles);
                        });

                        setSyncNozzlesDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setSyncNozzlesDialogOpen(false);
                    }}
                />
            }
            {ignoreNozzleDialogOpen && ignoreNozzleDialogNozzleIndex !== null &&
                <YesNoDialog
                    title={translate('Ignore nozzle')}
                    message={translate('Are you sure you want to ignore this nozzle?')}
                    onYesClick={() => {
                        const nozzle = nozzles[ignoreNozzleDialogNozzleIndex];
                        nozzle.ignored = true;

                        NozzlesService.updateNozzle(nozzle, ignoreNozzleDialogNozzleIndex);

                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen && unignoreNozzleDialogNozzleIndex !== null &&
                <YesNoDialog
                    title={translate('Unignore nozzle')}
                    message={translate('Are you sure you want to unignore this nozzle?')}
                    onYesClick={() => {
                        const nozzle = nozzles[unignoreNozzleDialogNozzleIndex];
                        nozzle.ignored = false;

                        NozzlesService.updateNozzle(nozzle, unignoreNozzleDialogNozzleIndex);

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
                    defaultValue={0}
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
                        setSpeed(value);

                        setSpeedDialogOpen(false);

                        const espData: ESPData = await services.dataFetcherService.fetchData();
                        const nozzleSpacing = await SettingsService.getSettingOrDefault('nozzleSpacing', 0.6);
                        const expectedFlow = (value * nozzleSpacing * 100 * flowRate) / 60000;


                        let newNozzles = espData.nozzles.map((nozzle) => {
                            const pulsesPerMinute = nozzle.pulsesPerMinute;
                            return {
                                ...nozzle,
                                pulsesPerLiter: Math.round(pulsesPerMinute / expectedFlow)
                            };
                        });

                        await NozzlesService.setNozzles(newNozzles);

                        NozzlesService.getNozzles().then((nozzles) => {
                            setNozzles(nozzles);
                        });
                    }}
                    onCancelClick={() => {
                        setSpeedDialogOpen(false);
                    }}
                />
            }
            {changeNameDialogOpen && changeNameDialogNozzleIndex !== null &&
                <TextInputDialog
                    label={translate('Nozzle name')}
                    title={translate('Change nozzle name')}
                    onConfirmClick={(name) => {
                        const nozzle = nozzles[changeNameDialogNozzleIndex];
                        nozzle.name = name;
                        NozzlesService.updateNozzle(nozzle, changeNameDialogNozzleIndex);

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
                    title={translate('Calibrate nozzle')}
                    onConfirmClick={async (value) => {
                        const nozzle = nozzles[calibrateDialogNozzleIndex];
                        nozzle.pulsesPerLiter = value;
                        await NozzlesService.updateNozzle(nozzle, calibrateDialogNozzleIndex);
                        NozzlesService.getNozzles().then((nozzles) => {
                            setNozzles(nozzles);
                        });

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
                    title={translate('Calibrate nozzles')}
                    onConfirmClick={async (value) => {
                        const nozzles = await NozzlesService.getNozzles();
                        for (let i = 0; i < nozzles.length; i++) {
                            nozzles[i].pulsesPerLiter = value;
                        }

                        await NozzlesService.setNozzles(nozzles);

                        NozzlesService.getNozzles().then((nozzles) => {
                            setNozzles(nozzles);
                        });

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
    nozzle: Nozzle;
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

    return (
        <div className={styles.jobItem} onClick={onClick}>
            <div className={styles.left}>
                <span>{props.nozzle.name}</span>
                {/* <span>{props.nozzle.id}</span> */}
            </div>
            <div className={styles.right}>
                <span>{props.nozzle.pulsesPerLiter} {translate('pulses/L')}</span>
            </div>
        </div>
    )
});