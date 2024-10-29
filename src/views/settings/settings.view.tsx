import { AdminContext, JobContext, NavFunctionsContext, useTranslate } from '../../App';
import { TopBar } from '../../components/top-bar/top-bar.component';
import { defaultLogoUri, defaultSettings, SettingsService } from '../../services/settings.service';
import styles from './settings.module.css';
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react';
import { Settings as SettingsType } from '../../types/settings.type';
import { TextInputDialog } from '../../components/text-input-dialog/text-input-dialog.component';
import { ContextMenu } from '../../components/context-menu/context-menu.component';
import { ColorInputDialog } from '../../components/color-input-dialog/color-input-dialog.component';

export type SettingsElement = {

}

export type SettingsProps = {

}

export const Settings = forwardRef<SettingsElement, SettingsProps>((props, ref) => {
    const translate = useTranslate();

    const { currentJob, setCurrentJob } = useContext(JobContext);
    const { currentPage, setCurrentPage } = useContext(NavFunctionsContext);

    const { isAdmin, setIsAdmin } = useContext(AdminContext);

    const [settings, setSettings] = useState<SettingsType | null>(null);
    const [logoUri, setLogoUri] = useState<string>('');

    const [ApiBaseUriDialogOpen, setApiBaseUriDialogOpen] = useState<boolean>(false);
    const [primaryColorDialogOpen, setPrimaryColorDialogOpen] = useState<boolean>(false);
    const [secondaryColorDialogOpen, setSecondaryColorDialogOpen] = useState<boolean>(false);
    const [primaryFontColorDialogOpen, setPrimaryFontColorDialogOpen] = useState<boolean>(false);
    const [secondaryFontColorDialogOpen, setSecondaryFontColorDialogOpen] = useState<boolean>(false);
    const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState<boolean>(false);

    const [languageContextMenuPosition, setLanguageContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [interfaceScaleContextMenuPosition, setInterfaceScaleContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [volumeUnitContextMenuPosition, setVolumeUnitContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [areaUnitContextMenuPosition, setAreaUnitContextMenuPosition] = useState<{ x: number, y: number } | null>(null);

    useImperativeHandle(ref, () => ({

    }), []);

    useEffect(() => {
        SettingsService.getSettings().then((settings) => {
            setSettings(settings);
        });
        SettingsService.getLogoUri().then((logoUri) => {
            setLogoUri(logoUri);
        });
    }, []);

    useEffect(() => {
        const eventHandler = async (settings: SettingsType) => {
            setSettings(settings);
        };
        SettingsService.addEventListener('onSettingsChanged', eventHandler);
        return () => {
            SettingsService.removeEventListener('onSettingsChanged', eventHandler);
        }
    }, [settings, setSettings]);

    const onBackClick = () => {
        setCurrentPage('menu');
    }

    const onLanguageClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        setLanguageContextMenuPosition({ x, y });
    }

    const onInterfaceScaleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        setInterfaceScaleContextMenuPosition({ x, y });
    }

    const onVolumeUnitClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        setVolumeUnitContextMenuPosition({ x, y });
    }

    const onAreaUnitClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const x = e.nativeEvent.clientX;
        const y = e.nativeEvent.clientY;

        setAreaUnitContextMenuPosition({ x, y });
    }

    const onContextMenuBackgroundClick = () => {
        setLanguageContextMenuPosition(null);
    }

    const onLogoClick = async () => {
        const image = await SettingsService.selectImage();
        const blob = new Blob([image], { type: image.type });
        console.log(blob)
        SettingsService.saveFile(blob)
    }

    return (
        <>
            {!currentJob &&
                <TopBar
                    onBackClick={onBackClick}
                    title={translate('Settings')}
                />
            }
            <div className={styles.content}>
                {isAdmin &&
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>
                            {translate('Development')}
                        </div>
                        <div className={styles.sectionContent}>
                            <div className={styles.item}
                                onClick={() => {
                                    SettingsService.setSettings(defaultSettings).then(() => {
                                        SettingsService.getSettings().then((settings) => {
                                            setSettings(settings);
                                        });
                                    });
                                    SettingsService.setLogoUri(defaultLogoUri).then(() => {
                                        SettingsService.getLogoUri().then((logoUri) => {
                                            setLogoUri(logoUri);
                                        });
                                    });
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Reset settings')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        {translate('General')}
                    </div>
                    <div className={styles.sectionContent}>
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    setApiBaseUriDialogOpen(true);
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('API Base URL')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <span>{settings?.apiBaseUrl}</span>
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                        <div className={styles.item}
                            onClick={onLanguageClick}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>{translate('Language')}</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.language}</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        {translate('Units of measurement')}
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.item}
                            onClick={onVolumeUnitClick}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>{translate('Volume')}</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.volumeUnit}</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                        <div className={styles.item}
                            onClick={onAreaUnitClick}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>{translate('Area')}</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.areaUnit}</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        {translate('Style')}
                    </div>
                    <div className={styles.sectionContent}>
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    setPrimaryColorDialogOpen(true);
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Primary color')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <div className={styles.colorBox} style={{ backgroundColor: settings?.primaryColor }}></div>
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    setSecondaryColorDialogOpen(true);
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Secondary color')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <div className={styles.colorBox} style={{ backgroundColor: settings?.secondaryColor }}></div>
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    setPrimaryFontColorDialogOpen(true);
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Primary font color')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <div className={styles.colorBox} style={{ backgroundColor: settings?.primaryFontColor }}></div>
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    setSecondaryFontColorDialogOpen(true);
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Secondary font color')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <div className={styles.colorBox} style={{ backgroundColor: settings?.secondaryFontColor }}></div>
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                        <div className={styles.item}
                            onClick={onInterfaceScaleClick}
                        >
                            <div className={styles.itemLeft}>
                                <span className={styles.itemName}>{translate('Interface scale')}</span>
                            </div>
                            <div className={styles.itemRight}>
                                <div className={styles.itemValue}>
                                    <span>{settings?.interfaceScale}x</span>
                                </div>
                                <i className="icon-unfold-more-horizontal"></i>
                            </div>
                        </div>
                        {isAdmin &&
                            <div className={styles.item}
                                onClick={() => {
                                    onLogoClick();
                                }}
                            >
                                <div className={styles.itemLeft}>
                                    <span className={styles.itemName}>{translate('Logo')}</span>
                                </div>
                                <div className={styles.itemRight}>
                                    <div className={styles.itemValue}>
                                        <img src={logoUri} />
                                    </div>
                                    <i className="icon-thin-chevron-right"></i>
                                </div>
                            </div>
                        }
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionTitle}>
                            {translate('Advanced')}
                        </div>
                        <div className={styles.sectionContent}>
                            {!isAdmin &&
                                <div className={styles.item}
                                    onClick={() => {
                                        setAdminPasswordDialogOpen(true);
                                    }}
                                >
                                    <div className={styles.itemLeft}>
                                        <span className={styles.itemName}>{translate('Enter administrator mode')}</span>
                                    </div>
                                    <div className={styles.itemRight}>
                                        <i className="icon-thin-chevron-right"></i>
                                    </div>
                                </div>
                            }
                            {isAdmin &&
                                <div className={styles.item}
                                    onClick={() => {
                                        setIsAdmin(false);
                                    }}
                                >
                                    <div className={styles.itemLeft}>
                                        <span className={styles.itemName}>{translate('Exit administrator mode')}</span>
                                    </div>
                                    <div className={styles.itemRight}>
                                        <i className="icon-thin-chevron-right"></i>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {ApiBaseUriDialogOpen &&
                <TextInputDialog
                    title='Set API Base URI'
                    label='API Base URI'
                    defaultValue={settings?.apiBaseUrl}
                    onConfirmClick={(value: string) => {
                        SettingsService.setApiBaseUrl(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setApiBaseUriDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setApiBaseUriDialogOpen(false);
                    }}
                />
            }
            {primaryColorDialogOpen &&
                <ColorInputDialog
                    title='Set primary color'
                    label='Primary color'
                    defaultValue={settings?.primaryColor}
                    onConfirmClick={(value: string) => {
                        SettingsService.setPrimaryColor(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setPrimaryColorDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setPrimaryColorDialogOpen(false);
                    }}
                />
            }
            {secondaryColorDialogOpen &&
                <ColorInputDialog
                    title='Set secondary color'
                    label='Secondary color'
                    defaultValue={settings?.secondaryColor}
                    onConfirmClick={(value: string) => {
                        SettingsService.setSecondaryColor(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setSecondaryColorDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setSecondaryColorDialogOpen(false);
                    }}
                />
            }
            {primaryFontColorDialogOpen &&
                <ColorInputDialog
                    title='Set primary font color'
                    label='Primary font color'
                    defaultValue={settings?.primaryFontColor}
                    onConfirmClick={(value: string) => {
                        SettingsService.setPrimaryFontColor(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setPrimaryFontColorDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setPrimaryFontColorDialogOpen(false);
                    }}
                />
            }
            {
                secondaryFontColorDialogOpen &&
                <ColorInputDialog
                    title='Set secondary font color'
                    label='Secondary font color'
                    defaultValue={settings?.secondaryFontColor}
                    onConfirmClick={(value: string) => {
                        SettingsService.setSecondaryFontColor(value).then(() => {
                            SettingsService.getSettings().then((settings) => {
                                setSettings(settings);
                            });
                        });
                        setSecondaryFontColorDialogOpen(false);
                    }}
                    onCancelClick={() => {
                        setSecondaryFontColorDialogOpen(false);
                    }}
                />
            }
            {languageContextMenuPosition &&
                <ContextMenu
                    items={[
                        {
                            label: 'English',
                            onClick: () => {
                                SettingsService.setLanguage('en-us');
                            }
                        },
                        {
                            label: 'Português',
                            onClick: () => {
                                SettingsService.setLanguage('pt-br');
                            }
                        }
                    ]}
                    position={languageContextMenuPosition}

                    onBackgroundClick={onContextMenuBackgroundClick}
                />
            }
            {volumeUnitContextMenuPosition &&
                <ContextMenu
                    items={[
                        {
                            label: translate('Liters'),
                            onClick: () => {
                                SettingsService.setVolumeUnit('L').then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: translate('Gallons'),
                            onClick: () => {
                                SettingsService.setVolumeUnit('gal').then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        }
                    ]}
                    position={volumeUnitContextMenuPosition}

                    onBackgroundClick={() => {
                        setVolumeUnitContextMenuPosition(null);
                    }}
                />
            }
            {areaUnitContextMenuPosition &&
                <ContextMenu
                    items={[
                        {
                            label: translate('Hectares'),
                            onClick: () => {
                                SettingsService.setAreaUnit('ha').then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: translate('Square meters'),
                            onClick: () => {
                                SettingsService.setAreaUnit('m²').then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        }
                    ]}
                    position={areaUnitContextMenuPosition}

                    onBackgroundClick={() => {
                        setAreaUnitContextMenuPosition(null);
                    }}
                />
            }
            {interfaceScaleContextMenuPosition &&
                <ContextMenu
                    items={[
                        {
                            label: '0.5x',
                            onClick: () => {
                                SettingsService.setInterfaceScale(0.5).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: '0.75x',
                            onClick: () => {
                                SettingsService.setInterfaceScale(0.75).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: '1.0x',
                            onClick: () => {
                                SettingsService.setInterfaceScale(1).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: '1.5x',
                            onClick: () => {
                                SettingsService.setInterfaceScale(1.5).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        },
                        {
                            label: '2.0x',
                            onClick: () => {
                                SettingsService.setInterfaceScale(2).then(() => {
                                    SettingsService.getSettings().then((settings) => {
                                        setSettings(settings);
                                    });
                                });
                            }
                        }
                    ]}
                    position={interfaceScaleContextMenuPosition}

                    onBackgroundClick={() => {
                        setInterfaceScaleContextMenuPosition(null);
                    }}
                />
            }
            {adminPasswordDialogOpen &&
                <TextInputDialog
                    title={translate('Admin access')}
                    label={translate('Admin password')}
                    type='password'
                    onConfirmClick={(value: string) => {
                        if (value === 'admin') {
                            setIsAdmin(true);
                            setAdminPasswordDialogOpen(false);
                        }
                        else {
                            alert('Wrong password');
                        }
                    }}
                    onCancelClick={() => {
                        setAdminPasswordDialogOpen(false);
                    }}
                />
            }
        </>
    )
});