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

    const [contextMenuNozzle, setContextMenuNozzle] = useState<Nozzle | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [menuState, setMenuState] = useState<'closed' | 'open'>('closed');
    const [nozzles, setNozzles] = useState<Nozzle[]>([]);
    const [clearNozzlesDialogOpen, setClearNozzlesDialogOpen] = useState<boolean>(false);
    const [syncNozzlesDialogOpen, setSyncNozzlesDialogOpen] = useState<boolean>(false);
    const [ignoreNozzleDialogOpen, setIgnoreNozzleDialogOpen] = useState<boolean>(false);
    const [unignoreNozzleDialogOpen, setUnignoreNozzleDialogOpen] = useState<boolean>(false);
    const [changeNameDialogOpen, setChangeNameDialogOpen] = useState<boolean>(false);
    const [calibrateDialogOpen, setCalibrateDialogOpen] = useState<boolean>(false);

    const [ignoreNozzleDialogNozlle, setIgnoreNozzleDialogNozzle] = useState<Nozzle | null>(null);
    const [unignoreNozzleDialogNozlle, setUnignoreNozzleDialogNozzle] = useState<Nozzle | null>(null);
    const [changeNameDialogNozzle, setChangeNameDialogNozzle] = useState<Nozzle | null>(null);
    const [calibrateDialogNozzle, setCalibrateDialogNozzle] = useState<Nozzle | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        NozzlesService.getActiveNozzles().then((nozzles) => {
            nozzles = nozzles.sort((a, b) => a.index - b.index);
            setNozzles(nozzles);
        });
    }, []);

    const onNozzleItemClick = (nozzle: Nozzle, position: { x: number, y: number }) => {
        setContextMenuNozzle(nozzle);
        setContextMenuPosition(position);
    }

    const onContextMenuBackgroundClick = () => {
        setContextMenuNozzle(null);
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

        if (contextMenuNozzle === null) return [];

        items.push({
            label: 'Rename',
            onClick: () => {
                setChangeNameDialogNozzle(contextMenuNozzle);
                setChangeNameDialogOpen(true);

                setContextMenuNozzle(null);
                setContextMenuPosition(null);
            },
            icon: <i className="icon-pencil"></i>
        });

        if (contextMenuNozzle.ignored) {
            items.push({
                label: 'Unignore',
                onClick: () => {
                    setUnignoreNozzleDialogNozzle(contextMenuNozzle);
                    setUnignoreNozzleDialogOpen(true);

                    setContextMenuNozzle(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-volume-high"></i>
            });
        }
        else {
            items.push({
                label: 'Ignore',
                onClick: () => {
                    setIgnoreNozzleDialogNozzle(contextMenuNozzle);
                    setIgnoreNozzleDialogOpen(true);

                    setContextMenuNozzle(null);
                    setContextMenuPosition(null);
                },
                icon: <i className="icon-volume-off"></i>
            });
        }

        items.push({
            label: 'calibrate',
            onClick: () => {
                setCalibrateDialogNozzle(contextMenuNozzle);
                setCalibrateDialogOpen(true);

                setContextMenuNozzle(null);
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
                            setCalibrateDialogNozzle(null);
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
            {contextMenuNozzle && contextMenuPosition && (
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
                        // const allNozzles = await NozzlesService.getNozzles();
                        // for (let i = 0; i < allNozzles.length; i++) {
                        //     allNozzles[i].index = -1;
                        // }
                        // NozzlesService.setNozzles(allNozzles);
                        NozzlesService.setNozzles([]);
                        NozzlesService.getActiveNozzles().then((nozzles) => {
                            nozzles = nozzles.sort((a, b) => a.index - b.index);
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
                <YesNoDialog
                    title='Sync nozzles'
                    message='Are you sure you want to resync all nozzles?'
                    onYesClick={() => {
                        DataFecherService.syncNozzles().then(() => {
                            NozzlesService.getActiveNozzles().then((nozzles) => {
                                nozzles = nozzles.sort((a, b) => a.index - b.index);
                                setNozzles(nozzles);
                            });
                        });

                        setSyncNozzlesDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setSyncNozzlesDialogOpen(false);
                    }}
                />
            }
            {ignoreNozzleDialogOpen &&
                <YesNoDialog
                    title='Ignore nozzle'
                    message='Are you sure you want to ignore this nozzle?'
                    onYesClick={() => {
                        ignoreNozzleDialogNozlle!.ignored = true;
                        NozzlesService.updateNozzle(ignoreNozzleDialogNozlle!);

                        setIgnoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setIgnoreNozzleDialogOpen(false);
                    }}
                />
            }
            {unignoreNozzleDialogOpen &&
                <YesNoDialog
                    title='Unignore nozzle'
                    message='Are you sure you want to unignore this nozzle?'
                    onYesClick={() => {
                        unignoreNozzleDialogNozlle!.ignored = false;
                        NozzlesService.updateNozzle(unignoreNozzleDialogNozlle!);

                        setUnignoreNozzleDialogOpen(false);
                    }}

                    onNoClick={() => {
                        setUnignoreNozzleDialogOpen(false);
                    }}
                />
            }
            {changeNameDialogOpen &&
                <TextInputDialog
                    label='Nozzle name'
                    title='Change nozzle name'
                    onConfirmClick={(name) => {
                        changeNameDialogNozzle!.name = name;
                        NozzlesService.updateNozzle(changeNameDialogNozzle!);

                        setChangeNameDialogOpen(false);
                        setChangeNameDialogNozzle(null);
                    }}
                    onCancelClick={() => {
                        setChangeNameDialogOpen(false);
                        setChangeNameDialogNozzle(null);
                    }}
                />
            }
            {calibrateDialogOpen && calibrateDialogNozzle &&
                <NumberInputDialog
                    label='Pulses/Liter'
                    title='Calibrate nozzle'
                    onConfirmClick={(value) => {
                        DataFecherService.calibrateNozzle(calibrateDialogNozzle!.id, value).then(() => {

                            calibrateDialogNozzle!.pulsesPerLiter = value;
                            NozzlesService.updateNozzle(calibrateDialogNozzle!);
                        });

                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzle(null);
                    }}
                    onCancelClick={() => {
                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzle(null);
                    }}
                />
            }
            {calibrateDialogOpen && calibrateDialogNozzle === null &&
                <NumberInputDialog
                    label='Pulses/Liter'
                    title='Calibrate nozzle'
                    onConfirmClick={async (value) => {
                        DataFecherService.calibrateAllNozzles(value).then(async () => {


                            const nozzles = await NozzlesService.getNozzles();
                            for (let i = 0; i < nozzles.length; i++) {
                                nozzles[i].pulsesPerLiter = value;
                            }

                            NozzlesService.setNozzles(nozzles);

                            NozzlesService.getActiveNozzles().then((nozzles) => {
                                nozzles = nozzles.sort((a, b) => a.index - b.index);
                                setNozzles(nozzles);
                            });
                        });

                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzle(null);
                    }}
                    onCancelClick={() => {
                        setCalibrateDialogOpen(false);
                        setCalibrateDialogNozzle(null);
                    }}
                />
            }
        </>
    )
});

type NozzleItemElement = {

};

type NozzleItemProps = {
    onClick?: (nozzle: Nozzle, position: { x: number, y: number }) => void;
    nozzle: Nozzle;
}

const NozzleItem = forwardRef<NozzleItemElement, NozzleItemProps>((props, ref) => {
    useImperativeHandle(ref, () => ({

    }), []);

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        props.onClick!(props.nozzle, { x, y });
    }

    return (
        <div className={styles.jobItem} onClick={onClick}>
            <div className={styles.left}>
                <span>{props.nozzle.name}</span>
                <span>{props.nozzle.id}</span>
            </div>
            <div className={styles.right}>
                <span>{props.nozzle.pulsesPerLiter} pulses/L</span>
            </div>
        </div>
    )
});