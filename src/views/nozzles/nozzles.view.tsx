import { JobContext } from '../../App';
import { ContextMenu, ContextMenuItem } from '../../components/context-menu/context-menu.component';
import { NumberInputDialog } from '../../components/number-input-dialog/number-input-dialog.component';
import { NumberInput } from '../../components/number-input/number-input.component';
import { TextInputDialog } from '../../components/text-input-dialog/text-input-dialog.component';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { YesNoDialog } from '../../components/yes-no-dialog/yes-no-dialog.component';
import { DataFecherService } from '../../services/data-fetcher.service';
import { NozzlesService } from '../../services/nozzles.service';
import { Nozzle } from '../../types/nozzle.type';
import styles from './nozzles.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';

export type NozzlesViewElement = {

}

export type NozzlesViewProps = {
    onBackClick: () => void;
}

export const NozzlesView = forwardRef<NozzlesViewElement, NozzlesViewProps>((props, ref) => {
    const { currentJob, setCurrentJob } = useContext<any>(JobContext);

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
            label: 'Rename',
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
                label: 'Unignore',
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
                label: 'Ignore',
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
            label: 'calibrate',
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
        props.onBackClick();
    }

    return (
        <>
            <div className={styles.wrapper}>
                {!currentJob &&
                    <TopBar
                        onBackClick={onBackClick}
                        title='Nozzles'
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
                        <span>There is no synchronized nozzle.</span>
                        <span>Click the button bellow to synchronize.</span>
                        <button className={styles.syncButton} onClick={onSyncNozzlesClick}>Synchronize</button>
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
                    title='Clear nozzles'
                    message='Are you sure you want to clear all nozzles?'
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
                    label='Nozzle count'
                    title='Reset nozzles'
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
                // <YesNoDialog
                //     title='Sync nozzles'
                //     message='Are you sure you want to resync all nozzles?'
                //     onYesClick={() => {
                //         // DataFecherService.syncNozzles().then(() => {
                //         //     NozzlesService.getActiveNozzles().then((nozzles) => {
                //         //         nozzles = nozzles.sort((a, b) => a.index - b.index);
                //         //         setNozzles(nozzles);
                //         //     });
                //         // });

                //         NozzlesService.generateNozzles(20).then((nozzles) => {
                //             setNozzles(nozzles);
                //         });

                //         setSyncNozzlesDialogOpen(false);
                //     }}

                //     onNoClick={() => {
                //         setSyncNozzlesDialogOpen(false);
                //     }}
                // />
            }
            {ignoreNozzleDialogOpen && ignoreNozzleDialogNozzleIndex !== null &&
                <YesNoDialog
                    title='Ignore nozzle'
                    message='Are you sure you want to ignore this nozzle?'
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
                    title='Unignore nozzle'
                    message='Are you sure you want to unignore this nozzle?'
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
            {changeNameDialogOpen && changeNameDialogNozzleIndex !== null &&
                <TextInputDialog
                    label='Nozzle name'
                    title='Change nozzle name'
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
                    label='Pulses/Liter'
                    title='Calibrate nozzle'
                    onConfirmClick={(value) => {
                        DataFecherService.calibrateNozzle(calibrateDialogNozzleIndex, value).then(async () => {
                            const nozzle = nozzles[calibrateDialogNozzleIndex];
                            nozzle.pulsesPerLiter = value;
                            await NozzlesService.updateNozzle(nozzle, calibrateDialogNozzleIndex);
                            NozzlesService.getNozzles().then((nozzles) => {
                                setNozzles(nozzles);
                            });
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
                    label='Pulses/Liter'
                    title='Calibrate nozzles'
                    onConfirmClick={async (value) => {
                        DataFecherService.calibrateAllNozzles(value).then(async () => {
                            const nozzles = await NozzlesService.getNozzles();
                            for (let i = 0; i < nozzles.length; i++) {
                                nozzles[i].pulsesPerLiter = value;
                            }

                            await NozzlesService.setNozzles(nozzles);

                            NozzlesService.getNozzles().then((nozzles) => {
                                setNozzles(nozzles);
                            });
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
                <span>{props.nozzle.pulsesPerLiter} pulses/L</span>
            </div>
        </div>
    )
});